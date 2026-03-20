import express from "express";
import {
    createSalesOrder,
    updateSalesOrder,
    confirmSalesOrder,
    getSalesOrderById,
    listSalesOrders,
    cancelSalesOrder,
    updateOrderStatus,
    convertToDeliveryChallan,
    convertToInvoice,
} from "../controllers/SalesOrderController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { requirePermission } from '@smarterp/shared/middlewares/rbacMiddleware.js';
import { auditUpdate } from '@smarterp/shared/middlewares/auditMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Sales Order CRUD
router.post("/", createSalesOrder);
router.get("/", listSalesOrders);
router.get("/:id", getSalesOrderById);
// PUT /:id removed — PATCH /:id handles partial updates (REST-compliant).
router.patch("/:id", auditUpdate("SalesOrder", "UPDATE_SALES_ORDER"), updateSalesOrder);
router.patch("/:id/status", updateOrderStatus);

// Sales Order Actions
// POST /:id/confirm deprecated — use PATCH /:id/status { status: "confirmed" }
router.post(
    "/:id/cancel",
    requirePermission("delete:salesorder"),
    cancelSalesOrder
);

// Conversion Routes
router.post("/:id/delivery-challans", convertToDeliveryChallan); // creates DC from order
router.post("/:id/invoices", convertToInvoice); // creates invoice from order

export default router;
