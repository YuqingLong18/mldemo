import { Play, Square } from 'lucide-react';
import clsx from 'clsx';
import { type ClassInfo } from '../pages/Supervised/SupervisedLab';
import { useLanguage } from '../lib/i18n';

interface PredictionPanelProps {
    predictions: { label: string, confidence: number }[];
    classes: ClassInfo[];
    isPredicting: boolean;
    isModelTrained: boolean;
    onTogglePrediction: (shouldPredict: boolean) => void;
}

export default function PredictionPanel({
    predictions,
    classes,
    isPredicting,
    isModelTrained,
    onTogglePrediction
}: PredictionPanelProps) {
    const { t } = useLanguage();

    // Sort predictions by confidence
    const sorted = [...predictions].sort((a, b) => b.confidence - a.confidence);
    const top = sorted[0];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">{t('supervised.prediction.title')}</h2>
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

            {isPredicting && top ? (
                <div className="space-y-4">
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
            ) : (
                <div className="text-center py-8 text-slate-400">
                    <p>{t('supervised.prediction.waiting')}</p>
                    <p className="text-xs mt-1 opacity-70">
                        {!isModelTrained ? t('supervised.prediction.no_model') : 'Press Start to predict'}
                    </p>
                </div>
            )}
        </div>
    );
}
