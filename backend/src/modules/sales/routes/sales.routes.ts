import { Router } from "express";
import { container } from "tsyringe";
import { SalesController } from "../controllers/SalesController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { requirePermission } from "../../../middlewares/rbacMiddleware.js";

const router = Router();
const salesController = container.resolve(SalesController);

import { updateFulfillmentStatus } from "../controllers/FulfillmentController.js";
import { listWholesaleSales, getWholesaleSalesReport, getWholesaleStockReport } from "../controllers/WholesaleReportController.js";

router.get("/summary", protect, salesController.getSalesInvoiceSummary);
router.post("/", protect, salesController.createSalesInvoice); // Added create route
router.get("/invoices", protect, salesController.getAllSalesInvoices);
// Wholesale/Retail (WR) Billing -- read-only views over the same Invoice collection, filtered
// to saleChannel: 'WHOLESALE'. Placed before "/invoice/:id" only matters if a param route could
// shadow these; these are distinct static paths so order isn't load-bearing, but grouped here
// for discoverability. See WholesaleReportController.ts for the rationale.
router.get("/wholesale/invoices", protect, listWholesaleSales);
router.get("/wholesale/reports/sales", protect, getWholesaleSalesReport);
router.get("/wholesale/reports/stock", protect, getWholesaleStockReport);
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
