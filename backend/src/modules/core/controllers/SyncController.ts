import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import SyncSettings from "../models/SyncSettings.js";
import Device from "../models/Device.js";
import Backup from "../models/Backup.js";
import Conflict from "../models/Conflict.js";
import SyncLedgerEvent from "../models/SyncLedgerEvent.js";

export const getSyncConfig = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId; // Assuming middleware populates this

    // Fetch real data
    const settings = await SyncSettings.findOne({ tenantId });
    const devices = await Device.find({ tenantId });
    const conflicts = await Conflict.find({ tenantId, status: 'OPEN' });

    // Default settings if not found
    const finalSettings = settings || {
        autoSync: true,
        syncInterval: 5,
        syncOnWifiOnly: false,
        backgroundSync: true,
        syncDomains: { invoices: true, customers: true, items: true, reports: true, inventory: true, loyalty: true, payments: true }
    };

    res.json({
        success: true,
        data: {
            tenantId,
            devices: devices,
            settings: finalSettings,
            lastSyncAt: new Date().toISOString(), // This would typically come from a sync log
            syncStatus: 'UP_TO_DATE',
            conflicts: conflicts
        }
    });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const { settings } = req.body;

    const updated = await SyncSettings.findOneAndUpdate(
        { tenantId },
        { ...settings, tenantId }, // Ensure tenantId is set
        { new: true, upsert: true }
    );

    res.json({
        success: true,
        data: updated,
        message: "Settings updated successfully"
    });
});

export const getDevices = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const devices = await Device.find({ tenantId });
    res.json({ success: true, data: devices });
});

export const addDevice = asyncHandler(async (_req: Request, res: Response) => {
    // Real QR generation logic should be added here
    res.json({
        success: true,
        data: { qrCode: null, expiry: null }
    });
});

export const getBackups = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const backups = await Backup.find({ tenantId }).sort({ createdAt: -1 });

    // Using defaults instead of hardcoded true for demo
    const config = {
        autoBackupEnabled: false,
        scheduleTime: '00:00',
        retentionDays: 7,
        destination: 'LOCAL',
        modulesToBackup: {}
    };

    res.json({
        success: true,
        data: {
            config,
            history: backups,
            storage: { used: 0, total: 0, warningThreshold: 80 }
        }
    });
});

export const triggerBackup = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, message: "Backup started successfully" });
});

export const restoreBackup = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, message: "Restore process initiated" });
});

export const getConflicts = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const conflicts = await Conflict.find({ tenantId });
    res.json({ success: true, data: conflicts });
});

const LEDGER_STATUSES = new Set(['SYNCED', 'PENDING', 'CONFLICT', 'FAILED']);
const MAX_LEDGER_BATCH = 200;

// Keeps only well-formed events; the tenant and reporting user come from the session, not the body.
export const toLedgerDocs = (events: unknown, tenantId: mongoose.Types.ObjectId, userId?: mongoose.Types.ObjectId) => {
    if (!Array.isArray(events)) return [];
    return events
        .filter((e: any) => e && typeof e.id === 'string' && typeof e.deviceId === 'string'
            && typeof e.eventType === 'string' && typeof e.entityId === 'string'
            && typeof e.entityType === 'string' && LEDGER_STATUSES.has(e.status)
            && !Number.isNaN(Date.parse(e.timestamp)))
        .slice(0, MAX_LEDGER_BATCH)
        .map((e: any) => ({
            tenantId,
            eventId: e.id,
            deviceId: e.deviceId,
            branchId: typeof e.branchId === 'string' ? e.branchId : '',
            eventType: e.eventType,
            entityId: e.entityId,
            entityType: e.entityType,
            status: e.status,
            payload: e.payload && typeof e.payload === 'object' ? e.payload : {},
            hash: typeof e.hash === 'string' ? e.hash : '',
            timestamp: new Date(e.timestamp),
            reportedBy: userId
        }));
};

// POST /api/sync/ledger { events: [...] } -- devices upload their locally recorded sync events.
// Idempotent: events already stored (same tenant + event id) are skipped, so a retried upload is safe.
export const uploadLedgerEvents = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
        res.status(400).json({ success: false, message: 'Sync ledger requires a tenant account' });
        return;
    }
    const docs = toLedgerDocs(req.body?.events, tenantId, (req as any).user?._id);
    if (docs.length > 0) {
        await SyncLedgerEvent.bulkWrite(docs.map(doc => ({
            updateOne: {
                filter: { tenantId, eventId: doc.eventId },
                update: { $setOnInsert: doc },
                upsert: true
            }
        })), { ordered: false });
    }
    res.json({ success: true, data: { accepted: docs.map(d => d.eventId) } });
});

// GET /api/sync/ledger?limit=50 -- the tenant's sync events from all devices, newest first.
export const getLedgerEvents = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
        res.status(400).json({ success: false, message: 'Sync ledger requires a tenant account' });
        return;
    }
    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 50, 1), 500);
    const events = await SyncLedgerEvent.find({ tenantId }).sort({ timestamp: -1 }).limit(limit).lean();
    res.json({
        success: true,
        data: events.map(e => ({
            id: e.eventId,
            deviceId: e.deviceId,
            branchId: e.branchId,
            eventType: e.eventType,
            entityId: e.entityId,
            entityType: e.entityType,
            timestamp: e.timestamp.toISOString(),
            status: e.status,
            payload: e.payload,
            hash: e.hash
        }))
    });
});
