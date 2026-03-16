import express from "express";
import { getAllRecurringExpenses, createRecurringExpense, updateRecurringExpense, deleteRecurringExpense, } from "../controllers/RecurringExpenseController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
router.get("/", protect, getAllRecurringExpenses);
router.post("/", protect, createRecurringExpense);
router.put("/:id", protect, updateRecurringExpense);
router.delete("/:id", protect, deleteRecurringExpense);
export default router;
