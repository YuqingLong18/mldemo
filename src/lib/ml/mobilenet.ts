import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Singleton instance
let model: mobilenet.MobileNet | null = null;

export const loadMobileNet = async (): Promise<mobilenet.MobileNet> => {
    if (model) return model;

    console.log("Loading MobileNet...");
    // Using version 2, alpha 1.0 for better accuracy, or 0.25 for speed on low-end.
    // Default is sufficient.
    model = await mobilenet.load({
        version: 2,
        alpha: 1.0,
    });
    console.log("MobileNet loaded.");
    return model;
};

export const getEmbedding = (model: mobilenet.MobileNet, video: HTMLVideoElement | HTMLImageElement): tf.Tensor1D => {
    // infer(img, embedding=true) returns the embedding.
    // The documentation says `infer(img, embedding)` returns Tensor of shape [1, 1024] (for v2 alpha 1.0).
    // We want to return 1D tensor usually, but keeping it managed is good.

    return tf.tidy(() => {
        const result = model.infer(video, true);
        // Result is [1, 1024], flatten to [1024]
        return result.flatten() as tf.Tensor1D;
    });
};
