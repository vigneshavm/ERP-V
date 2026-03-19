import express from "express";
import { createDueAdjustment, getDueAdjustments, getCustomerDueAdjustments, getPayableDues, getReceivableDues, } from "../controllers/DueController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
// Due adjustment routes
router.post("/adjust", protect, createDueAdjustment);
router.get("/adjustments", protect, getDueAdjustments);
router.get("/customer/:customerId/adjustments", protect, getCustomerDueAdjustments);
// New split dues endpoints
router.get("/payable", protect, getPayableDues);
router.get("/receivable", protect, getReceivableDues);
export default router;
