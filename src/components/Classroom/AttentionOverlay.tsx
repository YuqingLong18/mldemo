import { useClassroom } from '../../lib/classroom/ClassroomContext';
import { Eye } from 'lucide-react';

export default function AttentionOverlay() {
    const { attentionMode, isTeacher } = useClassroom();

    if (!attentionMode || isTeacher) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-8 animate-in fade-in duration-500">
            <div className="mb-8 p-6 bg-white/10 rounded-full animate-bounce">
                <Eye className="w-16 h-16" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">EYES ON TEACHER</h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-xl">
                Please pause your work and look at the front of the classroom for instructions.
            </p>
        </div>
    );
}
