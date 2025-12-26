import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Camera, Brain, Layers, Info, Globe, LayoutDashboard } from 'lucide-react';
import { useClassroom } from '../lib/classroom/ClassroomContext';
import clsx from 'clsx';
import { useLanguage } from '../lib/i18n';

import JoinClassModal from './Classroom/JoinClassModal';
import AttentionOverlay from './Classroom/AttentionOverlay';

export default function Layout() {
    const { t, language, setLanguage } = useLanguage();
    const { isTeacher } = useClassroom();
    const location = useLocation();

    // Determine if we are in a "Teacher Context"
    // Either strictly by isTeacher state, or by URL path heuristic if reload happened
    const isTeacherRoute = isTeacher || location.pathname.startsWith('/teacher');
    // We can also use useClassroom here to get status for indicator if needed
    // But StudentStatusIndicator handles it loosely

    const toggleLanguage = () => {
        setLanguage(language === 'zh' ? 'en' : 'zh');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            <AttentionOverlay />
            <JoinClassModal />
            {/* 
               We need to pass 'status' to StudentStatusIndicator.
               Since Layout doesn't know the specific page status (e.g. collecting vs training),
               we have two options:
               1. Lift state up (complex refactor)
               2. Use a context or simpler method.
               
               For MVP, let's put StudentStatusIndicator INSIDE specific pages (Supervised/Unsupervised) 
               or just let those pages call 'updateStatus' directly via hook.
               The component was designed to take props.
               
               Actually, the hook `updateStatus` is exposed. Pages should call it.
               So we don't need StudentStatusIndicator here unless it *displays* status.
               But the planned component was "Visual feedback of connection status".
               Let's re-read the component code.
               
               Ah, StudentStatusIndicator takes props and calls updateStatus effect.
               So it should be used in SupervisedLab, not here.
            */}

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Brain className="w-6 h-6 text-indigo-400" />
                        <span>ML Playground</span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {isTeacherRoute ? (
                        <NavLink
                            to="/teacher/dashboard"
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span>{t('nav.return_dashboard')}</span>
                        </NavLink>
                    ) : (
                        <NavLink
                            to="/home"
                            end // /home is unique, so end is fine
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Info className="w-5 h-5" />
                            <span>{t('nav.home')}</span>
                        </NavLink>
                    )}


                    <NavLink
                        to="/supervised"
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Camera className="w-5 h-5" />
                        <span>{t('nav.supervised')}</span>
                    </NavLink>

                    <NavLink
                        to="/unsupervised"
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Layers className="w-5 h-5" />
                        <span>{t('nav.unsupervised')}</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-4">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-sm text-slate-200 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>{language === 'zh' ? '中文' : 'English'}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                            {language === 'zh' ? 'CN' : 'EN'}
                        </span>
                    </button>

                    <div className="text-xs text-slate-500">
                        <p>Running locally in browser.</p>
                        <p>No data uploaded.</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
