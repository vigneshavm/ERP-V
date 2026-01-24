import express from "express";
import { getExpenseReport } from "../controllers/expenseReportController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getExpenseReport);

export default router;
