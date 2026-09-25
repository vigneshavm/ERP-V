import api from "./api";
import { db } from "./db";
import { DeviceRegistryEntry, SyncLedgerEntry } from "../types/tenant";

// Sync events older than this are pruned from this device's log (the server keeps the same 30 days).
const LEDGER_RETENTION_DAYS = 30;
const DEVICE_ID_KEY = 'erp_sync_device_id';

export interface LedgerResult {
    entries: SyncLedgerEntry[];
    /** 'server': every device's events for the tenant; 'device': this device only (server unreachable). */
    source: 'server' | 'device';
}

let cachedDeviceId: string | null = null;
let uploading = false;

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
     * Stable id for this browser/till, so the combined ledger shows which device an event came from.
     * Kept in localStorage; if storage is unavailable it lasts for this session only.
     */
    static getDeviceId(): string {
        if (cachedDeviceId) return cachedDeviceId;
        let id: string | null = null;
        try { id = localStorage.getItem(DEVICE_ID_KEY); } catch { /* storage unavailable */ }
        if (!id) {
            id = `DEV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            try { localStorage.setItem(DEVICE_ID_KEY, id); } catch { /* storage unavailable */ }
        }
        cachedDeviceId = id;
        return id;
    }

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
     * Sync Ledger: records a sync outcome in this device's local database (Dexie `syncLedger`), then
     * uploads it to the tenant's combined ledger. Recording locally first means nothing is lost
     * while offline; events not yet uploaded are sent on the next upload attempt.
     */
    static async logEvent(entry: Omit<SyncLedgerEntry, 'id' | 'timestamp' | 'hash'>): Promise<void> {
        const timestamp = new Date().toISOString();
        const id = `LE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const hash = btoa(`${id}-${timestamp}-${entry.entityId}`);

        try {
            await db.syncLedger.add({ ...entry, id, timestamp, hash, uploaded: false });
            const cutoff = new Date(Date.now() - LEDGER_RETENTION_DAYS * 86400000).toISOString();
            await db.syncLedger.where('timestamp').below(cutoff).delete();
        } catch (err) {
            // Logging must never break the sync that triggered it.
            console.error('[Sync Intelligence] Failed to record ledger event:', err);
            return;
        }
        await this.uploadPending();
    }

    /**
     * Uploads this device's not-yet-uploaded events to POST /api/sync/ledger and marks the ones the
     * server accepted. Never throws: whatever fails stays pending for the next attempt.
     */
    static async uploadPending(): Promise<void> {
        if (uploading) return;
        uploading = true;
        try {
            const pending = await db.syncLedger.filter(e => !e.uploaded).limit(200).toArray();
            if (pending.length === 0) return;
            // `uploaded` is device-side bookkeeping; the server doesn't store it.
            const events = pending.map(e => {
                const event = { ...e };
                delete event.uploaded;
                return event;
            });
            const res = await api.post('/api/sync/ledger', { events });
            const accepted: string[] = res.data?.data?.accepted ?? [];
            if (accepted.length > 0) {
                await db.syncLedger.where('id').anyOf(accepted).modify({ uploaded: true });
            }
        } catch (err) {
            console.warn('[Sync Intelligence] Ledger upload failed; will retry:', err);
        } finally {
            uploading = false;
        }
    }

    /**
     * The tenant's sync events from every device (GET /api/sync/ledger), newest first. Falls back to
     * this device's own log when the server can't be reached, and says so via `source`.
     */
    static async getLedger(limit = 50): Promise<LedgerResult> {
        await this.uploadPending();
        try {
            const res = await api.get('/api/sync/ledger', { params: { limit } });
            const raw = res.data?.data ?? res.data;
            if (!Array.isArray(raw)) throw new Error('Unexpected ledger response');
            return { entries: raw, source: 'server' };
        } catch {
            const entries = await db.syncLedger.orderBy('timestamp').reverse().limit(limit).toArray();
            return { entries, source: 'device' };
        }
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
