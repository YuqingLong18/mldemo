import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import WebcamLab from '../../components/Unsupervised/WebcamLab';
import IrisLab from '../../components/Unsupervised/IrisLab';
import { Camera, Flower } from 'lucide-react';
import clsx from 'clsx';

export default function UnsupervisedLab() {
    const { t } = useLanguage();
    const location = useLocation();
    const FEATURED_MODE = location.state?.featured;
    const featuredStudentName = location.state?.studentName;
    const featuredSnapshot = location.state?.unsupervised;
    const [activeTab, setActiveTab] = useState<'webcam' | 'iris'>(FEATURED_MODE ? 'webcam' : 'webcam');

    return (
        <div className="space-y-6">
            {FEATURED_MODE && featuredStudentName && (
                <div className="bg-gradient-to-r from-indigo-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg border border-indigo-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                {featuredStudentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm opacity-90">Viewing Student Clustering</p>
                                <p className="text-lg font-bold">{featuredStudentName}'s Clusters</p>
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

            <h1 className="text-2xl font-bold text-slate-900">{t('unsupervised.title')}</h1>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-slate-100 p-1">
                <button
                    onClick={() => {
                        if (!FEATURED_MODE) setActiveTab('webcam');
                    }}
                    disabled={FEATURED_MODE}
                    className={clsx(
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all text-center flex items-center justify-center gap-2',
                        activeTab === 'webcam'
                            ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5'
                            : FEATURED_MODE
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                    )}
                >
                    <Camera className="w-4 h-4" />
                    {t('unsupervised.tab.webcam')}
                </button>
                <button
                    onClick={() => {
                        if (!FEATURED_MODE) setActiveTab('iris');
                    }}
                    disabled={FEATURED_MODE}
                    className={clsx(
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all text-center flex items-center justify-center gap-2',
                        activeTab === 'iris'
                            ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5'
                            : FEATURED_MODE
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                    )}
                >
                    <Flower className="w-4 h-4" />
                    {t('unsupervised.tab.iris')}
                </button>
            </div>

            {/* Content */}
            <div className="mt-4">
                {activeTab === 'webcam' ? (
                    <WebcamLab readOnly={Boolean(FEATURED_MODE)} snapshot={featuredSnapshot} />
                ) : (
                    <IrisLab />
                )}
            </div>
        </div>
    );
}
