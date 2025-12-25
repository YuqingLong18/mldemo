import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { loadMobileNet, getEmbedding } from '../../lib/ml/mobilenet';
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

    // Calculate metrics for classroom
    const totalSamples = classes.reduce((sum, c) => sum + c.count, 0);
    const currentStatus = isTraining ? 'training' :
        isPredicting ? 'predicting' :
            totalSamples > 0 ? 'collecting' : 'idle';

    // Initialize Model and Classifier
    useEffect(() => {
        async function init() {
            setIsModelLoading(true);
            await tf.ready();

            // Load MobileNet
            mobilenetRef.current = await loadMobileNet();

            // Create KNN Classifier
            classifierRef.current = (knnClassifier as any).create();

            setIsModelLoading(false);
        }
        init();

        return () => {
            // Cleanup
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
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
