import { Play, Square, Upload, X } from 'lucide-react';
import clsx from 'clsx';
import { type ClassInfo, type PredictionImage } from '../pages/Supervised/SupervisedLab';
import { useLanguage } from '../lib/i18n';
import { useRef } from 'react';

interface PredictionPanelProps {
    predictions: { label: string, confidence: number }[];
    classes: ClassInfo[];
    isPredicting: boolean;
    isModelTrained: boolean;
    onTogglePrediction: (shouldPredict: boolean) => void;
    predictionImages?: PredictionImage[];
    onPredictUpload?: (files: FileList) => void;
    onClearPredictions?: () => void;
    isModelReady?: boolean;
}

export default function PredictionPanel({
    predictions,
    classes,
    isPredicting,
    isModelTrained,
    onTogglePrediction,
    predictionImages = [],
    onPredictUpload,
    onClearPredictions,
    isModelReady = false
}: PredictionPanelProps) {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sort predictions by confidence
    const sorted = [...predictions].sort((a, b) => b.confidence - a.confidence);
    const top = sorted[0];

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && onPredictUpload) {
            onPredictUpload(files);
        }
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">{t('supervised.prediction.title')}</h2>
                <div className="flex items-center gap-2">
                    {isModelTrained && onPredictUpload && (
                        <button
                            onClick={handleUploadClick}
                            disabled={!isModelReady}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                !isModelReady
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            )}
                            title="Upload images to predict"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                        </button>
                    )}
                    {predictionImages.length > 0 && onClearPredictions && (
                        <button
                            onClick={onClearPredictions}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-slate-50 text-slate-600 hover:bg-slate-100"
                            title="Clear predictions"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}
                    {isModelTrained && (
                        <button
                            onClick={() => onTogglePrediction(!isPredicting)}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                isPredicting
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            )}
                        >
                            {isPredicting ? (
                                <>
                                    <Square className="w-3.5 h-3.5 fill-current" />
                                    {t('supervised.prediction.stop')}
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    {t('supervised.prediction.start')}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Uploaded Images Predictions */}
            {predictionImages.length > 0 && (
                <div className="mb-4 space-y-3">
                    <h3 className="text-sm font-medium text-slate-700">Uploaded Images</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {predictionImages.map((img) => {
                            const topClass = classes.find(c => c.id === img.topLabel);
                            return (
                                <div
                                    key={img.id}
                                    className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden"
                                >
                                    <div className="relative aspect-square bg-white">
                                        <img
                                            src={img.thumbnail}
                                            alt={img.fileName}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                            {(img.topConfidence * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <div className="text-xs font-semibold text-slate-900 truncate mb-1">
                                            {topClass?.name || `Class ${img.topLabel}`}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate" title={img.fileName}>
                                            {img.fileName}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Webcam Live Prediction */}
            {isPredicting && top ? (
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-700">Live Camera Prediction</h3>
                    {/* Top Result */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        <div className="text-sm text-slate-500 mb-1">{t('supervised.prediction.confidence')} {(top.confidence * 100).toFixed(1)}%</div>
                        <div className="text-2xl font-bold text-indigo-600">
                            {classes.find(c => c.id === top.label)?.name || `Class ${top.label}`}
                        </div>
                    </div>

                    {/* Bars */}
                    <div className="space-y-2">
                        {sorted.map((pred) => {
                            const cls = classes.find(c => c.id === pred.label);
                            return (
                                <div key={pred.label} className="flex items-center gap-3 text-sm">
                                    <span className="w-16 truncate text-right font-medium text-slate-600">
                                        {cls?.name || pred.label}
                                    </span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300 ease-out"
                                            style={{
                                                width: `${pred.confidence * 100}%`,
                                                backgroundColor: cls?.color || '#cbd5e1'
                                            }}
                                        />
                                    </div>
                                    <span className="w-12 text-xs text-slate-400 tabular-nums">
                                        {(pred.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : predictionImages.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <p>{t('supervised.prediction.waiting')}</p>
                    <p className="text-xs mt-1 opacity-70">
                        {!isModelTrained ? t('supervised.prediction.no_model') : 'Upload images or press Start to predict'}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
