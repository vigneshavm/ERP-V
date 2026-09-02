import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import tenantReducer, { fetchTenantSettings, saveTenantSettings } from './tenantSlice';

// Validates the Settings persistence fix on the frontend side: tenantSlice used to only expose
// a synchronous `updateTenantDetails` reducer with zero backend call, which is why Settings.tsx
// could show "All settings saved successfully!" without anything ever reaching MongoDB. These
// tests cover the two new thunks (fetchTenantSettings / saveTenantSettings) that now back the
// Load and Save flows: Redux state is only ever updated from the server's response, never
// optimistically, so a failed save can never be mistaken for a persisted one.

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    },
}));

import api from '../../services/api';

function buildStore(tenants: any[] = [], authUser: any = { token: 'fake-token', tenantId: 'T1' }) {
    const rootReducer = combineReducers({
        tenant: tenantReducer,
        auth: (state: any = { user: authUser }) => state,
    });
    return configureStore({
        reducer: rootReducer,
        preloadedState: { tenant: { tenants, branches: [], roles: [] } } as any,
    });
}

describe('tenantSlice Settings persistence (Load/Save flow)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('SET-FE-001: fetchTenantSettings calls GET /api/settings and merges the server tenant into Redux', async () => {
        (api.get as any).mockResolvedValue({
            data: { success: true, data: { id: 'T1', name: 'Acme', businessType: 'Pharmacy', sector: 'Pharmacy' } },
        });
        const store = buildStore([{ id: 'T1', name: 'Old Name' }]);

        await store.dispatch(fetchTenantSettings() as any);

        expect(api.get).toHaveBeenCalledWith('/api/settings', { headers: { Authorization: 'Bearer fake-token' } });
        const tenant = store.getState().tenant.tenants.find((t: any) => t.id === 'T1')!;
        expect(tenant.name).toBe('Acme');
        expect(tenant.businessType).toBe('Pharmacy');
        expect(tenant.sector).toBe('Pharmacy');
    });

    it('SET-FE-002: saveTenantSettings PUTs to /api/settings and merges the authoritative server response, not the optimistic local payload', async () => {
        (api.put as any).mockResolvedValue({
            data: { success: true, data: { id: 'T1', name: 'Acme Renamed', businessType: 'Electronics Store', sector: 'Electronics' } },
        });
        const store = buildStore([{ id: 'T1', name: 'Acme' }]);

        const result: any = await store.dispatch(saveTenantSettings({ name: 'Acme Renamed', businessType: 'Electronics Store' } as any) as any);

        expect(api.put).toHaveBeenCalledWith(
            '/api/settings',
            { name: 'Acme Renamed', businessType: 'Electronics Store' },
            { headers: { Authorization: 'Bearer fake-token' } }
        );
        expect(result.type).toBe('tenant/saveSettings/fulfilled');
        const tenant = store.getState().tenant.tenants.find((t: any) => t.id === 'T1')!;
        expect(tenant.name).toBe('Acme Renamed');
        expect(tenant.sector).toBe('Electronics');
    });

    it('SET-FE-003: saveTenantSettings is rejected (not silently treated as success) when the backend responds with success:false', async () => {
        (api.put as any).mockResolvedValue({ data: { success: false, message: 'Invalid settings: business name cannot be empty' } });
        const store = buildStore([{ id: 'T1', name: 'Acme' }]);

        const result: any = await store.dispatch(saveTenantSettings({ name: '' } as any) as any);

        expect(result.type).toBe('tenant/saveSettings/rejected');
        expect(result.payload).toBe('Invalid settings: business name cannot be empty');
        // Redux is left untouched on failure -- no false "saved" state.
        const tenant = store.getState().tenant.tenants.find((t: any) => t.id === 'T1')!;
        expect(tenant.name).toBe('Acme');
    });

    it('SET-FE-004: saveTenantSettings is rejected when the API call itself throws (network/server error)', async () => {
        (api.put as any).mockRejectedValue({ response: { data: { message: 'Server Error' } } });
        const store = buildStore([{ id: 'T1', name: 'Acme' }]);

        const result: any = await store.dispatch(saveTenantSettings({ name: 'X' } as any) as any);

        expect(result.type).toBe('tenant/saveSettings/rejected');
        expect(result.payload).toBe('Server Error');
    });

    it('SET-FE-005: fetchTenantSettings/saveTenantSettings reject with "Not authenticated" and never call the API when there is no auth token', async () => {
        const store = buildStore([], null);

        const fetchResult: any = await store.dispatch(fetchTenantSettings() as any);
        const saveResult: any = await store.dispatch(saveTenantSettings({ name: 'X' } as any) as any);

        expect(fetchResult.type).toBe('tenant/fetchSettings/rejected');
        expect(fetchResult.payload).toBe('Not authenticated');
        expect(saveResult.type).toBe('tenant/saveSettings/rejected');
        expect(saveResult.payload).toBe('Not authenticated');
        expect(api.get).not.toHaveBeenCalled();
        expect(api.put).not.toHaveBeenCalled();
    });
});
