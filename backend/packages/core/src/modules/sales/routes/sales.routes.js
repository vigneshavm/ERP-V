import { Router } from "express";
import { container } from "tsyringe";
import { SalesController } from "../controllers/SalesController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { requirePermission } from '@smarterp/shared/middlewares/rbacMiddleware.js';
const router = Router();
const salesController = container.resolve(SalesController);
router.get("/summary", protect, salesController.getSalesInvoiceSummary);
router.post("/", protect, salesController.createSalesInvoice);
router.get("/", protect, salesController.getAllSalesInvoices);
router.get("/:id", protect, salesController.getSalesInvoiceById);
router.patch("/:id", protect, salesController.updateSalesInvoice);
// PATCH /:id/status handles all status transitions including mark-as-paid.
// Clients send: { status: "paid" }
// PUT /:id/mark-paid is removed — PUT embeds a verb and is not idempotent here.
router.patch("/:id/status", protect, salesController.updateInvoiceStatus);
router.delete("/:id", protect, requirePermission("delete:invoice"), salesController.deleteSalesInvoice);
export default router;
