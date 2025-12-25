import { useEffect } from 'react';
import { useClassroom } from '../../lib/classroom/ClassroomContext';

interface Props {
    status: 'idle' | 'collecting' | 'training' | 'predicting' | 'clustering';
    metrics?: {
        samples?: number;
        accuracy?: number;
        k?: number;
        converged?: boolean;
    };
}

export default function StudentStatusIndicator({ status, metrics }: Props) {
    const { updateStatus } = useClassroom();

    // Debounce updates to avoid flooding server?
    // For MVP, just update on change.
    useEffect(() => {
        updateStatus(status, metrics);
    }, [status, metrics?.samples, metrics?.accuracy, metrics?.k, metrics?.converged]);

    return null; // Invisible component, purely logic
}
