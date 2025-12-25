import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { loadMobileNet, getEmbedding } from '../../lib/ml/mobilenet';
import CameraView, { type CameraHandle } from '../../components/CameraView';
import DatasetPanel from '../../components/DatasetPanel';
import PredictionPanel from '../../components/PredictionPanel';
import { Loader2 } from 'lucide-react';

// Define Class Data Structure
interface ClassInfo {
    id: string; // '0', '1', etc. for KNN
    name: string;
    count: number;
    color: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function SupervisedLab() {
    const cameraRef = useRef<CameraHandle>(null);
    const classifierRef = useRef<knnClassifier.KNNClassifier | null>(null);
    const mobilenetRef = useRef<any>(null); // Keep reference to loaded mobilenet

    const [isModelLoading, setIsModelLoading] = useState(true);
    const [classes, setClasses] = useState<ClassInfo[]>([
        { id: '0', name: 'Class A', count: 0, color: COLORS[0] },
        { id: '1', name: 'Class B', count: 0, color: COLORS[1] },
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

        // Add example to KNN
        const embedding = getEmbedding(mobilenetRef.current, video);
        classifierRef.current.addExample(embedding, classId);
        embedding.dispose();

        // Update count
        setClasses(prev => prev.map(c =>
            c.id === classId ? { ...c, count: c.count + 1 } : c
        ));

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

    useEffect(() => {
        // Start loop if we have classes with examples? 
        // Handled in handleCapture mostly, but if we resume...
        // For now, handleCapture triggers state that keeps loop visual meaningful
    }, []);

    // Class Management
    const addClass = () => {
        const newId = String(classes.length);
        const color = COLORS[classes.length % COLORS.length];
        setClasses([...classes, { id: newId, name: `Class ${String.fromCharCode(65 + classes.length)}`, count: 0, color }]);
    };

    const removeClass = (id: string) => {
        if (classifierRef.current) {
            classifierRef.current.clearClass(id); // TFJS KNN clearClass takes label indices?
            // Actually clearClass(label) clears examples for that label.
            // But removing from UI means we also need to handle ID re-assignment or holes.
            // For MVP, just allow removing and keeping existing IDs is fine (holes in IDs are allowed in string labels).
        }
        setClasses(classes.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Supervised Learning Lab</h1>
                {isModelLoading && (
                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading MobileNet...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Camera */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-center">
                        <CameraView ref={cameraRef} />
                    </div>
                    <div className="p-4 bg-indigo-50 text-indigo-900 rounded-lg text-sm border border-indigo-100">
                        <strong className="font-semibold">Instructions:</strong> Select a class on the right and hold "Add Example" to capture images.
                        Teach the model to recognize difference objects (e.g. your face vs your hand).
                    </div>
                </div>

                {/* Right Column: Controls & Results */}
                <div className="space-y-6">
                    <DatasetPanel
                        classes={classes}
                        activeClass={null}
                        onAddClass={addClass}
                        onRemoveClass={removeClass}
                        onCapture={handleCapture}
                        isModelReady={!isModelLoading}
                    />

                    <PredictionPanel
                        predictions={predictions}
                        classes={classes}
                        isPredicting={isPredicting}
                    />
                </div>
            </div>
        </div>
    );
}
