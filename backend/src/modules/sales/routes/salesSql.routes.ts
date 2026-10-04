import { Router } from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { SqlWriteError } from "../../../integrations/textilesoft/sqlWrite.js";
import {
  sqlInvoicePage,
  sqlInvoiceById,
  sqlInvoiceTotals,
  isSqlId,
} from "../../../integrations/textilesoft/sqlSales.js";

/**
 * Read-only sales history from Textilesoft's own bills (dbo.sales2 header + dbo.salsntry lines). No MongoDB.
 * Mounted at /api/sales-invoice:
 *   GET /invoices?search=&status=&customerId=&page=&pageSize=   paginated, newest first, cancelled bills excluded
 *   GET /invoice/:id               one bill with its lines (id is the "sql:<sysidandbill>" _id from the list)
 *   GET /summary                   bill count, total sales, total paid
 * Extra alias fields (id, date, total, ...) are added so the POS/sales-history hooks, which read those names,
 * work with the SQL documents; the original fields are unchanged.
 */
const router = Router();
router.use(protect);

const withAliases = (d: Record<string, any>) => ({
  ...d,
  id: d._id,
  date: d.createdAt,
  total: d.totalAmount,
  customer_id: d.customer?._id,
  payment_method: d.paymentMethod,
  payment_status: String(d.paymentStatus ?? "").toUpperCase(),
  status: "COMPLETED",
});

router.get(
  "/invoices",
  sql(async (req, res) => {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim().slice(0, 60) : "";
    const pageValue = Number(req.query.page);
    const pageSizeValue = Number(req.query.pageSize);
    const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
    const pageSize = Number.isFinite(pageSizeValue) && pageSizeValue > 0 ? Math.floor(pageSizeValue) : 10;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const customerId = typeof req.query.customerId === "string" ? req.query.customerId.trim() : undefined;
    const result = await sqlInvoicePage({ search: search || undefined, status, customerId, page, pageSize });
    res.json({
      success: true,
      data: result.data.map(withAliases),
      pagination: result.pagination,
    });
  }),
);

router.get(
  "/invoice/:id",
  sql(async (req, res) => {
    const id = String(req.params.id);
    if (!isSqlId(id)) throw new SqlWriteError("Invoice not found.", 404);
    const doc = await sqlInvoiceById(id);
    if (!doc) throw new SqlWriteError("Invoice not found.", 404);
    res.json({ success: true, data: withAliases(doc) });
  }),
);

router.get(
  "/summary",
  sql(async (_req, res) => {
    res.json({ success: true, data: await sqlInvoiceTotals() });
  }),
);

export default router;
