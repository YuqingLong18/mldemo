import * as tf from '@tensorflow/tfjs';

/**
 * Computes PCA on a set of high-dimensional vectors.
 * Projects data into 2D space.
 * 
 * Uses Power Iteration on the Gram Matrix to avoid dependency on 
 * tf.linalg.svd or tf.linalg.eig which may be missing in some bundles.
 * 
 * @param vectors Array of data vectors (e.g. embeddings), shape [N, D]
 * @returns Array of 2D points [x, y], shape [N, 2]
 */
export async function computePCA(vectors: number[][]): Promise<number[][]> {
    return tf.tidy(() => {
        // 1. Convert to Tensor [N, D]
        const x = tf.tensor2d(vectors);
        const [n] = x.shape;

        if (n < 2) {
            return x.slice([0, 0], [n, 2]).arraySync() as number[][];
        }

        // 2. Mean center the data
        const mean = x.mean(0);
        const xCentered = x.sub(mean);

        // 3. Compute Gram Matrix K = XX^T [N, N]
        let kMatrix = xCentered.matMul(xCentered.transpose());

        // 4. Power Iteration for Top 2 Eigenvectors of K
        const topVecs: tf.Tensor[] = []; // Stores v1, v2
        const topVals: tf.Tensor[] = []; // Stores lambda1, lambda2

        for (let comp = 0; comp < 2; comp++) {
            // Random initialization [N, 1]
            let v = tf.randomNormal([n, 1]);
            v = v.div(v.norm());

            // Iterate
            for (let iter = 0; iter < 20; iter++) {
                // v = K * v
                const nextV = kMatrix.matMul(v);
                const norm = nextV.norm();
                // Check for convergence or zero vector
                if (norm.dataSync()[0] < 1e-6) break;
                v = nextV.div(norm);
            }

            // Estimate Eigenvalue lambda = v^T * K * v
            // Since we iterated, v is approx eigenvector.
            // Actually, nextV approx lambda * v before normalization. 
            // Better: Rayleigh quotient
            const Kv = kMatrix.matMul(v);
            const lambda = v.transpose().matMul(Kv).squeeze();

            topVecs.push(v); // v is shape [N, 1]
            topVals.push(lambda);

            // Deflate K to find next eigenvector
            // K' = K - lambda * v * v^T
            const outer = v.matMul(v.transpose()).mul(lambda);
            kMatrix = kMatrix.sub(outer);
        }

        // 5. Project
        // We have eigenvectors v (columns of U in SVD of K) and eigenvalues lambda (S^2)
        // Projection T = U * S
        // S = sqrt(lambda)
        // T = [v1 * sqrt(lambda1), v2 * sqrt(lambda2)]

        // topVecs[0] is [N, 1], topVals[0] is scalar
        const col1 = topVecs[0].mul(topVals[0].sqrt());
        const col2 = topVecs[1].mul(topVals[1].sqrt());

        const projected = tf.concat([col1, col2], 1); // [N, 2]

        return projected.arraySync() as number[][];
    });
}
