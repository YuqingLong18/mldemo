interface Point {
    data: number[];
    id: string; // associate with original image ID
}

interface Cluster {
    centroid: number[];
    pointIds: string[];
}

export function kMeans(points: Point[], k: number, maxIters = 20): Cluster[] {
    if (points.length === 0) return [];
    if (k > points.length) k = points.length;

    // 1. Initialize centroids (Pick k random points)
    // Simple initialization: first k points or shuffle
    // Let's shuffle
    const shuffled = [...points].sort(() => 0.5 - Math.random());
    let centroids = shuffled.slice(0, k).map(p => [...p.data]);

    let assignments: number[] = new Array(points.length).fill(-1);
    let clusters: Cluster[] = [];

    for (let iter = 0; iter < maxIters; iter++) {
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
                // Handle empty cluster: re-init? or leave as is (orphaned)
                // Simple: leave it (it won't capture any points unless moved, but here we just average)
            }
        }

        if (!changed) break;
    }

    // Build result
    clusters = centroids.map((centroid, i) => ({
        centroid,
        pointIds: points.filter((_, idx) => assignments[idx] === i).map(p => p.id)
    }));

    return clusters;
}

function euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
