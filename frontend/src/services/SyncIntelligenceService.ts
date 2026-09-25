import api from "./api";
import { db } from "./db";
import { DeviceRegistryEntry, SyncLedgerEntry } from "../types/tenant";

// Sync events older than this are pruned from this device's log.
const LEDGER_RETENTION_DAYS = 30;

// Backend Device document (backend/src/modules/core/models/Device.ts) -- Mongo `_id` and Date
// fields, distinct from the frontend DeviceRegistryEntry's `id` and ISO strings.
const toDeviceEntry = (raw: any): DeviceRegistryEntry => ({
    id: raw._id || raw.id,
    name: raw.name,
    branchId: raw.branchId || '',
    userId: raw.userId || '',
    platform: raw.platform,
    osVersion: raw.osVersion || '',
    appVersion: raw.appVersion || '',
    lastSyncAt: raw.lastSyncAt ? new Date(raw.lastSyncAt).toISOString() : '',
    lastOnlineAt: raw.lastOnlineAt ? new Date(raw.lastOnlineAt).toISOString() : '',
    ipAddress: raw.ipAddress || '',
    status: raw.status,
    isOnline: Boolean(raw.isOnline),
    syncHealth: raw.syncHealth ?? 0,
    errorRate: raw.errorRate ?? 0,
    pendingOps: raw.pendingOps ?? 0
});

export class SyncIntelligenceService {
    /**
     * Device Registry: the tenant's registered devices from GET /api/sync/devices.
     * Throws on failure so the screen shows an error instead of an empty or invented fleet.
     */
    static async getDevices(): Promise<DeviceRegistryEntry[]> {
        const res = await api.get('/api/sync/devices');
        const raw = res.data?.data ?? res.data;
        return Array.isArray(raw) ? raw.map(toDeviceEntry) : [];
    }

    /**
     * Sync Ledger: records a sync outcome in this device's local database (Dexie `syncLedger`),
     * so the ledger shows what this device actually synced or failed to sync.
     */
    static async logEvent(entry: Omit<SyncLedgerEntry, 'id' | 'timestamp' | 'hash'>): Promise<void> {
        const timestamp = new Date().toISOString();
        const id = `LE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const hash = btoa(`${id}-${timestamp}-${entry.entityId}`);

        try {
            await db.syncLedger.add({ ...entry, id, timestamp, hash });
            const cutoff = new Date(Date.now() - LEDGER_RETENTION_DAYS * 86400000).toISOString();
            await db.syncLedger.where('timestamp').below(cutoff).delete();
        } catch (err) {
            // Logging must never break the sync that triggered it.
            console.error('[Sync Intelligence] Failed to record ledger event:', err);
        }
    }

    /** Most recent sync events recorded on this device, newest first. */
    static async getLedger(limit = 50): Promise<SyncLedgerEntry[]> {
        return db.syncLedger.orderBy('timestamp').reverse().limit(limit).toArray();
    }

    /**
     * Anomaly Detection: rule-based flags over the registered devices' reported figures.
     */
    static async detectAnomalies(devices: DeviceRegistryEntry[]): Promise<string[]> {
        const anomalies: string[] = [];
        devices.forEach(d => {
            if (d.errorRate > 10) anomalies.push(`High error rate detected on ${d.name} (${d.errorRate}%)`);
            if (d.pendingOps > 10 && !d.isOnline) anomalies.push(`${d.name} has critical pending data and is OFFLINE.`);
        });
        return anomalies;
    }
}
