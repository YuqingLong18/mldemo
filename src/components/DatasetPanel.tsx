import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

interface ClassData {
    id: string;
    name: string;
    count: number;
    color: string;
}

interface DatasetPanelProps {
    classes: ClassData[];
    activeClass: string | null;
    onAddClass: () => void;
    onRemoveClass: (id: string) => void;
    onCapture: (classId: string) => void;
    isModelReady: boolean;
}

export default function DatasetPanel({
    classes,
    activeClass,
    onAddClass,
    onRemoveClass,
    onCapture,
    isModelReady
}: DatasetPanelProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Training Data</h2>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Classes</span>
            </div>

            <div className="space-y-3">
                {classes.map((cls) => (
                    <div
                        key={cls.id}
                        className={clsx(
                            "relative group p-3 rounded-lg border-2 transition-all",
                            activeClass === cls.id ? "border-indigo-500 bg-indigo-50" : "border-slate-100 hover:border-slate-300"
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cls.color }} />
                                <input
                                    type="text"
                                    defaultValue={cls.name}
                                    className="bg-transparent font-medium text-slate-900 focus:outline-none focus:border-b border-indigo-500 w-24"
                                />
                            </div>
                            <button
                                onClick={() => onRemoveClass(cls.id)}
                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{cls.count} examples</span>
                            <button
                                disabled={!isModelReady}
                                onMouseDown={() => onCapture(cls.id)}
                                className={clsx(
                                    "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                    isModelReady
                                        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:bg-indigo-300"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                <ImageIcon className="w-4 h-4" />
                                Add Example
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onAddClass}
                className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
                <Plus className="w-4 h-4" />
                Add Class
            </button>
        </div>
    );
}
