
export interface ProcessedImage {
    element: HTMLImageElement;
    thumbnail: string; // Data URL
    width: number;
    height: number;
}

const MAX_THUMBNAIL_SIZE = 512;
const MAX_FILE_SIZE_MB = 4;

export const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
        return 'Not an image file.';
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return `File too large (Max ${MAX_FILE_SIZE_MB}MB).`;
    }
    return null;
};

export const processImageFile = async (file: File): Promise<ProcessedImage> => {
    return new Promise((resolve, reject) => {
        const errorMsg = validateFile(file);
        if (errorMsg) {
            reject(new Error(errorMsg));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Resize for thumbnail/storage
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if too big
                if (width > MAX_THUMBNAIL_SIZE || height > MAX_THUMBNAIL_SIZE) {
                    const ratio = Math.min(MAX_THUMBNAIL_SIZE / width, MAX_THUMBNAIL_SIZE / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

                resolve({
                    element: img, // Original
                    thumbnail,
                    width,
                    height
                });
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};
