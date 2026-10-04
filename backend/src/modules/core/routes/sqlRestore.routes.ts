import express from "express";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import {
  getSqlRestoreConfig,
  getDiscoveredBackupFiles,
  verifyBackupFile,
  restoreSqlDatabase,
  applyErpDbAccess,
} from "../controllers/SqlRestoreController.js";

/**
 * SQL Server backup discovery / verify / restore only. The old /api/sync routes (Mongo-backed devices,
 * ledger, conflicts) are NOT mounted. Restore replaces the shop database, so owner / co-owner only.
 */
const router = express.Router();
const ownerOnly = authorize("owner", "co-owner");
router.get("/sql/config", protect, ownerOnly, getSqlRestoreConfig);
router.get("/sql/backup-files", protect, ownerOnly, getDiscoveredBackupFiles);
router.post("/sql/backup-files", protect, ownerOnly, getDiscoveredBackupFiles);
router.post("/sql/verify", protect, ownerOnly, verifyBackupFile);
router.post("/sql/restore", protect, ownerOnly, restoreSqlDatabase);
router.post("/sql/access", protect, ownerOnly, applyErpDbAccess);
export default router;
