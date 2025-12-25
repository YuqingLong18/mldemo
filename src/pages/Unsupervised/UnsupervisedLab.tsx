import { useState } from 'react';
import { useLanguage } from '../../lib/i18n';
import WebcamLab from '../../components/Unsupervised/WebcamLab';
import IrisLab from '../../components/Unsupervised/IrisLab';
import { Camera, Flower } from 'lucide-react';
import clsx from 'clsx';

export default function UnsupervisedLab() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'webcam' | 'iris'>('webcam');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">{t('unsupervised.title')}</h1>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-slate-100 p-1">
                <button
                    onClick={() => setActiveTab('webcam')}
                    className={clsx(
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all text-center flex items-center justify-center gap-2',
                        activeTab === 'webcam'
                            ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5'
                            : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                    )}
                >
                    <Camera className="w-4 h-4" />
                    {t('unsupervised.tab.webcam')}
                </button>
                <button
                    onClick={() => setActiveTab('iris')}
                    className={clsx(
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all text-center flex items-center justify-center gap-2',
                        activeTab === 'iris'
                            ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5'
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
                    <WebcamLab />
                ) : (
                    <IrisLab />
                )}
            </div>
        </div>
    );
}
