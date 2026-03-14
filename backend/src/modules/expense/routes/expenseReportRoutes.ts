import express from "express";
import { getExpenseReport } from "../controllers/ExpenseReportController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { cacheMiddleware } from "../../../config/cache.js";

const router = express.Router();

router.get("/", protect, cacheMiddleware(600), getExpenseReport);

export default router;
