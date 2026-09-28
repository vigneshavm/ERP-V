import axios, { AxiosError, AxiosInstance } from 'axios';

/**
 * Platform-administrator sign-in for the System Core console.
 *
 * The server decides who is an administrator: the account must sign in with its own email and password
 * (POST /api/auth/login, which already has lockout and rate limiting), and GET /api/admin/session, which only
 * answers for role 'superadmin', must confirm it. Nothing about access is decided or stored in the browser.
 *
 * It uses its own HTTP client rather than the shared `api` instance: that instance swaps in the stored shop
 * user's token on every request and signs the whole app out after repeated 401s, both wrong for this check.
 * The admin token is kept in memory only (not localStorage), so closing or reloading the page ends the session.
 */

export interface AdminSession {
    token: string;
    id: string;
    name: string;
    email: string;
}

const makeClient = (): AxiosInstance =>
    axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL as string, withCredentials: true });

const serverMessage = (err: unknown, fallback: string): string => {
    const e = err as AxiosError<{ message?: string }>;
    const status = e?.response?.status;
    const msg = e?.response?.data?.message;
    if (status === 429) return msg || 'Too many sign-in attempts. Wait a few minutes and try again.';
    if (status === 423) return msg || 'This account is locked after too many failed attempts. Try again later.';
    if (status === 401) return 'Email or password is incorrect.';
    if (!e?.response) return 'Cannot reach the server. Check your connection and try again.';
    return msg || fallback;
};

export async function adminSignIn(email: string, password: string, client: AxiosInstance = makeClient()): Promise<AdminSession> {
    let login: { token?: string; role?: string };
    try {
        login = (await client.post('/api/auth/login', { email: email.trim(), password })).data ?? {};
    } catch (err) {
        throw new Error(serverMessage(err, 'Sign-in failed.'));
    }
    if (!login.token || login.role !== 'superadmin') {
        throw new Error('This account is not a platform administrator.');
    }
    try {
        const s = (await client.get('/api/admin/session', { headers: { Authorization: `Bearer ${login.token}` } })).data ?? {};
        return { token: login.token, id: String(s.id ?? ''), name: String(s.name ?? ''), email: String(s.email ?? email) };
    } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        throw new Error(status === 403 ? 'This account is not a platform administrator.' : serverMessage(err, 'The server did not confirm administrator access.'));
    }
}
