import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { clearAdminSession, currentAdminSession, listTenants, rememberAdminSession, setTenantStatus } from './adminTenants';

afterEach(() => clearAdminSession());
const err = (status: number, msg?: string) => Object.assign(new Error(String(status)), { response: { status, data: msg ? { message: msg } : {} } });

describe('admin session', () => {
    it('is held in memory and cleared on sign-out', () => {
        rememberAdminSession({ token: 't', id: 'u', name: 'Vikki', email: 'a@x.in' });
        expect(currentAdminSession()?.token).toBe('t');
        clearAdminSession();
        expect(currentAdminSession()).toBeNull();
    });
    it('refuses to call the API without a session', async () => {
        await expect(listTenants()).rejects.toThrow('Sign in to the administrator console first.');
    });
});

describe('tenant calls', () => {
    it('lists tenants and sets status through the admin endpoints', async () => {
        const get = vi.fn(async () => ({ data: [{ id: 't1', name: 'Vikki Textiles', status: 'ACTIVE' }] }));
        const patch = vi.fn(async () => ({ data: { status: 'SUSPENDED' } }));
        const http = { get, patch } as unknown as AxiosInstance;
        expect((await listTenants(http))[0].name).toBe('Vikki Textiles');
        expect(await setTenantStatus('t1', 'SUSPENDED', http)).toBe('SUSPENDED');
        expect(patch).toHaveBeenCalledWith('/api/admin/tenants/t1/status', { status: 'SUSPENDED' });
    });
    it('explains an expired session and server refusals', async () => {
        const http = (e: unknown) => ({ patch: vi.fn(async () => { throw e; }) }) as unknown as AxiosInstance;
        await expect(setTenantStatus('t1', 'SUSPENDED', http(err(403)))).rejects.toThrow('administrator session has ended');
        await expect(setTenantStatus('t1', 'SUSPENDED', http(err(404, 'Tenant not found')))).rejects.toThrow('Tenant not found');
        await expect(setTenantStatus('t1', 'SUSPENDED', http(new Error('Network Error')))).rejects.toThrow('Cannot reach the server');
    });
});
