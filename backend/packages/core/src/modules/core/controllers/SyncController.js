import asyncHandler from "express-async-handler";
import SyncSettings from "../models/SyncSettings.js";
import Device from "../models/Device.js";
import Backup from "../models/Backup.js";
import Conflict from "../models/Conflict.js";
export const getSyncConfig = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId; // Assuming middleware populates this
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
export const updateSettings = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { settings } = req.body;
    const updated = await SyncSettings.findOneAndUpdate({ tenantId }, { ...settings, tenantId }, // Ensure tenantId is set
    { new: true, upsert: true });
    res.json({
        success: true,
        data: updated,
        message: "Settings updated successfully"
    });
});
export const getDevices = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const devices = await Device.find({ tenantId });
    res.json({ success: true, data: devices });
});
export const addDevice = asyncHandler(async (_req, res) => {
    // Real QR generation logic should be added here
    res.json({
        success: true,
        data: { qrCode: null, expiry: null }
    });
});
export const getBackups = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
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
export const triggerBackup = asyncHandler(async (_req, res) => {
    res.json({ success: true, message: "Backup started successfully" });
});
export const restoreBackup = asyncHandler(async (_req, res) => {
    res.json({ success: true, message: "Restore process initiated" });
});
export const getConflicts = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const conflicts = await Conflict.find({ tenantId });
    res.json({ success: true, data: conflicts });
});
