import { Router } from "express";
import supplierController from "../controllers/SupplierController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { requirePermission } from '@smarterp/shared/middlewares/rbacMiddleware.js';

// Import analytics handlers from the purchase module's SupplierController.
// These live in purchase/controllers but the routes belong under /crm/suppliers.
import {
    getSupplierAnalytics,
    getSupplierReports,
    getAgeingAnalysis,
    bulkUpdateOpeningBalance,
    getVendorInflowOutflow,
    getSupplierLedger,
} from '../../purchase/controllers/SupplierController.js';

const router = Router();

// ── Analytics & reporting (canonical home: /crm/suppliers) ──────────────────
router.get("/analytics", protect, getSupplierAnalytics);
router.get("/ageing-analysis", protect, getAgeingAnalysis);
router.get("/reports", protect, getSupplierReports);
router.get("/inflow-outflow", protect, getVendorInflowOutflow);
router.post("/bulk-opening-balance", protect, bulkUpdateOpeningBalance);
router.get("/statements", protect, (_req, res) => {
    res.status(200).json({ success: true, message: "Statements endpoint ready" });
});

// ── Sub-resource: ledger per supplier ───────────────────────────────────────
router.get("/:id/ledger", protect, getSupplierLedger);

// ── CRUD ─────────────────────────────────────────────────────────────────────
router.post("/", protect, supplierController.addSupplier);
router.get("/", protect, supplierController.getAllSuppliers);
router.get("/:id", protect, supplierController.getSupplierById);
router.put("/:id", protect, supplierController.updateSupplier);
router.delete("/:id", protect, requirePermission("delete:supplier"), supplierController.deleteSupplier);

export default router;
