import { Router } from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { SqlWriteError } from "../../../integrations/textilesoft/sqlWrite.js";
import { sqlSupplierList } from "../../../integrations/textilesoft/sqlSuppliers.js";
import {
  sqlPurchaseList,
  sqlPurchaseById,
  isSqlId,
} from "../../../integrations/textilesoft/sqlSales.js";

/**
 * Read-only purchase list from Textilesoft's GRNs (dbo.purgrnentry header + dbo.purentrydetails lines). No MongoDB.
 * Mounted at /api/purchases:
 *   GET /        newest first
 *   GET /:id     one GRN with its lines (id is the "sql:<grn_no>" _id from the list)
 * Alias fields (id, po_number, vendor_name, po_date, total_amount) are added for the purchase hooks.
 */
const router = Router();
router.use(protect);

const unavailable = (_req: import("express").Request, res: import("express").Response) => {
  res.status(503).json({
    success: false,
    error: {
      code: "SQL_PURCHASE_WORKFLOW_UNAVAILABLE",
      message: "This purchase workflow has no verified SQL-only route in the current application.",
    },
  });
};

const withAliases = (d: Record<string, any>) => ({
  ...d,
  id: d._id,
  po_number: d.purchaseNumber,
  vendor_name: d.vendorId?.name,
  po_date: d.date,
  total_amount: d.totalAmount,
  created_at: d.createdAt,
});

// Dashboard supplier card: each supplier with GRN totals and what is still owed (dbo.supplierdetail + dbo.purgrnentry).
router.get("/suppliers/analytics", sql(async (_r, res) => res.json({ success: true, data: await sqlSupplierList() })));

router.get(
  "/",
  sql(async (req, res) => {
    const limit = Number(req.query.limit) || undefined;
    res.json((await sqlPurchaseList(limit)).map(withAliases));
  }),
);

router.all([
  "/orders",
  "/grn-transfers",
  "/bills",
  "/history",
  "/debit-notes",
  "/payments",
  "/payment-out",
  "/payables",
  "/upload",
  "/rate-revisions",
  "/cheques-vault",
  "/inflow-outflow",
  "/ageing-analysis",
], unavailable);

router.get(
  "/:id",
  sql(async (req, res) => {
    const id = String(req.params.id);
    if (!isSqlId(id)) throw new SqlWriteError("Purchase not found.", 404);
    const doc = await sqlPurchaseById(id);
    if (!doc) throw new SqlWriteError("Purchase not found.", 404);
    res.json(withAliases(doc));
  }),
);
router.all("*", unavailable);

export default router;
