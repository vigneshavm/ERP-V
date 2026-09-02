import { Router } from "express";
import { container } from "tsyringe";
import { SalesController } from "../controllers/SalesController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { requirePermission } from "../../../middlewares/rbacMiddleware.js";

const router = Router();
const salesController = container.resolve(SalesController);

import { updateFulfillmentStatus } from "../controllers/FulfillmentController.js";

router.get("/summary", protect, salesController.getSalesInvoiceSummary);
router.post("/", protect, salesController.createSalesInvoice); // Added create route
router.get("/invoices", protect, salesController.getAllSalesInvoices);
router.get("/invoice/:id", protect, salesController.getSalesInvoiceById);
router.put("/invoice/:id/mark-paid", protect, salesController.markSalesInvoiceAsPaid);
router.patch("/invoice/:invoiceId/fulfillment", protect, updateFulfillmentStatus);
router.delete(
    "/invoice/:id",
    protect,
    requirePermission("delete:invoice"),
    salesController.deleteSalesInvoice
);

export default router;
