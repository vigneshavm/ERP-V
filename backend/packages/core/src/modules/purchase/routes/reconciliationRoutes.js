import express from "express";
import { markReconciled, getReconciliationStatus, unreconcile } from "../controllers/SupplierReconciliationController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
router.post("/", protect, markReconciled);
router.get("/status", protect, getReconciliationStatus);
router.delete("/:transactionId", protect, unreconcile);
export default router;
