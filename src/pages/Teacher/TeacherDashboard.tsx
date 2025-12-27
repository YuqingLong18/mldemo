import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassroom, type FeaturedDataMessage } from '../../lib/classroom/ClassroomContext';
import { clearTeacherAuth } from '../../lib/teacherAuth';
import { Users, Eye, EyeOff, Activity, LogOut, Trash2, Loader2 } from 'lucide-react';
import clsx from 'clsx';


import { useLanguage } from '../../lib/i18n';

export default function TeacherDashboard() {
    const { t } = useLanguage();
    const {
        createRoom,
        code,
        students,
        attentionMode,
        toggleAttention,
        kickStudent,
        leaveRoom,
        requestStudentModel,
        onFeaturedData
    } = useClassroom();

    const [activeTab, setActiveTab] = useState<'roster' | 'monitoring'>('roster');
    const [transferringId, setTransferringId] = useState<string | null>(null);
    const transferTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        leaveRoom();
        clearTeacherAuth();
        navigate('/teacher/login', { replace: true });
    };

    // Listen for incoming student model
    useEffect(() => {
        const handleFeaturedData = (data: FeaturedDataMessage) => {
            if (transferringId && data.studentId && data.studentId !== transferringId) {
                return;
            }

            // Clear any pending timeout
            if (transferTimeoutRef.current) {
                clearTimeout(transferTimeoutRef.current);
                transferTimeoutRef.current = null;
            }
            
            setTransferringId(null); // Clear loading state

            if (data.mode === 'unsupervised') {
                const snapshot = data.unsupervised;
                const hasData = snapshot && snapshot.points && snapshot.points.length > 0;
                const studentName = data.studentName || t('common.unknown');

                if (!hasData) {
                    alert(t('teacher.dashboard.feature_no_clustering').replace('{name}', studentName));
                    return;
                }

                navigate('/unsupervised', {
                    state: {
                        featured: true,
                        studentName: data.studentName,
                        unsupervised: snapshot
                    }
                });
                return;
            }

            const supervisedSnapshot = data.supervised;
            const studentName = data.studentName || t('common.unknown');
            const hasData = supervisedSnapshot && Object.keys(supervisedSnapshot.dataset || {}).length > 0;

            if (!hasData) {
                alert(t('teacher.dashboard.feature_no_model').replace('{name}', studentName));
                return;
            }

            // Navigate to SupervisedLab with data
            navigate('/supervised', {
                state: {
                    featured: true,
                    studentName: data.studentName,
                    supervised: supervisedSnapshot
                }
            });
        };
        
        onFeaturedData(handleFeaturedData);
        
        return () => {
            if (transferTimeoutRef.current) {
                clearTimeout(transferTimeoutRef.current);
            }
        };
    }, [navigate, onFeaturedData, transferringId, t]);

    const handleRequestModel = (studentId: string) => {
        if (transferringId) return; // Prevent multiple requests
        
        // Clear any existing timeout
        if (transferTimeoutRef.current) {
            clearTimeout(transferTimeoutRef.current);
        }
        
        setTransferringId(studentId);
        requestStudentModel(studentId);
        
        // Set a timeout (10 seconds) - if no response, clear loading state
        transferTimeoutRef.current = setTimeout(() => {
            setTransferringId(null);
            transferTimeoutRef.current = null;
            alert(t('teacher.dashboard.feature_timeout'));
        }, 10000);
    };

    if (!code) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">{t('teacher.dashboard.title')}</h1>
                    <p className="text-slate-500">{t('teacher.dashboard.subtitle')}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={createRoom}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
                    >
                        <Users className="w-6 h-6" />
                        {t('teacher.dashboard.create_btn')}
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-8 py-4 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 text-lg font-semibold rounded-xl shadow-sm transition-all flex items-center gap-3"
                    >
                        <Activity className="w-6 h-6" />
                        {t('teacher.dashboard.demo_btn')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header / Room Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('teacher.dashboard.code_label')}</h2>
                    <div className="text-5xl font-mono font-bold text-indigo-600 tracking-widest my-2 select-all cursor-pointer" title={t('teacher.dashboard.copy_code')}>
                        {code}
                    </div>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {students.length} {t('teacher.dashboard.students_joined')}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/home')}
                        className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                    >
                        {t('teacher.dashboard.demo_btn')}
                    </button>
                    <button
                        onClick={() => toggleAttention(!attentionMode)}
                        className={clsx(
                            "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all",
                            attentionMode
                                ? "bg-red-500 text-white hover:bg-red-600 shadow-md ring-2 ring-red-200"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                    >

                        {attentionMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        {attentionMode ? t('teacher.dashboard.attention_on') : t('teacher.dashboard.attention_off')}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('teacher.dashboard.end_session')}
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-full md:w-fit">
                <button
                    onClick={() => setActiveTab('roster')}
                    className={clsx(
                        'flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all',
                        activeTab === 'roster'
                            ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5'
                            : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                    )}
                >

                    <Users className="w-4 h-4" />
                    {t('teacher.dashboard.tab.roster')}
                </button>
                <button
                    onClick={() => setActiveTab('monitoring')}
                    className={clsx(
                        'flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all',
                        activeTab === 'monitoring'
                            ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5'
                            : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                    )}
                >

                    <Activity className="w-4 h-4" />
                    {t('teacher.dashboard.tab.monitoring')}
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px] overflow-hidden">
                {activeTab === 'roster' && (
                    <div className="divide-y divide-slate-100">
                        {students.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Users className="w-12 h-12 mb-4 opacity-20" />
                                <p>{t('teacher.dashboard.waiting')} <span className="font-mono font-bold text-slate-600">{code}</span>...</p>
                            </div>
                        ) : (
                            students.map(student => (
                                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{student.name}</h3>
                                            <span className={clsx(
                                                "text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1",
                                                student.status === 'idle' && "bg-slate-100 text-slate-600",
                                                student.status === 'collecting' && "bg-blue-100 text-blue-700",
                                                student.status === 'training' && "bg-amber-100 text-amber-700",
                                                student.status === 'predicting' && "bg-emerald-100 text-emerald-700"
                                            )}>
                                                {student.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRequestModel(student.id)}
                                            disabled={!!transferringId}
                                            className={clsx(
                                                "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border flex items-center gap-2",
                                                transferringId === student.id
                                                    ? "bg-indigo-100 text-indigo-800 border-indigo-200 cursor-wait"
                                                    : transferringId
                                                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                                            )}
                                        >
                                            {transferringId === student.id ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    {t('teacher.dashboard.feature_student')}...
                                                </>
                                            ) : (
                                                t('teacher.dashboard.feature_student')
                                            )}
                                        </button>
                                        <button
                                            onClick={() => kickStudent(student.id)}
                                            className="text-slate-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                                            title={t('teacher.dashboard.kick_student')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'monitoring' && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map(student => (
                            <div key={student.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-900">{student.name}</h3>
                                    <span className={clsx(
                                        "w-2 h-2 rounded-full",
                                        student.metrics?.converged || student.metrics?.accuracy ? "bg-emerald-500" : "bg-slate-300"
                                    )} />
                                </div>

                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between">
                                        <span>{t('teacher.dashboard.status')}</span>
                                        <span className="font-medium text-slate-900 capitalize">{student.status}</span>
                                    </div>
                                    {student.metrics?.samples !== undefined && (
                                        <div className="flex justify-between">
                                            <span>{t('teacher.dashboard.samples')}</span>
                                            <span className="font-medium">{student.metrics.samples}</span>
                                        </div>
                                    )}
                                    {student.metrics?.accuracy !== undefined && (
                                        <div className="flex justify-between">
                                            <span>{t('teacher.dashboard.accuracy')}</span>
                                            <span className="font-medium text-emerald-600">{(student.metrics.accuracy * 100).toFixed(1)}%</span>
                                        </div>
                                    )}
                                    {student.metrics?.k !== undefined && (
                                        <div className="flex justify-between">
                                            <span>{t('teacher.dashboard.k_clusters')}</span>
                                            <span className="font-medium">{student.metrics.k}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
