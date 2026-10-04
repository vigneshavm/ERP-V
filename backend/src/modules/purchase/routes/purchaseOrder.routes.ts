import { Router } from "express";
import { container } from "tsyringe";
import { PurchaseController } from "../controllers/PurchaseController.js";
import { getSupplierLedger } from "../controllers/SupplierLedgerController.js";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import {
  createSqlPurchaseOrder,
  listSqlPurchaseOrders,
  getSqlPurchaseOrder,
  updateSqlPurchaseOrderStatus,
  deleteSqlPurchaseOrder,
  updateSqlPurchaseOrderReceipt,
} from "../../../integrations/textilesoft/sqlPurchaseOrder.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { SqlWriteError } from "../../../integrations/textilesoft/sqlWrite.js";

const router = Router();

/**
 * Textilesoft (SQL) POs: changing status (incl. cancelling) and deleting are for owners / managers, as
 * deleting a purchase entry is. Creating a PO and recording receipts stay open to staff.
 */
const PO_MANAGERS = ["owner", "co-owner", "manager"];
type Mw = (req: any, res: any, next: (err?: unknown) => void) => void;
const managersThen =
  (handler: Mw): Mw =>
  (req, res, next) =>
    authorize(...PO_MANAGERS)(req, res, (err?: unknown) =>
      err ? next(err) : handler(req, res, next),
    );
const purchaseController = container.resolve(PurchaseController);
router.use(protect);

router.post(
  "/",
  sql(async (r, out) =>
    out
      .status(201)
      .json({
        success: true,
        data: await createSqlPurchaseOrder(r.body ?? {}),
      }),
  ),
);
router.get(
  "/",
  sql(async (r, out) =>
    out.json({
      success: true,
      data: await listSqlPurchaseOrders({
        search:
          typeof r.query.search === "string" ? r.query.search : undefined,
        from: typeof r.query.from === "string" ? r.query.from : undefined,
        to: typeof r.query.to === "string" ? r.query.to : undefined,
        supplier:
          typeof r.query.supplier === "string" ? r.query.supplier : undefined,
      }),
    }),
  ),
);
router.get("/stats/supplier-totals", purchaseController.getSupplierTotals);
router.get("/suppliers/:id/ledger", getSupplierLedger);
router.get("/history/item/:itemId", purchaseController.getPurchaseHistory);
router.get("/:id", (req, res, next) => {
  // Pre-cutover Mongo PO ids (no "sql:po:" prefix) stay readable for historical lookups.
  if (!String(req.params.id).startsWith("sql:po:"))
    return purchaseController.getPurchaseById(req, res);
  return sql(async (r, out) =>
    out.json({
      success: true,
      data: await getSqlPurchaseOrder(String(r.params.id)),
    }),
  )(req, res, next);
});
router.patch(
  "/:id/status",
  managersThen(
    sql(async (r, out) =>
      out.json({
        success: true,
        // No default: a missing / unknown status is refused, never turned into ACTIVE.
        data: await updateSqlPurchaseOrderStatus(String(r.params.id), r.body?.status),
      }),
    ),
  ),
);
router.put(
  "/:id",
  managersThen(
    sql(async (r, out) => {
      // Only a status change is supported for Textilesoft POs. A full edit (lines, supplier ...) used to
      // be dropped silently while the PO was set ACTIVE -- refuse it instead of losing the changes.
      const keys = Object.keys(r.body ?? {});
      if (keys.length !== 1 || keys[0] !== "status")
        throw new SqlWriteError(
          "Editing a Textilesoft purchase order isn't supported here yet. Cancel it and create a new one.",
          400,
          "PO_EDIT_NOT_SUPPORTED",
        );
      out.json({
        success: true,
        data: await updateSqlPurchaseOrderStatus(String(r.params.id), r.body.status),
      });
    }),
  ),
);
router.delete(
  "/:id",
  managersThen(
    sql(async (r, out) => {
      await deleteSqlPurchaseOrder(String(r.params.id));
      out.json({ success: true });
    }),
  ),
);
router.patch("/:id/receipt/:lineNo", (req, res, next) => {
  if (String(req.params.id).startsWith("sql:po:"))
    return sql(async (r, out) =>
      out.json({
        success: true,
        data: await updateSqlPurchaseOrderReceipt(
          String(r.params.id),
          String(r.params.lineNo),
          r.body ?? {},
        ),
      }),
    )(req, res, next);
  res
    .status(404)
    .json({
      message:
        "SQL PO receipt route is only available for Textilesoft SQL mode.",
    });
});

export default router;
