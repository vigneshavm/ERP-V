import express from "express";
import { getAuditLogs } from "../controllers/AuditLogController.js";
import { protect, authorize } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", protect, authorize('owner', 'manager', 'admin'), getAuditLogs);

export default router;
