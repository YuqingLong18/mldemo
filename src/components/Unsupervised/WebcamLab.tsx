import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadMobileNet, getEmbedding } from '../../lib/ml/mobilenet';
import { kMeans } from '../../lib/ml/kmeans';
import { computePCA } from '../../lib/ml/pca';
import { processImageFile } from '../../lib/imageUtils';
import CameraView, { type CameraHandle } from '../CameraView';
import { Loader2, Camera, Play, RefreshCw, Upload, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import StudentStatusIndicator from '../Classroom/StudentStatusIndicator';
import clsx from 'clsx';
import { useClassroom, type FeaturedSnapshotPayload, type UnsupervisedSnapshot } from '../../lib/classroom/ClassroomContext';

interface DataPoint {
    id: string;
    embedding: number[];
    x?: number; // PCA projected X
    y?: number; // PCA projected Y
    cluster?: number;
    imageUrl?: string; // Captured image data URL
}

interface WebcamLabProps {
    readOnly?: boolean;
    snapshot?: UnsupervisedSnapshot;
}

export default function WebcamLab({ readOnly = false, snapshot }: WebcamLabProps) {
    const { t } = useLanguage();
    const { onRequestModel, sendModelData, isTeacher } = useClassroom();
    const cameraRef = useRef<CameraHandle>(null);
    const mobilenetRef = useRef<any>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [points, setPoints] = useState<DataPoint[]>(
        snapshot?.projectedPoints?.length ? snapshot.projectedPoints : (snapshot?.points || [])
    );
    const [k, setK] = useState(snapshot?.k || 3);
    const [clusters, setClusters] = useState<{ centroid: number[], pointIds: string[] }[]>(snapshot?.clusters || []);
    const [centroids, setCentroids] = useState<number[][] | null>(snapshot?.centroids || null); // For stateful K-Means
    const [isConverged, setIsConverged] = useState(snapshot?.converged || false);
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
    const [uploadedThumbnails, setUploadedThumbnails] = useState<Array<{ id: string; thumbnail: string; fileName: string }>>([]);

    // Load Model
    useEffect(() => {
        if (readOnly) {
            setIsModelLoading(false);
            return;
        }

        async function init() {
            try {
                setIsModelLoading(true);
                await tf.ready();
                mobilenetRef.current = await loadMobileNet();
                setError(null);
            } catch (err) {
                console.error("Model load error:", err);
                setError(t('unsupervised.loading_error') || "Failed to load MobileNet model.");
            } finally {
                setIsModelLoading(false);
            }
        }
        init();
    }, [readOnly, t]);

    // Compute PCA when points change
    const [projectedPoints, setProjectedPoints] = useState<DataPoint[]>(snapshot?.projectedPoints || []);
    const snapshotRef = useRef<UnsupervisedSnapshot>({
        points: snapshot?.projectedPoints?.length ? snapshot.projectedPoints : (snapshot?.points || []),
        clusters: snapshot?.clusters || [],
        centroids: snapshot?.centroids || null,
        k: snapshot?.k || 3,
        converged: snapshot?.converged || false,
        projectedPoints: snapshot?.projectedPoints
    });

    useEffect(() => {
        snapshotRef.current = {
            points: projectedPoints.length > 0 ? projectedPoints : points,
            clusters,
            centroids,
            k,
            converged: isConverged
        };
    }, [points, projectedPoints, clusters, centroids, k, isConverged]);

    useEffect(() => {
        if (snapshot) {
            const basePoints = snapshot.projectedPoints?.length
                ? snapshot.projectedPoints
                : (snapshot.points || []);
            setPoints(basePoints);
            setClusters(snapshot.clusters || []);
            setCentroids(snapshot.centroids || null);
            setK(snapshot.k || 3);
            setIsConverged(snapshot.converged || false);
            if (snapshot.projectedPoints) {
                setProjectedPoints(snapshot.projectedPoints);
            }
        }
    }, [snapshot]);

    useEffect(() => {
        if (points.length === 0) {
            setProjectedPoints([]);
            return;
        }

        if (readOnly && points.every(p => typeof p.x === 'number' && typeof p.y === 'number')) {
            setProjectedPoints(points);
            return;
        }

        const runPCA = async () => {
            // PCA needs at least 3 points to be stable
            if (points.length < 3) {
                setProjectedPoints(points.map(p => ({ ...p, x: 0.5, y: 0.5 })));
                return;
            }

            try {
                setError(null);
                console.log("Starting PCA with", points.length, "points");
                console.time("PCA_Computation");

                const embeddings = points.map(p => p.embedding);
                const reduced = await computePCA(embeddings);

                console.timeEnd("PCA_Computation");

                // Normalize 2D points to 0-1 for visualization
                const xs = reduced.map(r => r[0]);
                const ys = reduced.map(r => r[1]);

                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                const rangeX = maxX - minX || 1;
                const rangeY = maxY - minY || 1;

                const newPoints = points.map((p, i) => ({
                    ...p,
                    x: (xs[i] - minX) / rangeX,
                    y: (ys[i] - minY) / rangeY
                }));
                setProjectedPoints(newPoints);
            } catch (err: any) {
                console.error("PCA failed", err);
                setError(`PCA Calculation Failed: ${err.message}`);
                // Fallback: Keep centered stacked
                setProjectedPoints(points.map(p => ({ ...p, x: 0.5, y: 0.5 })));
            }
        };

        runPCA();
    }, [points, readOnly]);

    useEffect(() => {
        if (readOnly || isTeacher) return;

        onRequestModel(() => {
            const payload: FeaturedSnapshotPayload = {
                mode: 'unsupervised',
                unsupervised: snapshotRef.current
            };
            sendModelData(payload);
        });
    }, [onRequestModel, sendModelData, readOnly, isTeacher]);

    const handleCapture = async () => {
        if (readOnly) return;
        if (!mobilenetRef.current || !cameraRef.current?.video) return;

        try {
            // Capture image as Data URL
            let imageUrl: string | undefined;
            if (cameraRef.current.video) {
                const canvas = document.createElement('canvas');
                canvas.width = cameraRef.current.video.videoWidth;
                canvas.height = cameraRef.current.video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(cameraRef.current.video, 0, 0);
                    imageUrl = canvas.toDataURL('image/jpeg', 0.8);
                    console.log("Captured Image URL, length:", imageUrl.length);
                } else {
                    console.error("Failed to get 2D context for capture");
                }
            } else {
                console.error("Camera video element not found during capture");
            }

            // Get embedding
            const embeddingTensor = getEmbedding(mobilenetRef.current, cameraRef.current.video);
            const embeddingSync = await embeddingTensor.array() as number[];
            embeddingTensor.dispose();

            // Sanity Check for NaNs
            if (embeddingSync.some(n => isNaN(n) || !isFinite(n))) {
                throw new Error("Captured embedding contains invalid numbers (NaN/Infinity).");
            }

            const newPoint: DataPoint = {
                id: Date.now().toString(),
                embedding: embeddingSync,
                imageUrl
            };

            setPoints(prev => [...prev, newPoint]);
            // Clear clusters when new data added
            setClusters([]);
            setError(null);
        } catch (err: any) {
            console.error("Capture failed", err);
            setError(`Capture Failed: ${err.message}`);
        }
    };

    const handleUploadClick = () => {
        if (readOnly) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (readOnly) return;
        const files = e.target.files;
        if (!files || files.length === 0 || !mobilenetRef.current) return;

        setIsUploading(true);
        setUploadProgress({ current: 0, total: files.length });
        setError(null);

        const fileArray = Array.from(files);
        const newPoints: DataPoint[] = [];
        const newThumbnails: Array<{ id: string; thumbnail: string; fileName: string }> = [];

        // Process each file sequentially
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            try {
                console.log(`Processing upload ${i + 1}/${fileArray.length}: ${file.name}`);
                
                // Process the image file
                const processed = await processImageFile(file);
                
                // Get embedding from the image element
                const embeddingTensor = getEmbedding(mobilenetRef.current, processed.element);
                const embeddingSync = await embeddingTensor.array() as number[];
                embeddingTensor.dispose();

                // Sanity Check for NaNs
                if (embeddingSync.some(n => isNaN(n) || !isFinite(n))) {
                    throw new Error("Embedding contains invalid numbers (NaN/Infinity).");
                }

                const pointId = `${Date.now()}-${i}-${Math.random()}`;
                const newPoint: DataPoint = {
                    id: pointId,
                    embedding: embeddingSync,
                    imageUrl: processed.thumbnail
                };

                newPoints.push(newPoint);
                newThumbnails.push({
                    id: pointId,
                    thumbnail: processed.thumbnail,
                    fileName: file.name
                });

                // Update progress
                setUploadProgress({ current: i + 1, total: fileArray.length });
            } catch (err: any) {
                console.error(`Failed to process file ${file.name}:`, err);
                setError(`Failed to process ${file.name}: ${err.message}`);
                // Continue with other files
            }
        }

        // Add all successfully processed points
        if (newPoints.length > 0) {
            setPoints(prev => [...prev, ...newPoints]);
            setUploadedThumbnails(prev => [...prev, ...newThumbnails]);
            // Clear clusters when new data added
            setClusters([]);
            setCentroids(null);
            setIsConverged(false);
        }

        setIsUploading(false);
        setUploadProgress(null);
        
        // Reset input
        e.target.value = '';
    };

    const handleClearThumbnails = () => {
        if (readOnly) return;
        setUploadedThumbnails([]);
    };

    const handleCluster = () => {
        if (readOnly) return;
        if (points.length < k) return;

        // Run K-Means (Step-wise or full run?)
        // To show "closing in to convergence", we can run for a few iterations at a time, or 1.
        // Let's run 1 iteration per click if not converged? 
        // Or run full 20 but use previous centroids (which mimics steps if we set iterations low).
        // The user said "hit Run K-means multiple times".
        // Let's maximize interactivity: Run 1 iteration per click.

        // Use PROJECTED (2D) points for clustering to ensure visual consistency
        // Filter out any points that don't have x/y yet (shouldn't happen if lengths match)
        const kmPoints = projectedPoints
            .filter(p => typeof p.x === 'number' && typeof p.y === 'number')
            .map(p => ({
                data: [p.x!, p.y!],
                id: p.id
            }));

        if (kmPoints.length < k) {
            console.warn("Not enough projected points for clustering");
            return;
        }

        // Pass existing centroids if available
        const result = kMeans(kmPoints, k, 1, centroids || undefined);

        setClusters(result.clusters);
        setCentroids(result.centroids);

        if (result.converged) {
            setIsConverged(true);
        } else {
            // Check if centroids really moved? kMeans now returns converged flag based on assignment change.
            // If assignments didn't change, it's converged.
            setIsConverged(result.converged);
        }
    };

    const handleReset = () => {
        if (readOnly) return;
        setPoints([]);
        setClusters([]);
        setCentroids(null);
        setIsConverged(false);
        setSelectedPointId(null);
        setUploadedThumbnails([]);
        setUploadProgress(null);
    };

    // Get color for cluster
    const getClusterColor = (clusterIndex: number) => {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        return colors[clusterIndex % colors.length];
    };

    // Metrics for classroom
    const currentStatus = clusters.length > 0 ? 'clustering' :
        points.length > 0 ? 'collecting' : 'idle';

    return (
        <div className="space-y-6">
            <StudentStatusIndicator
                status={currentStatus}
                metrics={{ samples: points.length, k, converged: isConverged }}
            />

            <div className="flex items-center justify-between">
                {isModelLoading && (
                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('unsupervised.loading')}
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium border border-red-200">
                        {error}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Input */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-center">
                        <CameraView ref={cameraRef} />
                    </div>
                    
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={readOnly}
                    />
                    
                    <div className="flex gap-2">
                        <button
                            onClick={handleCapture}
                            disabled={isModelLoading || isUploading || readOnly}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Camera className="w-5 h-5" />
                            {t('unsupervised.capture')} ({points.length})
                        </button>
                        <button
                            onClick={handleUploadClick}
                            disabled={isModelLoading || isUploading || readOnly}
                            className={clsx(
                                "px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors",
                                isModelLoading || isUploading || readOnly
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600"
                            )}
                            title="Upload images"
                        >
                            <Upload className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Upload Progress */}
                    {isUploading && uploadProgress && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">Uploading...</span>
                                <span className="text-sm text-slate-500">
                                    {uploadProgress.current} / {uploadProgress.total}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Uploaded Thumbnails */}
                    {uploadedThumbnails.length > 0 && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Uploaded Images ({uploadedThumbnails.length})
                                </h3>
                                <button
                                    onClick={handleClearThumbnails}
                                    disabled={readOnly}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Clear thumbnails"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {uploadedThumbnails.map((thumb) => (
                                    <div
                                        key={thumb.id}
                                        className="relative aspect-square bg-slate-100 rounded border border-slate-200 overflow-hidden"
                                    >
                                        <img
                                            src={thumb.thumbnail}
                                            alt={thumb.fileName}
                                            className="w-full h-full object-cover"
                                            title={thumb.fileName}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h3 className="font-semibold text-slate-900">{t('unsupervised.clustering_controls')}</h3>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-slate-700">{t('unsupervised.clusters_k')}</label>
                            <input
                                type="number"
                                min={2}
                                max={6}
                                value={k}
                                disabled={readOnly}
                                onChange={e => {
                                    if (readOnly) return;
                                    setK(Number(e.target.value));
                                    setCentroids(null);
                                    setIsConverged(false);
                                    setClusters([]);
                                }}
                                className="w-16 px-2 py-1 border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleCluster}
                            disabled={points.length < k || isConverged || readOnly}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            {isConverged ? t('unsupervised.converged') : (centroids ? t('unsupervised.step_kmeans') : t('unsupervised.run_kmeans'))}
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={readOnly}
                            className="w-full py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t('unsupervised.reset')}
                        </button>
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('unsupervised.embedding_space')}</h2>

                    {points.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
                            <p>{t('unsupervised.empty_state')}</p>
                        </div>
                    ) : (
                        <div className="relative flex-1 min-h-[400px] border border-slate-100 rounded-lg bg-slate-50">
                            {/* SVG Plot */}
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {projectedPoints.map((p) => {
                                    // Find cluster assignment
                                    let color = '#94a3b8'; // default slate
                                    let radius = 2; // size in viewBox units (approx)

                                    const clusterIdx = clusters.findIndex(c => c.pointIds.includes(p.id));
                                    if (clusterIdx !== -1) {
                                        color = getClusterColor(clusterIdx);
                                        radius = 3;
                                    }

                                    // Guard against NaN
                                    const cx = (p.x || 0) * 80 + 10; // 10-90% padding
                                    const cy = (p.y || 0) * 80 + 10;

                                    return (
                                        <circle
                                            key={p.id}
                                            cx={cx}
                                            cy={cy}
                                            r={p.id === selectedPointId ? radius * 1.5 : radius}
                                            fill={color}
                                            stroke="white"
                                            strokeWidth="0.5"
                                            className="cursor-pointer transition-all duration-300 ease-out"
                                            onClick={() => setSelectedPointId(p.id)}
                                        />
                                    );
                                })}
                            </svg>

                            <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded shadow text-xs">
                                <p>{t('unsupervised.points')}: {points.length}</p>
                                <p>{t('unsupervised.clusters')}: {clusters.length > 0 ? clusters.length : 'None'}</p>
                                {isConverged && <p className="text-emerald-600 font-bold">{t('unsupervised.converged')}!</p>}
                            </div>

                            {/* Image Preview Popup */}
                            {selectedPointId && (
                                <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg border border-slate-200 z-10 w-32 animate-in fade-in zoom-in duration-200">
                                    {points.find(p => p.id === selectedPointId)?.imageUrl ? (
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider text-center">{t('unsupervised.selected')}</p>
                                            <img
                                                src={points.find(p => p.id === selectedPointId)?.imageUrl}
                                                alt="Point Preview"
                                                className="w-full h-auto rounded border border-slate-100"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 p-2 text-center">{t('unsupervised.no_image')}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
