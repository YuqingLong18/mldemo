
interface Prediction {
    label: string;
    confidence: number;
}

interface PredictionPanelProps {
    predictions: Prediction[];
    classes: { id: string; name: string; color: string }[];
    isPredicting: boolean;
}

export default function PredictionPanel({ predictions, classes, isPredicting }: PredictionPanelProps) {
    if (!isPredicting) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <p className="text-slate-400">Add examples to classes and the model will start predicting automatically.</p>
            </div>
        );
    }

    // Map predictions to class info
    const enrichedPredictions = predictions.map(p => {
        const cls = classes.find(c => c.id === p.label);
        return {
            ...p,
            name: cls?.name || p.label,
            color: cls?.color || '#94a3b8' // slate-400
        };
    }).sort((a, b) => b.confidence - a.confidence);

    const topPrediction = enrichedPredictions[0];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Live Predictions</h2>
                {topPrediction && (
                    <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: topPrediction.color }}>
                        {topPrediction.name}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {enrichedPredictions.map((pred) => (
                    <div key={pred.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{pred.name}</span>
                            <span className="text-slate-500">{(pred.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-100 ease-out"
                                style={{
                                    width: `${pred.confidence * 100}%`,
                                    backgroundColor: pred.color
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
