import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useClassroom } from '../../lib/classroom/ClassroomContext';
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { loadMobileNet, getEmbedding } from '../../lib/ml/mobilenet';
import { processImageFile } from '../../lib/imageUtils';
import CameraView, { type CameraHandle } from '../../components/CameraView';
import DatasetPanel from '../../components/DatasetPanel';
import PredictionPanel from '../../components/PredictionPanel';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import StudentStatusIndicator from '../../components/Classroom/StudentStatusIndicator';

// Define Class Data Structure
export interface ClassInfo {
    id: string; // '0', '1', etc. for KNN
    name: string;
    count: number;
    color: string;
    thumbnails: string[]; // Store last N captured images
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// State for uploaded prediction images
export interface PredictionImage {
    id: string;
    thumbnail: string;
    fileName: string;
    predictions: { label: string, confidence: number }[];
    topLabel: string;
    topConfidence: number;
}

export default function SupervisedLab() {
    const { t } = useLanguage();
    const cameraRef = useRef<CameraHandle>(null);
    const classifierRef = useRef<knnClassifier.KNNClassifier | null>(null);
    const mobilenetRef = useRef<any>(null); // Keep reference to loaded mobilenet

    const [isModelLoading, setIsModelLoading] = useState(true);
    const [classes, setClasses] = useState<ClassInfo[]>([
        { id: '0', name: 'Class A', count: 0, color: COLORS[0], thumbnails: [] },
        { id: '1', name: 'Class B', count: 0, color: COLORS[1], thumbnails: [] },
    ]);
    const [predictions, setPredictions] = useState<{ label: string, confidence: number }[]>([]);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [isModelTrained, setIsModelTrained] = useState(false);
    const requestRef = useRef<number | undefined>(undefined);
    const [predictionImages, setPredictionImages] = useState<PredictionImage[]>([]);

    // Calculate metrics for classroom
    const totalSamples = classes.reduce((sum, c) => sum + c.count, 0);
    const currentStatus = isTraining ? 'training' :
        isPredicting ? 'predicting' :
            totalSamples > 0 ? 'collecting' : 'idle';

    // Initialize Model and Classifier
    const location = useLocation();
    const { onRequestModel, sendModelData } = useClassroom();
    const FEATURED_MODE = location.state?.featured;
    const featuredStudentName = location.state?.studentName;

    // Initialize Model and Classifier
    useEffect(() => {
        async function init() {
            setIsModelLoading(true);
            await tf.ready();

            // Load MobileNet
            mobilenetRef.current = await loadMobileNet();

            // Create KNN Classifier
            const classifier = (knnClassifier as any).create();
            classifierRef.current = classifier;

            // Load Featured Data if available
            if (FEATURED_MODE && location.state?.dataset) {
                try {
                    const dataset = location.state.dataset;
                    const tensorDataset: { [label: string]: tf.Tensor2D } = {};

                    Object.entries(dataset).forEach(([label, data]) => {
                        tensorDataset[label] = tf.tensor(data as any);
                    });

                    classifier.setClassifierDataset(tensorDataset);

                    if (location.state.thumbnails) {
                        // Reconstruct classes from thumbnails and dataset keys
                        // This is a bit tricky as we need to map id back to ClassInfo structure
                        // For simplicity, we might just overwrite classes based on what we have
                        // But we don't send full ClassInfo structure....
                        // Let's assume standard class IDs '0', '1'... or just rely on what we sent.
                        // Actually, we pass thumbnails map.

                        const newClasses = classes.map(c => {
                            if (location.state.thumbnails[c.id]) {
                                const thumbs = location.state.thumbnails[c.id];
                                return {
                                    ...c,
                                    count: tensorDataset[c.id] ? (tensorDataset[c.id].shape[0] || 0) : 0,
                                    thumbnails: thumbs
                                }
                            }
                            return c;
                        });
                        // Adjust counts at least
                        Object.keys(tensorDataset).forEach(id => {
                            const count = tensorDataset[id].shape[0];
                            const cls = newClasses.find(c => c.id === id);
                            if (cls) cls.count = count;
                        });
                        setClasses(newClasses);
                        setIsModelTrained(true);
                    }
                } catch (e) {
                    console.error("Failed to load featured model", e);
                }
            }

            setIsModelLoading(false);
        }
        init();

        // Listen for teacher requests
        onRequestModel(async () => {
            try {
                if (!classifierRef.current || classifierRef.current.getNumClasses() === 0) {
                    // Send empty response to indicate no model available
                    sendModelData({}, {});
                    return;
                }

                const dataset = classifierRef.current.getClassifierDataset();
                const serializableDataset: { [label: string]: any } = {};

                // Serialize tensors asynchronously to avoid blocking
                // Use array() instead of arraySync() for better performance
                const serializationPromises = Object.entries(dataset).map(async ([label, tensor]) => {
                    const array = await tensor.array();
                    serializableDataset[label] = array;
                });

                await Promise.all(serializationPromises);

                // Prepare thumbnails map (limit to last 5 per class to reduce payload size)
                const thumbnailsMap: { [id: string]: string[] } = {};
                classes.forEach(c => {
                    thumbnailsMap[c.id] = c.thumbnails.slice(-5); // Only send last 5 thumbnails
                });

                sendModelData(thumbnailsMap, serializableDataset);
            } catch (error) {
                console.error("Error sending model data:", error);
                // Send empty response on error
                sendModelData({}, {});
            }
        });

        return () => {
            // Cleanup
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (classifierRef.current) {
                classifierRef.current.dispose();
                classifierRef.current = null;
            }
        };
    }, []);

    // Handle Capture
    const handleCapture = async (classId: string) => {
        if (!mobilenetRef.current || !classifierRef.current || !cameraRef.current?.video) return;

        const video = cameraRef.current.video;

        // Capture image validation
        let imageUrl: string | undefined;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 224;
            canvas.height = video.videoHeight || 224;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Draw resized image for thumbnail (smaller size for performance?)
                // Actually canvas.toDataURL at standard size is fine for a few images
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                imageUrl = canvas.toDataURL('image/jpeg', 0.7);
            }
        } catch (e) {
            console.error("Thumbnail capture failed", e);
        }

        // Add example to KNN
        const embedding = getEmbedding(mobilenetRef.current, video);
        classifierRef.current.addExample(embedding, classId);
        embedding.dispose();

        // Update count and thumbnails without mutating state directly
        setClasses(prev => prev.map(c => {
            if (c.id === classId) {
                // Keep last 5 thumbnails
                const newThumbnails = imageUrl
                    ? [...c.thumbnails, imageUrl].slice(-5)
                    : c.thumbnails;

                return {
                    ...c,
                    count: c.count + 1,
                    thumbnails: newThumbnails
                };
            }
            return c;
        }));

        // Reset trained status when new data is added
        setIsModelTrained(false);
        setIsPredicting(false);
    };

    // Handle Upload
    const handleUpload = async (classId: string, files: FileList) => {
        if (!mobilenetRef.current || !classifierRef.current) return;

        const uploadedThumbnails: string[] = [];
        let successCount = 0;
        const errors: string[] = [];

        // Convert FileList to Array for easier iteration
        const fileArray = Array.from(files);
        console.log(`Processing ${fileArray.length} file(s) for class ${classId}`);

        // Process each file sequentially to avoid overwhelming the browser
        for (const file of fileArray) {
            try {
                console.log(`Processing file: ${file.name}`);
                
                // Process the image file (this already waits for image to load)
                const processed = await processImageFile(file);
                
                // Get embedding from the image element
                const embedding = getEmbedding(mobilenetRef.current, processed.element);
                
                // Add to classifier
                classifierRef.current.addExample(embedding, classId);
                embedding.dispose();
                
                // Store thumbnail
                uploadedThumbnails.push(processed.thumbnail);
                successCount++;
                
                console.log(`Successfully processed: ${file.name}`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error(`Failed to process file ${file.name}:`, errorMsg);
                errors.push(`${file.name}: ${errorMsg}`);
                // Continue with other files even if one fails
            }
        }

        console.log(`Upload complete: ${successCount} successful, ${errors.length} failed`);

        if (successCount > 0) {
            // Update count and thumbnails
            setClasses(prev => prev.map(c => {
                if (c.id === classId) {
                    // Keep last 5 thumbnails
                    const newThumbnails = [...c.thumbnails, ...uploadedThumbnails].slice(-5);

                    return {
                        ...c,
                        count: c.count + successCount,
                        thumbnails: newThumbnails
                    };
                }
                return c;
            }));

            // Reset trained status when new data is added
            setIsModelTrained(false);
            setIsPredicting(false);
        }

        // Log errors if any
        if (errors.length > 0) {
            console.warn('Upload errors:', errors);
        }
    };

    // Handle Prediction Upload
    const handlePredictUpload = async (files: FileList) => {
        if (!mobilenetRef.current || !classifierRef.current || !isModelTrained) {
            console.warn('Model not ready or not trained');
            return;
        }

        const fileArray = Array.from(files);
        console.log(`Processing ${fileArray.length} image(s) for prediction`);

        const newPredictionImages: PredictionImage[] = [];

        // Process each file sequentially
        for (const file of fileArray) {
            try {
                console.log(`Predicting on file: ${file.name}`);
                
                // Process the image file
                const processed = await processImageFile(file);
                
                // Get embedding from the image element
                const embedding = getEmbedding(mobilenetRef.current, processed.element);
                
                // Predict
                const result = await classifierRef.current.predictClass(embedding);
                const confidences = Object.entries(result.confidences).map(([label, confidence]) => ({
                    label,
                    confidence: confidence as number
                }));
                
                // Sort by confidence
                const sorted = [...confidences].sort((a, b) => b.confidence - a.confidence);
                const top = sorted[0];
                
                // Create prediction image entry
                const predictionImage: PredictionImage = {
                    id: `${Date.now()}-${Math.random()}`,
                    thumbnail: processed.thumbnail,
                    fileName: file.name,
                    predictions: confidences,
                    topLabel: top.label,
                    topConfidence: top.confidence
                };
                
                newPredictionImages.push(predictionImage);
                embedding.dispose();
                
                console.log(`Successfully predicted: ${file.name} -> ${top.label} (${(top.confidence * 100).toFixed(1)}%)`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error(`Failed to predict on file ${file.name}:`, errorMsg);
            }
        }

        // Add new prediction images to state
        if (newPredictionImages.length > 0) {
            setPredictionImages(prev => [...prev, ...newPredictionImages]);
        }
    };

    // Clear prediction images
    const handleClearPredictions = () => {
        setPredictionImages([]);
    };

    // Train Model (Simulation)
    const handleTrainModel = async () => {
        if (classes.every(c => c.count === 0)) return; // No data

        setIsTraining(true);
        setIsPredicting(false);

        // Simulate training time (e.g., 2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsTraining(false);
        setIsModelTrained(true);
    };

    const togglePrediction = (shouldPredict: boolean) => {
        if (shouldPredict && isModelTrained) {
            setIsPredicting(true);
            predictLoop();
        } else {
            setIsPredicting(false);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    };

    // Prediction Loop
    const predictLoop = async () => {
        if (!isPredicting && !requestRef.current) return; // Stop constraint
        if (!mobilenetRef.current || !classifierRef.current || !cameraRef.current?.video) {
            // Keep requesting frame until stopped explicitly or deps ready
            if (isPredicting) requestRef.current = requestAnimationFrame(predictLoop);
            return;
        }

        // Only predict if we have examples
        if (classifierRef.current.getNumClasses() > 0) {
            const video = cameraRef.current.video;

            // Get embedding
            const embedding = getEmbedding(mobilenetRef.current, video);

            // Predict
            try {
                const result = await classifierRef.current.predictClass(embedding);
                const confidences = Object.entries(result.confidences).map(([label, confidence]) => ({
                    label,
                    confidence
                }));
                setPredictions(confidences);
            } catch (e) {
                console.error("Prediction error", e);
            }

            embedding.dispose();
        }

        if (isPredicting) {
            requestRef.current = requestAnimationFrame(predictLoop);
        }
    };

    // Watch isPredicting to start/stop loop
    useEffect(() => {
        if (isPredicting) {
            predictLoop();
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    }, [isPredicting]);

    // Class Management
    const addClass = () => {
        const newId = String(classes.length);
        const color = COLORS[classes.length % COLORS.length];
        setClasses([...classes, {
            id: newId,
            name: `Class ${String.fromCharCode(65 + classes.length)}`,
            count: 0,
            color,
            thumbnails: []
        }]);
        setIsModelTrained(false); // Invalidate model
        setIsPredicting(false);
    };

    const removeClass = (id: string) => {
        if (classifierRef.current) {
            try {
                classifierRef.current.clearClass(id);
            } catch (e) {
                console.warn("Error clearing class", e);
            }
        }
        setClasses(classes.filter(c => c.id !== id));
        setIsModelTrained(false); // Invalidate model
        setIsPredicting(false);
    };

    const handleClassNameChange = (id: string, newName: string) => {
        setClasses(prev => prev.map(c =>
            c.id === id ? { ...c, name: newName } : c
        ));
    };

    return (
        <div className="space-y-6">
            <StudentStatusIndicator
                status={currentStatus}
                metrics={{ samples: totalSamples, accuracy: isModelTrained ? 1.0 : 0 }}
            />
            
            {/* Featured Student Banner */}
            {FEATURED_MODE && featuredStudentName && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl shadow-lg border border-indigo-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                {featuredStudentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm opacity-90">Viewing Student Model</p>
                                <p className="text-lg font-bold">{featuredStudentName}'s Model</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">{t('supervised.title')}</h1>
                {isModelLoading && (
                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('supervised.loading')}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Camera & Prediction */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-center">
                        <CameraView ref={cameraRef} />
                    </div>

                    <PredictionPanel
                        predictions={predictions}
                        classes={classes}
                        isPredicting={isPredicting}
                        isModelTrained={isModelTrained}
                        onTogglePrediction={togglePrediction}
                        predictionImages={predictionImages}
                        onPredictUpload={handlePredictUpload}
                        onClearPredictions={handleClearPredictions}
                        isModelReady={!isModelLoading}
                    />

                    <div className="p-4 bg-indigo-50 text-indigo-900 rounded-lg text-sm border border-indigo-100">
                        <strong className="font-semibold">{t('supervised.instructions.title')}</strong> {t('supervised.instructions.text')}
                    </div>
                </div>

                {/* Right Column: Controls */}
                <div className="space-y-6">
                    <DatasetPanel
                        classes={classes}
                        activeClass={null}
                        onAddClass={addClass}
                        onRemoveClass={removeClass}
                        onCapture={handleCapture}
                        onUpload={handleUpload}
                        onClassNameChange={handleClassNameChange}
                        isModelReady={!isModelLoading}
                        isTraining={isTraining}
                        isModelTrained={isModelTrained}
                        onTrainModel={handleTrainModel}
                    />
                </div>
            </div>
        </div>
    );
}
