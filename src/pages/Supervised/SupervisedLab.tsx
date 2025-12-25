import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { loadMobileNet, getEmbedding } from '../../lib/ml/mobilenet';
import CameraView, { type CameraHandle } from '../../components/CameraView';
import DatasetPanel from '../../components/DatasetPanel';
import PredictionPanel from '../../components/PredictionPanel';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

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
    const requestRef = useRef<number | undefined>(undefined);

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

        // Start predicting if not already
        if (!isPredicting) {
            setIsPredicting(true);
            predictLoop();
        }
    };

    // Prediction Loop
    const predictLoop = async () => {
        if (!mobilenetRef.current || !classifierRef.current || !cameraRef.current?.video) {
            requestRef.current = requestAnimationFrame(predictLoop);
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

        requestRef.current = requestAnimationFrame(predictLoop);
    };

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
    };

    const handleClassNameChange = (id: string, newName: string) => {
        setClasses(prev => prev.map(c =>
            c.id === id ? { ...c, name: newName } : c
        ));
    };

    return (
        <div className="space-y-6">
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
                    />
                </div>
            </div>
        </div>
    );
}
