/** Purchase / GRN entry in Textilesoft's tables -- see integrations/textilesoft/sqlPurchase.ts. */
import { Router } from "express";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { SqlWriteError } from "../../../integrations/textilesoft/sqlWrite.js";
import {
  purchaseOptions,
  listPurchases,
  getPurchase,
} from "../../../integrations/textilesoft/sqlPurchase.js";

const q = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

const router = Router();
router.use(protect);

router.get(
  "/options",
  sql(async (_req, res) => {
    res.json({ success: true, data: await purchaseOptions() });
  }),
);
router.get(
  "/",
  sql(async (req, res) => {
    const r = await listPurchases({
      from: q(req.query.from),
      to: q(req.query.to),
      supplier: q(req.query.supplier),
      company: q(req.query.company),
      q: q(req.query.q),
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });
    res.json({ success: true, ...r });
  }),
);
router.get(
  "/:grnNo",
  sql(async (req, res) => {
    const p = await getPurchase(String(req.params.grnNo));
    if (!p) throw new SqlWriteError("Purchase not found.", 404);
    res.json({ success: true, data: p });
  }),
);
router.post(
  "/",
  (_req, res) => res.status(503).json({
    success: false,
    error: {
      code: "SQL_PURCHASE_ENTRY_UNAVAILABLE",
      message: "Saving a GRN is paused until purchase stock and supplier references are reconciled against current SQL data.",
    },
  }),
);
router.delete(
  "/:grnNo",
  authorize("owner", "co-owner", "manager"),
  (_req, res) => res.status(503).json({
    success: false,
    error: {
      code: "SQL_PURCHASE_ENTRY_UNAVAILABLE",
      message: "Deleting a GRN is disabled until its stock and downstream reversal effects are verified.",
    },
  }),
);

export default router;
