import { Router } from "express";
import expenseController from "../controllers/ExpenseController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { cacheMiddleware } from "../../../config/cache.js";
import { requirePermission } from "../../../middlewares/rbacMiddleware.js";

const router = Router();

router.get("/", protect, cacheMiddleware(300), expenseController.getAllExpenses);
router.get("/summary", protect, expenseController.getExpenseSummary);
router.post("/", protect, expenseController.createExpense);
router.get("/:id", protect, cacheMiddleware(300), expenseController.getExpenseById);
router.post("/:id/approve", protect, requirePermission("approve:expense"), expenseController.approveExpense);
router.put("/:id", protect, expenseController.updateExpense);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:expense"),
    expenseController.deleteExpense
);

export default router;
