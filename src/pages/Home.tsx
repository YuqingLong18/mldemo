import { Link } from 'react-router-dom';
import { Camera, Layers, ArrowRight } from 'lucide-react';

export default function Home() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    Learn Machine Learning interactively.
                </h1>
                <p className="text-lg text-slate-600">
                    Experience how computers learn to recognize objects using your webcam.
                    All training happens right here in your browser—no data is sent to any server.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Link
                    to="/supervised"
                    className="group block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-300 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Camera className="w-24 h-24 text-indigo-600" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                            <Camera className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900">Supervised Learning</h3>
                            <p className="text-slate-500 mt-1">
                                Teach the AI by providing examples. "This is an apple", "This is a banana".
                            </p>
                        </div>
                        <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                            Start Supervised Lab <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                </Link>

                <Link
                    to="/unsupervised"
                    className="group block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-emerald-300 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layers className="w-24 h-24 text-emerald-600" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900">Unsupervised Learning</h3>
                            <p className="text-slate-500 mt-1">
                                Let the AI find patterns on its own. It groups similar items together automatically.
                            </p>
                        </div>
                        <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                            Start Unsupervised Lab <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
