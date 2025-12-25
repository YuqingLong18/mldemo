import { Trash2, Plus, Camera, Layers } from 'lucide-react';
import clsx from 'clsx';
import { type ClassInfo } from '../pages/Supervised/SupervisedLab';
import { useLanguage } from '../lib/i18n';

interface DatasetPanelProps {
    classes: ClassInfo[];
    activeClass: string | null;
    onAddClass: () => void;
    onRemoveClass: (id: string) => void;
    onCapture: (id: string) => void;
    onClassNameChange: (id: string, newName: string) => void;
    isModelReady: boolean;
}

export default function DatasetPanel({
    classes,
    onAddClass,
    onRemoveClass,
    onCapture,
    onClassNameChange,
    isModelReady
}: DatasetPanelProps) {
    const { t } = useLanguage();

    const totalExamples = classes.reduce((sum, c) => sum + c.count, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-slate-900">{t('supervised.dataset.title')}</h2>
                    <p className="text-xs text-slate-500">{t('supervised.dataset.total')} {totalExamples}</p>
                </div>
                <button
                    onClick={onAddClass}
                    className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-200"
                    title={t('supervised.dataset.add_class')}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {classes.map((c) => (
                    <div key={c.id} className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                        {/* Header */}
                        <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: c.color }}
                                />
                                <input
                                    type="text"
                                    value={c.name}
                                    onChange={(e) => onClassNameChange(c.id, e.target.value)}
                                    className="bg-transparent font-medium text-slate-900 focus:outline-none focus:border-b border-indigo-500 w-32 px-1 hover:bg-slate-100 rounded transition-colors"
                                />
                                <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                    {c.count} {t('supervised.class.samples')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onRemoveClass(c.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {c.thumbnails && c.thumbnails.length > 0 && (
                            <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
                                {c.thumbnails.map((src, idx) => (
                                    <img
                                        key={idx}
                                        src={src}
                                        alt="thumb"
                                        className="w-10 h-10 object-cover rounded border border-slate-200 bg-white"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Capture Button */}
                        <div className="p-2 bg-white border-t border-slate-100">
                            <button
                                onMouseDown={() => onCapture(c.id)}
                                disabled={!isModelReady}
                                className={clsx(
                                    "w-full py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95",
                                    !isModelReady
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 shadow-sm hover:shadow"
                                )}
                            >
                                <Camera className="w-4 h-4" />
                                {t('supervised.class.add_example')}
                            </button>
                        </div>
                    </div>
                ))}

                {classes.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <Layers className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No classes added.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
