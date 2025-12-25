import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadMobileNet, getEmbedding } from '../../lib/ml/mobilenet';
import { kMeans } from '../../lib/ml/kmeans';
import { computePCA } from '../../lib/ml/pca';
import CameraView, { type CameraHandle } from '../../components/CameraView';
import { Loader2, Camera, Play, RefreshCw } from 'lucide-react';

interface DataPoint {
    id: string;
    embedding: number[];
    x?: number; // PCA projected X
    y?: number; // PCA projected Y
    cluster?: number;
}

export default function UnsupervisedLab() {
    const cameraRef = useRef<CameraHandle>(null);
    const mobilenetRef = useRef<any>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [points, setPoints] = useState<DataPoint[]>([]);
    const [k, setK] = useState(3);
    const [clusters, setClusters] = useState<{ centroid: number[], pointIds: string[] }[]>([]);
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load Model
    useEffect(() => {
        async function init() {
            try {
                setIsModelLoading(true);
                await tf.ready();
                mobilenetRef.current = await loadMobileNet();
                setError(null);
            } catch (err) {
                console.error("Model load error:", err);
                setError("Failed to load MobileNet model.");
            } finally {
                setIsModelLoading(false);
            }
        }
        init();
    }, []);

    // Compute PCA when points change
    const [projectedPoints, setProjectedPoints] = useState<DataPoint[]>([]);

    useEffect(() => {
        if (points.length === 0) {
            setProjectedPoints([]);
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
    }, [points]);

    const handleCapture = async () => {
        if (!mobilenetRef.current || !cameraRef.current?.video) return;

        try {
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
                embedding: embeddingSync
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

    const handleCluster = () => {
        if (points.length < k) return;

        // Run K-Means
        const kmPoints = points.map(p => ({ data: p.embedding, id: p.id }));
        const result = kMeans(kmPoints, k);
        setClusters(result);
    };

    const handleReset = () => {
        setPoints([]);
        setClusters([]);
        setSelectedPointId(null);
    };

    // Get color for cluster
    const getClusterColor = (clusterIndex: number) => {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        return colors[clusterIndex % colors.length];
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Unsupervised Learning Lab</h1>
                {isModelLoading && (
                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading MobileNet...
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
                    <button
                        onClick={handleCapture}
                        disabled={isModelLoading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Camera className="w-5 h-5" />
                        Capture Example ({points.length})
                    </button>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h3 className="font-semibold text-slate-900">Clustering Controls</h3>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-slate-700">Clusters (K):</label>
                            <input
                                type="number"
                                min={2}
                                max={6}
                                value={k}
                                onChange={e => setK(Number(e.target.value))}
                                className="w-16 px-2 py-1 border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleCluster}
                            disabled={points.length < k}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Run K-Means
                        </button>
                        <button
                            onClick={handleReset}
                            className="w-full py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset All
                        </button>
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Embedding Space (PCA Projection)</h2>

                    {points.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
                            <p>Capture images to see them mapped in 2D space.</p>
                        </div>
                    ) : (
                        <div className="relative flex-1 min-h-[400px] border border-slate-100 rounded-lg bg-slate-50 overflow-hidden">
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
                                <p>Points: {points.length}</p>
                                <p>Clusters: {clusters.length > 0 ? clusters.length : 'None'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
