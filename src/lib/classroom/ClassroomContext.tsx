import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

interface Metrics {
    samples?: number;
    accuracy?: number;
    k?: number;
    converged?: boolean;
}

interface Student {
    id: string;
    name: string;
    status: 'idle' | 'collecting' | 'training' | 'predicting' | 'clustering';
    metrics: Metrics;
}

interface ClassroomState {
    code: string | null;
    isTeacher: boolean;
    attentionMode: boolean;
    students: Student[];
    isConnected: boolean;
}

interface ClassroomContextType extends ClassroomState {
    joinRoom: (code: string, name: string) => void;
    createRoom: () => void;
    leaveRoom: () => void;
    toggleAttention: (enabled: boolean) => void;
    kickStudent: (studentId: string) => void;
    updateStatus: (status: string, metrics?: Metrics) => void;
    requestStudentModel: (studentId: string) => void;
    sendModelData: (thumbnails: any, dataset: any) => void;
    onFeaturedData: (callback: (data: any) => void) => void;
    onRequestModel: (callback: () => void) => void;
    error: string | null;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

// Adjust URL for production deployment
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3015';

export function ClassroomProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [state, setState] = useState<ClassroomState>({
        code: null,
        isTeacher: false,
        attentionMode: false,
        students: [],
        isConnected: false
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true
        });

        newSocket.on('connect', () => {
            console.log('Connected to classroom server');
            setState(prev => ({ ...prev, isConnected: true }));
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from classroom server');
            setState(prev => ({ ...prev, isConnected: false }));
        });

        newSocket.on('room_created', (code: string) => {
            setState(prev => ({ ...prev, code, isTeacher: true, students: [] }));
            setError(null);
        });

        newSocket.on('joined_room', ({ code, attentionMode }) => {
            setState(prev => ({ ...prev, code, isTeacher: false, attentionMode }));
            setError(null);
        });

        newSocket.on('room_state_update', (roomState: any) => {
            // Teacher receives full student list
            // Students might receive this too based on current simple implementation
            setState(prev => ({
                ...prev,
                code: roomState.code,
                attentionMode: roomState.attentionMode,
                students: roomState.students || []
            }));
        });

        newSocket.on('attention_mode_change', (enabled: boolean) => {
            setState(prev => ({ ...prev, attentionMode: enabled }));
        });

        newSocket.on('kicked', () => {
            setState({
                code: null,
                isTeacher: false,
                attentionMode: false,
                students: [],
                isConnected: true
            });
            setError("You have been removed from the classroom.");
        });

        newSocket.on('error', (msg: string) => {
            setError(msg);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Event listeners
    useEffect(() => {
        if (!socket) return;

        // These need to be mutable refs or managed outside if we want to change listeners dynamically
        // But for global context, we can expose the socket or helper methods.
    }, [socket]);

    const requestStudentModel = (studentId: string) => {
        socket?.emit('request_model', { studentId });
    };

    const sendModelData = (thumbnails: any, dataset: any) => {
        socket?.emit('student_model_data', { thumbnails, dataset });
    };

    const onRequestModel = (callback: () => void) => {
        if (!socket) return;
        socket.off('request_model');
        socket.on('request_model', callback);
    };

    const onFeaturedData = (callback: (data: any) => void) => {
        if (!socket) return;
        socket.off('student_featured_data');
        socket.on('student_featured_data', callback);
    };

    const createRoom = () => {
        socket?.emit('create_room');
    };

    const joinRoom = (code: string, name: string) => {
        socket?.emit('join_room', { code, name });
    };

    const leaveRoom = () => {
        socket?.disconnect();
        socket?.connect(); // Reconnect to get fresh socket ID? Or just reset state
        setState(prev => ({
            ...prev,
            code: null,
            isTeacher: false,
            attentionMode: false,
            students: []
        }));
    };

    const toggleAttention = (enabled: boolean) => {
        if (state.code) {
            socket?.emit('toggle_attention', { code: state.code, enabled });
        }
    };

    const kickStudent = (studentId: string) => {
        if (state.code) {
            socket?.emit('kick_student', { code: state.code, studentId });
        }
    };

    const updateStatus = (status: string, metrics?: Metrics) => {
        if (state.code && !state.isTeacher) {
            socket?.emit('update_status', { status, metrics });
        }
    };

    return (
        <ClassroomContext.Provider value={{
            ...state,
            joinRoom,
            createRoom,
            leaveRoom,
            toggleAttention,
            kickStudent,
            updateStatus,
            requestStudentModel,
            sendModelData,
            onRequestModel,
            onFeaturedData,
            error
        }}>
            {children}
        </ClassroomContext.Provider>
    );
}

export function useClassroom() {
    const context = useContext(ClassroomContext);
    if (!context) {
        throw new Error('useClassroom must be used within a ClassroomProvider');
    }
    return context;
}
