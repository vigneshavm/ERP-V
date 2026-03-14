import express from "express";
import {
  getSalesReport,
  getStockReport,
  getCustomerReport,
  getDashboardStats
} from "../controllers/ReportController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { cacheMiddleware } from "../../../config/cache.js";

const router = express.Router();

router.get("/sales", protect, cacheMiddleware(600), getSalesReport);
router.get("/stock", protect, cacheMiddleware(600), getStockReport);
router.get("/customers", protect, cacheMiddleware(600), getCustomerReport);
router.get("/dashboard-stats", protect, cacheMiddleware(600), getDashboardStats);

export default router;
