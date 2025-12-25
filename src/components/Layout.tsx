import { NavLink, Outlet } from 'react-router-dom';
import { Camera, Brain, Layers, Info, Globe } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../lib/i18n';

export default function Layout() {
    const { t, language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'zh' ? 'en' : 'zh');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Brain className="w-6 h-6 text-indigo-400" />
                        <span>ML Playground</span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Info className="w-5 h-5" />
                        <span>{t('nav.home')}</span>
                    </NavLink>

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
