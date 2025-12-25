import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function LoginPlaceholder({ onLogin }: { onLogin: () => void }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Since we don't have real auth yet, any non-empty PIN works effectively, 
        // or we can hardcode '1234' for "security".
        if (pin.length >= 4) {
            onLogin();
        } else {
            setError(true);
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Teacher Login</h2>
                    <p className="text-slate-500 mt-2 text-center">Enter your access PIN to manage the classroom.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                setError(false);
                            }}
                            placeholder="Enter PIN (any 4+ chars)"
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl border text-lg text-center tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all",
                                error ? "border-red-300 bg-red-50" : "border-slate-300"
                            )}
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm mt-2 text-center">Invalid PIN format</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        Access Dashboard
                    </button>

                    <p className="text-xs text-slate-400 text-center mt-4">
                        (Demo Mode: Enter any PIN)
                    </p>
                </form>
            </div>
        </div>
    );
}

// Helper needed because I used clsx in this file but didn't import it in standard react way? 
// Actually I should just import it.
import clsx from 'clsx';
