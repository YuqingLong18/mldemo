const AUTH_STORAGE_KEY = 'teacher-auth';
const DEFAULT_AUTH_SERVICE_URL = 'http://localhost:3000';

const getAuthServiceUrl = () => {
    const envUrl = import.meta.env.VITE_AUTH_URL || import.meta.env.VITE_NEXUSINDEX_URL;
    const baseUrl = (envUrl || DEFAULT_AUTH_SERVICE_URL).trim();
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

export type TeacherAuth = {
    username: string;
    loggedInAt: number;
};

export type VerifyResult =
    | { ok: true; user?: { id?: number | string; username?: string } }
    | { ok: false; reason: 'invalid' | 'server' | 'unavailable'; status?: number };

export const getTeacherAuth = (): TeacherAuth | null => {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as TeacherAuth;
        if (!parsed || typeof parsed.username !== 'string') {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

export const setTeacherAuth = (auth: TeacherAuth) => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

export const clearTeacherAuth = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

export const isTeacherAuthenticated = () => Boolean(getTeacherAuth());

export const verifyTeacherCredentials = async (
    username: string,
    password: string
): Promise<VerifyResult> => {
    try {
        const response = await fetch(`${getAuthServiceUrl()}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const payload = await response.json().catch(() => null);

        if (response.ok && payload?.success) {
            return { ok: true, user: payload.user };
        }

        if (response.status === 401) {
            return { ok: false, reason: 'invalid', status: response.status };
        }

        return { ok: false, reason: 'server', status: response.status };
    } catch {
        return { ok: false, reason: 'unavailable' };
    }
};
