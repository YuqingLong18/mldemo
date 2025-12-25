import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassroom } from '../lib/classroom/ClassroomContext';
import { useLanguage } from '../lib/i18n';
import { Brain, Users, ArrowRight } from 'lucide-react';

export default function StudentLogin() {
    const { t, language, setLanguage } = useLanguage();
    const { joinRoom } = useClassroom();
    const navigate = useNavigate();

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length === 6 && name.trim().length > 0) {
            joinRoom(code.toUpperCase(), name);
            navigate('/home'); // Go to student dashboard
        } else {
            setError(t('student.code_error'));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                    className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    {language === 'zh' ? 'English' : '中文'}
                </button>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <Brain className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('student.login_title')}</h1>
                    <p className="text-slate-500 mt-2 text-center">{t('student.login_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('student.code')}
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-center tracking-widest uppercase text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="ABC123"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('student.nickname')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={t('student.nickname')}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={code.length < 6 || name.length < 1}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {t('student.join_btn')} <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={() => navigate('/teacher/login')}
                        className="text-slate-400 hover:text-indigo-600 text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        {t('student.iam_teacher')}
                    </button>
                </div>
            </div>
        </div>
    );
}
