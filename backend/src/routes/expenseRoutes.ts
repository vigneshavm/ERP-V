import { Router } from "express";
import expenseController from "../controllers/ExpenseController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/rbacMiddleware.js";

const router = Router();

router.get("/", protect, expenseController.getAllExpenses);
router.post("/", protect, expenseController.createExpense);
router.get("/:id", protect, expenseController.getExpenseById);
router.put("/:id", protect, expenseController.updateExpense);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:expense"),
    expenseController.deleteExpense
);

export default router;
