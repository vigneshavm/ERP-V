import "reflect-metadata"; // Required for tsyringe
import express, { Express } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import cookieParser from "cookie-parser";

// Configs & Utils
import { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from "./config/sentry.js";
import { corsOptions } from "./config/cors.config.js";
import { stream } from "./config/logger.js";
import requestId from "./middlewares/requestId.js";
import requestTimeout from "./middlewares/timeout.js";
import errorHandler from "./middlewares/errorHandler.js";
import tenantResolver from "./middlewares/tenantResolver.js";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

dotenv.config();

const app: Express = express();

// =======================
// Trust Proxy
// =======================
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// =======================
// Sentry (must be first)
// =======================
initSentry(app);
if (process.env.SENTRY_DSN) {
    app.use(sentryRequestHandler());
    app.use(sentryTracingHandler());
}

// =======================
// Security Middleware
// =======================
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
    })
);

app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req: _req, key }) => {
        console.warn(`Sanitized key: ${key} in request`);
    },
}));

app.use(compression());

// =======================
// Basic Middleware
// =======================
app.use(requestId);
app.use(requestTimeout(30000));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// =======================
// CORS Configuration
// =======================
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev", { stream }));
} else {
    app.use(morgan("combined", { stream }));
}

// =======================
// Tenant Resolution
// =======================
app.use(tenantResolver);

// =======================
// Swagger Documentation
// =======================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Route
app.get("/", (_req, res) => {
    res.send("🚀 SmartERPAI Backend is running (TypeScript)");
});

// =======================
// Routes Integration
// =======================

// STORE Module
import storeRoutes from "./modules/store/routes/store.routes.js";
app.use("/api/stores", storeRoutes);

// CORE Module (Auth, User, Business, Health, etc.)
import coreRoutes from "./modules/core/routes/core.routes.js";
app.use("/api", coreRoutes);

import roleRoutes from "./modules/core/routes/roleRoutes.js";
app.use("/api/roles", roleRoutes);

import syncRoutes from "./modules/core/routes/syncRoutes.js";
app.use("/api/sync", syncRoutes);

import sectorCategoryRoutes from "./modules/core/routes/sectorCategoryRoutes.js";
app.use("/api", sectorCategoryRoutes);

import feedbackRoutes from "./modules/core/routes/feedbackRoutes.js";
app.use("/api/feedback", feedbackRoutes);

import notificationRoutes from "./modules/core/routes/notificationRoutes.js";
app.use("/api/notifications", notificationRoutes);

import auditLogRoutes from "./modules/core/routes/auditLogRoutes.js";
app.use("/api/audit-logs", auditLogRoutes);

// Reports (dashboard-stats/stock/customers/sales) - was fully implemented but never mounted,
// so every Shop Owner Dashboard report call was silently 404ing.
import reportRoutes from "./modules/core/routes/reportRoutes.js";
app.use("/api/reports", reportRoutes);

// INVENTORY Module
import inventoryRoutes from "./modules/inventory/routes/inventory.routes.js";
app.use("/api/inventory", inventoryRoutes);
import stockTransferRoutes from "./modules/inventory/routes/stockTransferRoutes.js";
app.use("/api/stock-transfers", stockTransferRoutes);



// SALES Module
import salesRoutes from "./modules/sales/routes/sales.routes.js";
app.use("/api/sales-invoice", salesRoutes);
import paymentInRoutes from "./modules/sales/routes/paymentIn.routes.js";
app.use("/api/payment-in", paymentInRoutes);
import salesOrderRoutes from "./modules/sales/routes/salesOrder.routes.js";
app.use("/api/sales-orders", salesOrderRoutes);
import deliveryChallanRoutes from "./modules/sales/routes/deliveryChallan.routes.js";
app.use("/api/delivery-challan", deliveryChallanRoutes);
import posRoutes from "./modules/sales/routes/pos.routes.js";
app.use("/api/pos", posRoutes);
import commissionRoutes from "./modules/sales/routes/commissionRoutes.js";
app.use("/api/commission-rules", commissionRoutes);

// CRM & Analytics Module
import crmAnalyticsRoutes from "./modules/crm/routes/crmAnalyticsRoutes.js";
app.use("/api/crm", crmAnalyticsRoutes);

// PURCHASE Module
import purchaseModuleRoutes from "./modules/purchase/routes/purchase.routes.js";
import purchasePaymentRoutes from "./modules/purchase/routes/purchasePaymentRoutes.js";
import purchaseReturnRoutes from "./modules/purchase/routes/purchaseReturnRoutes.js";
import grnRoutes from "./modules/purchase/routes/grnRoutes.js";
import grnTransferRoutes from "./modules/purchase/routes/grnTransferRoutes.js";
app.use("/api/purchases", purchaseModuleRoutes);
app.use("/api/purchase-payments", purchasePaymentRoutes);
// Was previously mounting the WHOLE purchase.routes.ts aggregator here too, which put
// purchase.routes.ts's own `router.use('/', purchaseRoutes)` fallback in front of anything
// return-specific: GET /api/purchase-returns and GET /api/purchase-returns/:id were silently
// being served by PurchaseController's getAllPurchases/getPurchaseById (Purchase ORDERS, not
// returns) instead of PurchaseReturnController. Mount the actual return router directly.
app.use("/api/purchase-returns", purchaseReturnRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/grn-transfers", grnTransferRoutes);

// FINANCE Module
import financeRoutes from "./modules/finance/routes/finance.routes.js";
app.use("/api", financeRoutes); // Bills, Cashbank, Due, Loyalty
import emiPlanRoutes from "./modules/finance/routes/emiPlanRoutes.js";
app.use("/api/emi-plans", emiPlanRoutes);
import cardTerminalRoutes from "./modules/finance/routes/cardTerminalRoutes.js";
app.use("/api/card-terminals", cardTerminalRoutes);

// EXPENSE Module
import expenseModuleRoutes from "./modules/expense/routes/expense.routes.js";
app.use("/api", expenseModuleRoutes);

// SMS Tracker Module
import smsTrackerRoutes from "./modules/sms-tracker/routes/sms-tracker.routes.js";
app.use("/api/sms-tracker", smsTrackerRoutes);

// CRM Module
import crmRoutes from "./modules/crm/routes/crm.routes.js";
app.use("/api", crmRoutes); // Customers, Suppliers, WhatsApp

// HR Module
import hrRoutes from "./modules/hr/routes/hr.routes.js";
app.use("/api/hr", hrRoutes); // Employees

// MARKETING Module
import metaRoutes from "./modules/marketing/routes/meta.routes.js";
app.use("/api/marketing/meta", metaRoutes);

// COMBO OFFERS Module
import comboRoutes from "./modules/combo/routes/combo.routes.js";
app.use("/api/combo-offers", comboRoutes);

// MASTER DATA Module (generic simple-master lists: customer groups, employee structure,
// transaction/cash/payment/booking groups, GST type/group, textile product descriptors)
import masterDataRoutes from "./modules/masters/routes/masterData.routes.js";
app.use("/api/masters", masterDataRoutes);


// MISC / LEGACY (To be modularized)
import returnRoutes from "./modules/sales/routes/return.routes.js";
app.use("/api/returns", returnRoutes);
import estimateRoutes from "./modules/sales/routes/estimate.routes.js";
app.use("/api/estimates", estimateRoutes);


// ...

// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
