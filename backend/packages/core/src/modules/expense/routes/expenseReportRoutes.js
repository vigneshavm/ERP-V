import express from "express";
import { getExpenseReport, getStats } from "../controllers/ExpenseReportController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { cacheMiddleware } from '@smarterp/shared/config/cache.js';
const router = express.Router();
router.get("/", protect, cacheMiddleware(600), getExpenseReport);
router.get("/stats", protect, cacheMiddleware(600), getStats);
export default router;
