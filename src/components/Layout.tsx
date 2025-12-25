import { NavLink, Outlet } from 'react-router-dom';
import { Camera, Brain, Layers, Info } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
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
                        <span>Home</span>
                    </NavLink>

                    <NavLink
                        to="/supervised"
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Camera className="w-5 h-5" />
                        <span>Supervised Lab</span>
                    </NavLink>

                    <NavLink
                        to="/unsupervised"
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Layers className="w-5 h-5" />
                        <span>Unsupervised Lab</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
                    <p>Running locally in browser.</p>
                    <p>No data uploaded.</p>
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
