import express from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import { AppError } from "../../../utils/AppError.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { listSqlExpenses, findSqlExpense } from "../../../integrations/textilesoft/sqlExpenses.js";

/** Expenses = Textilesoft's own dbo.expenseentry, read only. Newest first (capped); no MongoDB. */
const router = express.Router();
router.use(protect);

const LIMIT = 2000;
router.get("/", sql(async (_r, out) => out.json((await listSqlExpenses()).slice(0, LIMIT))));
router.get("/:id", sql(async (r, out) => {
  const found = await findSqlExpense(String(r.params.id));
  if (!found) throw new AppError("Expense not found", 404);
  out.json(found);
}));

export default router;
