import { useState, useMemo } from 'react';
import { Play, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { irisDataset } from '../../lib/datasets/iris';
import { kMeans, type Cluster } from '../../lib/ml/kmeans';
import clsx from 'clsx';
import StudentStatusIndicator from '../Classroom/StudentStatusIndicator';

export default function IrisLab() {
    const { t } = useLanguage();
    const [k, setK] = useState(3);
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [centroids, setCentroids] = useState<number[][] | null>(null);
    const [isConverged, setIsConverged] = useState(false);
    const [showTrueLabels, setShowTrueLabels] = useState(false);

    // Prepare data points for K-Means (using petal length/width as 2D feature space for visualization simplicity)
    // Actually K-Means should probably use all 4 dimensions for better accuracy, but visualization is 2D.
    // If we use all 4 dims, we need PCA to visualize. 
    // For "educational" clarity, using 2 dimensions (Petal Length vs Width) is often cleaner and sufficient for Setosa separation.
    // Let's use Petal Length (x) and Petal Width (y) for both clustering AND visualization to make it intuitive.
    const points = useMemo(() => {
        return irisDataset.map(d => ({
            data: [d.petalLength, d.petalWidth],
            id: d.id,
            species: d.species
        }));
    }, []);

    // Metrics for classroom
    const currentStatus = clusters.length > 0 ? 'clustering' : 'idle';

    const handleCluster = () => {
        // Run one step of K-Means
        const result = kMeans(points, k, 1, centroids || undefined);
        setClusters(result.clusters);
        setCentroids(result.centroids);
        setIsConverged(result.converged);
    };

    const handleReset = () => {
        setClusters([]);
        setCentroids(null);
        setIsConverged(false);
    };

    const getClusterColor = (clusterIndex: number) => {
        const colors = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
        return colors[clusterIndex % colors.length];
    };

    const getSpeciesColor = (species: string) => {
        switch (species) {
            case 'setosa': return '#ef4444'; // Red
            case 'versicolor': return '#10b981'; // Green
            case 'virginica': return '#3b82f6'; // Blue
            default: return '#94a3b8';
        }
    };

    // Calculate scaling for visualization
    const maxX = Math.max(...points.map(p => p.data[0]));
    const maxY = Math.max(...points.map(p => p.data[1]));
    // Add some padding
    const domainX = [0, maxX + 1];
    const domainY = [0, maxY + 1];

    const toSvgCoords = (x: number, y: number) => {
        // svg 100x100
        const svgX = (x / domainX[1]) * 100;
        const svgY = 100 - (y / domainY[1]) * 100; // Flip Y
        return { x: svgX, y: svgY };
    };

    return (
        <div className="space-y-6">
            <StudentStatusIndicator
                status={currentStatus}
                metrics={{ samples: 150, k, converged: isConverged }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Controls */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4">{t('unsupervised.clustering_controls')}</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('unsupervised.clusters_k')}</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min={2}
                                        max={5}
                                        value={k}
                                        onChange={e => {
                                            setK(Number(e.target.value));
                                            handleReset();
                                        }}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <span className="font-mono font-bold text-slate-900 w-8 text-center">{k}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCluster}
                                disabled={isConverged}
                                className={clsx(
                                    "w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors",
                                    isConverged
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                )}
                            >
                                <Play className="w-4 h-4" />
                                {isConverged ? t('unsupervised.converged') : (centroids ? t('unsupervised.step_kmeans') : t('unsupervised.run_kmeans'))}
                            </button>

                            <button
                                onClick={handleReset}
                                className="w-full py-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {t('unsupervised.reset')}
                            </button>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setShowTrueLabels(!showTrueLabels)}
                                    className="w-full py-2.5 text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    {showTrueLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {showTrueLabels ? t('unsupervised.iris.hide_labels') : t('unsupervised.iris.show_labels')}
                                </button>
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    {t('unsupervised.iris.compare_tip')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-900">
                        <strong className="block mb-1 font-semibold">About Iris Dataset</strong>
                        Famous dataset introduced by Ronald Fisher in 1936. Includes 3 species: Setosa, Versicolor, and Virginica. We are visualizing Petal Length vs Petal Width.
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {showTrueLabels ? t('unsupervised.iris.true_species') : t('unsupervised.iris.cluster_assignments')}
                        </h2>
                        <div className="flex gap-4 text-xs font-medium">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-slate-200" />
                                <span>Centroid</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative aspect-square md:aspect-video w-full border border-slate-100 rounded-lg bg-slate-50 overflow-hidden">
                        <svg className="w-full h-full p-4" viewBox="-5 -5 110 110" preserveAspectRatio="xMidYMid meet">
                            {/* Grid Lines (Optional) */}
                            <line x1="0" y1="100" x2="100" y2="100" stroke="#cbd5e1" strokeWidth="1" />
                            <line x1="0" y1="0" x2="0" y2="100" stroke="#cbd5e1" strokeWidth="1" />

                            {/* Axis Labels */}
                            <text x="50" y="108" textAnchor="middle" fontSize="4" fill="#64748b">Petal Length</text>
                            <text x="-5" y="50" textAnchor="middle" fontSize="4" fill="#64748b" transform="rotate(-90 -5 50)">Petal Width</text>

                            {/* Points */}
                            {points.map((p) => {
                                const pos = toSvgCoords(p.data[0], p.data[1]);
                                let fill = '#94a3b8'; // Default grey

                                if (showTrueLabels) {
                                    fill = getSpeciesColor(p.species);
                                } else {
                                    // Find cluster assignment
                                    const clusterIdx = clusters.findIndex(c => c.pointIds.includes(p.id));
                                    if (clusterIdx !== -1) {
                                        fill = getClusterColor(clusterIdx);
                                    }
                                }

                                return (
                                    <circle
                                        key={p.id}
                                        cx={pos.x}
                                        cy={pos.y}
                                        r="1.5"
                                        fill={fill}
                                        className="transition-all duration-300"
                                        opacity="0.8"
                                    />
                                );
                            })}

                            {/* Centroids */}
                            {!showTrueLabels && centroids?.map((c, i) => {
                                const pos = toSvgCoords(c[0], c[1]);
                                return (
                                    <g key={`centroid-${i}`} className="transition-all duration-500 ease-out">
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r="4" // Outer ring
                                            fill="none"
                                            stroke={getClusterColor(i)}
                                            strokeWidth="2"
                                            opacity="0.5"
                                        />
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r="2" // Inner dot
                                            fill={getClusterColor(i)}
                                            stroke="white"
                                            strokeWidth="1"
                                        />
                                        {/* Path trace could be added here if we tracked history */}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
