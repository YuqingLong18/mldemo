import { useClassroom } from '../../lib/classroom/ClassroomContext';
import { Eye } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

export default function AttentionOverlay() {
    const { t } = useLanguage();
    const { attentionMode, isTeacher } = useClassroom();

    if (!attentionMode || isTeacher) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-8 animate-in fade-in duration-500">
            <div className="mb-8 p-6 bg-white/10 rounded-full animate-bounce">
                <Eye className="w-16 h-16" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">{t('attention.title')}</h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-xl">
                {t('attention.message')}
            </p>
        </div>
    );
}
