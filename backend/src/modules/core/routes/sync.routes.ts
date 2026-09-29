import express from "express";
import {
    getSyncConfig,
    updateSettings,
    getDevices,
    addDevice,
    getBackups,
    triggerBackup,
    restoreBackup,
    getConflicts,
    uploadLedgerEvents,
    getLedgerEvents
} from "../controllers/SyncController.js";
import {
    getSqlRestoreConfig,
    getDiscoveredBackupFiles,
    verifyBackupFile,
    restoreSqlDatabase,
    triggerTextileSync,
} from "../controllers/SqlRestoreController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/config", protect, getSyncConfig);
router.put("/settings", protect, updateSettings);

router.get("/devices", protect, getDevices);
router.post("/devices", protect, addDevice);

router.get("/backups", protect, getBackups);
router.post("/backups", protect, triggerBackup);
router.post("/restore", protect, restoreBackup);

router.get("/conflicts", protect, getConflicts);

router.get("/ledger", protect, getLedgerEvents);
router.post("/ledger", protect, uploadLedgerEvents);

// SQL Server Database Restore & Sync routes
router.get("/sql/config", protect, getSqlRestoreConfig);
router.get("/sql/backup-files", protect, getDiscoveredBackupFiles);
router.post("/sql/backup-files", protect, getDiscoveredBackupFiles);
router.post("/sql/verify", protect, verifyBackupFile);
router.post("/sql/restore", protect, restoreSqlDatabase);
router.post("/sql/sync", protect, triggerTextileSync);

export default router;
