import express from "express";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import { AppError } from "../../../utils/AppError.js";
import {
  listSqlPurchaseReturns,
  getSqlPurchaseReturn,
} from "../../../integrations/textilesoft/sqlPurchaseReturn.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";

/**
 * Purchase returns on the shop (Textilesoft) database only - no MongoDB.
 * Ids look like "sql:pr:<n>"; anything else is not a return of this database.
 */
const router = express.Router();
router.use(protect);

const sqlId = (id: unknown): string => {
  const value = String(id ?? "");
  if (!value.startsWith("sql:pr:")) throw new AppError("Purchase return not found", 404);
  return value;
};

router.post("/", (_req, res) => res.status(503).json({
  success: false,
  error: {
    code: "SQL_PURCHASE_RETURN_UNAVAILABLE",
    message: "Creating a purchase return is paused until all existing return lines and supplier ledger effects are reconciled.",
  },
}));
router.get("/", sql(async (_r, out) => out.json({ success: true, data: await listSqlPurchaseReturns() })));
router.get("/:id", sql(async (r, out) => out.json({ success: true, data: await getSqlPurchaseReturn(sqlId(r.params.id)) })));
router.delete(
  "/:id",
  authorize("owner", "co-owner", "manager"),
  (_req, res) => res.status(503).json({
    success: false,
    error: {
      code: "SQL_PURCHASE_RETURN_UNAVAILABLE",
      message: "Deleting a purchase return is disabled until stock and supplier-ledger reversal behavior is verified.",
    },
  }),
);

export default router;
