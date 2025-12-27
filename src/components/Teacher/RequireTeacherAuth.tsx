import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTeacherAuthenticated } from '../../lib/teacherAuth';

export default function RequireTeacherAuth({ children }: { children: ReactNode }) {
    const location = useLocation();

    if (!isTeacherAuthenticated()) {
        return <Navigate to="/teacher/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
}
