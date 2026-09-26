import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const getDevices = vi.fn();
const getLedger = vi.fn();
vi.mock('../../../services/SyncIntelligenceService', () => ({
    SyncIntelligenceService: {
        getDevices: () => getDevices(),
        getLedger: () => getLedger(),
        detectAnomalies: async () => [],
    },
}));

import DeviceIntelligence from './DeviceIntelligence';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('DeviceIntelligence', () => {
    it('shows an error and no invented health figure when devices cannot be loaded', async () => {
        getDevices.mockRejectedValue(new Error('Network Error'));
        getLedger.mockResolvedValue({ entries: [], source: 'server' });
        render(<DeviceIntelligence />);

        expect((await screen.findByRole('alert')).textContent).toMatch(/Could not load registered devices/);
        expect(screen.queryByText('98.4%')).toBeNull();
        expect(screen.getByText('—')).toBeTruthy();
    });

    it('averages sync health over the registered devices', async () => {
        getDevices.mockResolvedValue([
            { id: 'd1', name: 'Counter 1', syncHealth: 90, isOnline: true, pendingOps: 0, errorRate: 0, lastSyncAt: '', branchId: '', platform: 'Windows', status: 'ACTIVE' },
            { id: 'd2', name: 'Counter 2', syncHealth: 70, isOnline: false, pendingOps: 3, errorRate: 0, lastSyncAt: '', branchId: '', platform: 'Windows', status: 'OFFLINE' },
        ]);
        getLedger.mockResolvedValue({ entries: [], source: 'server' });
        render(<DeviceIntelligence />);

        expect(await screen.findByText('80.0%')).toBeTruthy();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('says when the ledger is only this device\'s log because the server is unreachable', async () => {
        getDevices.mockResolvedValue([]);
        getLedger.mockResolvedValue({ entries: [], source: 'device' });
        render(<DeviceIntelligence />);
        fireEvent.click(await screen.findByRole('button', { name: 'LEDGER' }));

        expect(await screen.findByText(/Server unreachable: showing this device's sync results only/)).toBeTruthy();
    });
});
