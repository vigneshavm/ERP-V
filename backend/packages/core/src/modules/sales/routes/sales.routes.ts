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
router.patch("/:id/status", protect, salesController.updateInvoiceStatus);
router.put("/:id/mark-paid", protect, salesController.markSalesInvoiceAsPaid);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:invoice"),
    salesController.deleteSalesInvoice
);

export default router;
