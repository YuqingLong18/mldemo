import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useClassroom } from '../../lib/classroom/ClassroomContext';
import { Users, Loader2 } from 'lucide-react';

export default function JoinClassModal() {
    const { joinRoom, isConnected, code } = useClassroom();
    const [isOpen, setIsOpen] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [name, setName] = useState('');
    const location = useLocation();

    // Hide on teacher dashboard
    if (location.pathname.includes('/teacher')) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length === 6 && name.length > 0) {
            joinRoom(roomCode.toUpperCase(), name);
            setIsOpen(false);
        }
    };

    if (code) {
        // Already joined
        return (
            <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur border border-indigo-100 shadow-lg p-3 rounded-full flex items-center gap-2 text-sm text-indigo-900 z-50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected to Class <span className="font-mono font-bold">{code}</span>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg px-4 py-2 rounded-full flex items-center gap-2 font-medium transition-all z-50"
            >
                <Users className="w-4 h-4" />
                Join Class
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Join Classroom</h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Room Code</label>
                        <input
                            type="text"
                            maxLength={6}
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-center tracking-widest uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="ABC123"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Enter your name"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!isConnected || roomCode.length < 6 || name.length < 1}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {!isConnected ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
                    </button>
                </form>
            </div>
        </div>
    );
}
