import { Router } from "express";
import expenseController from "../controllers/ExpenseController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { cacheMiddleware } from '@smarterp/shared/config/cache.js';
import { requirePermission } from '@smarterp/shared/middlewares/rbacMiddleware.js';

const router = Router();

router.get("/", protect, cacheMiddleware(300), expenseController.getAllExpenses);
router.post("/", protect, expenseController.createExpense);

// Named collection-level reads — /summary and /analytics must stay above /:id
router.get("/summary", protect, expenseController.getExpenseSummary);
// TODO: /analytics and /summary currently share a handler — split into distinct controllers
router.get("/analytics", protect, expenseController.getExpenseSummary);

router.get("/:id", protect, cacheMiddleware(300), expenseController.getExpenseById);

// PATCH /:id for partial updates; PUT /:id removed (was pointing to the same handler — ambiguous semantics)
router.patch("/:id", protect, expenseController.updateExpense);

router.post("/:id/approve", protect, requirePermission("approve:expense"), expenseController.approveExpense);
router.delete("/:id", protect, expenseController.deleteExpense);

export default router;
