import { Router } from "express";
import { container } from "tsyringe";
import { SalesController } from "../controllers/SalesController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { requirePermission } from '@smarterp/shared/middlewares/rbacMiddleware.js';

const router = Router();
const salesController = container.resolve(SalesController);

router.get("/summary", protect, salesController.getSalesInvoiceSummary);
router.post("/", protect, salesController.createSalesInvoice); // Added create route
router.get("/invoices", protect, salesController.getAllSalesInvoices);
router.get("/invoice/:id", protect, salesController.getSalesInvoiceById);
router.patch("/invoice/:id/status", protect, salesController.updateInvoiceStatus);
router.put("/invoice/:id/mark-paid", protect, salesController.markSalesInvoiceAsPaid);
router.delete(
    "/invoice/:id",
    protect,
    requirePermission("delete:invoice"),
    salesController.deleteSalesInvoice
);

export default router;
