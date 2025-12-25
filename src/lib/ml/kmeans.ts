interface Point {
    data: number[];
    id: string; // associate with original image ID
}

export interface Cluster {
    centroid: number[];
    pointIds: string[];
}

export interface KMeansResult {
    clusters: Cluster[];
    centroids: number[][]; // Return centroids for next iteration
    converged: boolean;
    iterations: number;
}

/**
 * Runs K-Means clustering.
 * @param points Data points
 * @param k Number of clusters
 * @param maxIters Maximum iterations per run. Set to 1 for "step-by-step" or higher for full run.
 * @param initialCentroids Optional starting centroids. If provided, skips random init.
 */
export function kMeans(points: Point[], k: number, maxIters = 20, initialCentroids?: number[][]): KMeansResult {
    if (points.length === 0) return { clusters: [], centroids: [], converged: false, iterations: 0 };
    if (k > points.length) k = points.length;

    // 1. Initialize centroids
    let centroids: number[][];
    if (initialCentroids && initialCentroids.length === k) {
        // Use provided centroids (deep copy to avoid mutation issues)
        centroids = initialCentroids.map(c => [...c]);
    } else {
        // Random initialization
        const shuffled = [...points].sort(() => 0.5 - Math.random());
        centroids = shuffled.slice(0, k).map(p => [...p.data]);
    }

    let assignments: number[] = new Array(points.length).fill(-1);
    let clusters: Cluster[] = [];
    let converged = false;
    let actualIters = 0;

    for (let iter = 0; iter < maxIters; iter++) {
        actualIters++;
        let changed = false;

        // 2. Assign points to nearest centroid
        points.forEach((point, i) => {
            let minDist = Infinity;
            let clusterIdx = -1;

            centroids.forEach((centroid, cIdx) => {
                const d = euclideanDistance(point.data, centroid);
                if (d < minDist) {
                    minDist = d;
                    clusterIdx = cIdx;
                }
            });

            if (assignments[i] !== clusterIdx) {
                assignments[i] = clusterIdx;
                changed = true;
            }
        });

        // 3. Update centroids
        const newCentroids = centroids.map(() => new Array(points[0].data.length).fill(0));
        const counts = new Array(k).fill(0);

        points.forEach((point, i) => {
            const clusterIdx = assignments[i];
            if (clusterIdx !== -1) {
                for (let d = 0; d < point.data.length; d++) {
                    newCentroids[clusterIdx][d] += point.data[d];
                }
                counts[clusterIdx]++;
            }
        });

        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
                for (let d = 0; d < centroids[0].length; d++) {
                    centroids[c][d] = newCentroids[c][d] / counts[c];
                }
            } else {
                // Handle empty cluster
            }
        }

        if (!changed) {
            converged = true;
            break;
        }
    }

    // Build result
    clusters = centroids.map((centroid, i) => ({
        centroid,
        pointIds: points.filter((_, idx) => assignments[idx] === i).map(p => p.id)
    }));

    return {
        clusters,
        centroids,
        converged,
        iterations: actualIters
    };
}

function euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
