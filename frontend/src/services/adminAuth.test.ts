import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { adminSignIn } from './adminAuth';

const httpError = (status: number, message?: string) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data: message ? { message } : {} } });

function fakeClient(opts: { login?: unknown; loginError?: unknown; session?: unknown; sessionError?: unknown }) {
    const post = vi.fn(async () => {
        if (opts.loginError) throw opts.loginError;
        return { data: opts.login };
    });
    const get = vi.fn(async () => {
        if (opts.sessionError) throw opts.sessionError;
        return { data: opts.session };
    });
    return { client: { post, get } as unknown as AxiosInstance, post, get };
}

describe('adminSignIn', () => {
    it('signs in a superadmin confirmed by the server, sending the new token to /api/admin/session', async () => {
        const f = fakeClient({ login: { token: 'tok', role: 'superadmin' }, session: { id: 'u1', name: 'Vikki', email: 'a@x.in', role: 'superadmin' } });
        const s = await adminSignIn(' a@x.in ', 'pw', f.client);
        expect(s).toEqual({ token: 'tok', id: 'u1', name: 'Vikki', email: 'a@x.in' });
        expect(f.post).toHaveBeenCalledWith('/api/auth/login', { email: 'a@x.in', password: 'pw' });
        expect(f.get).toHaveBeenCalledWith('/api/admin/session', { headers: { Authorization: 'Bearer tok' } });
    });

    it('rejects a valid shop account without asking for the admin session', async () => {
        const f = fakeClient({ login: { token: 'tok', role: 'owner' } });
        await expect(adminSignIn('o@x.in', 'pw', f.client)).rejects.toThrow('not a platform administrator');
        expect(f.get).not.toHaveBeenCalled();
    });

    it('rejects when the server refuses the session (403), even if login said superadmin', async () => {
        const f = fakeClient({ login: { token: 'tok', role: 'superadmin' }, sessionError: httpError(403, "Role 'owner' is not authorized") });
        await expect(adminSignIn('a@x.in', 'pw', f.client)).rejects.toThrow('not a platform administrator');
    });

    it('explains wrong password, lockout, rate limit and network failure', async () => {
        await expect(adminSignIn('a', 'b', fakeClient({ loginError: httpError(401, 'Invalid credentials') }).client)).rejects.toThrow('Email or password is incorrect.');
        await expect(adminSignIn('a', 'b', fakeClient({ loginError: httpError(423) }).client)).rejects.toThrow(/locked/);
        await expect(adminSignIn('a', 'b', fakeClient({ loginError: httpError(429) }).client)).rejects.toThrow(/Too many/);
        await expect(adminSignIn('a', 'b', fakeClient({ loginError: new Error('Network Error') }).client)).rejects.toThrow(/Cannot reach the server/);
    });

    it('rejects a login response without a token', async () => {
        await expect(adminSignIn('a', 'b', fakeClient({ login: { role: 'superadmin' } }).client)).rejects.toThrow('not a platform administrator');
    });
});
