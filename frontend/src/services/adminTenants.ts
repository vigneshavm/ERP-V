import axios, { AxiosInstance } from 'axios';
import type { AdminSession } from './adminAuth';

/**
 * Platform-admin tenant calls for the System Core console. They use the admin's own token (from adminSignIn), not the
 * shared `api` client, which swaps in the stored shop user's token. The session lives in memory only: reloading the
 * page signs the admin out.
 */

let session: AdminSession | null = null;
export const rememberAdminSession = (s: AdminSession) => { session = s; };
export const clearAdminSession = () => { session = null; };
export const currentAdminSession = () => session;

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export interface AdminTenant {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    businessType: string;
    sector: string;
    createdAt: string | null;
    subscriptionEndDate: string | null;
    users: number;
}

const client = (): AxiosInstance => {
    if (!session) throw new Error('Sign in to the administrator console first.');
    return axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL as string, withCredentials: true, headers: { Authorization: `Bearer ${session.token}` } });
};

const message = (err: unknown, fallback: string) => {
    const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
    if (e?.response?.status === 401 || e?.response?.status === 403) return 'Your administrator session has ended. Sign in again.';
    return e?.response?.data?.message || (e?.response ? fallback : 'Cannot reach the server. Check your connection and try again.');
};

export async function listTenants(http: AxiosInstance = client()): Promise<AdminTenant[]> {
    try {
        const { data } = await http.get<AdminTenant[]>('/api/admin/tenants');
        return Array.isArray(data) ? data : [];
    } catch (err) {
        throw new Error(message(err, 'Could not load tenants.'));
    }
}

/** Resolves with the status the server saved; rejects (and nothing changes on screen) if it refused. */
export async function setTenantStatus(id: string, status: 'ACTIVE' | 'SUSPENDED', http: AxiosInstance = client()): Promise<TenantStatus> {
    try {
        const { data } = await http.patch<{ status: TenantStatus }>(`/api/admin/tenants/${encodeURIComponent(id)}/status`, { status });
        return data.status;
    } catch (err) {
        throw new Error(message(err, 'Could not change the tenant status.'));
    }
}
