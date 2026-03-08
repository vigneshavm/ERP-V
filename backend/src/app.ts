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

// Routes
// import healthRoutes from "./routes/healthRoutes.js";
// import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import expenseRoutes from "./routes/expenseRoutes.js";
// import posRoutes from "./routes/posRoutes.js";
// import expenseCategoryRoutes from "./routes/expenseCategoryRoutes.js";
// import recurringExpenseRoutes from "./routes/recurringExpenseRoutes.js";
// import expenseReportRoutes from "./routes/expenseReportRoutes.js";
// import returnRoutes from "./routes/returnRoutes.js";
// import estimateRoutes from "./routes/estimateRoutes.js";
// import reportRoutes from "./routes/reportRoutes.js";
// import refreshTokenRoutes from "./routes/refreshTokenRoutes.js";
// import businessRoutes from "./routes/businessRoutes.js";
// import shopRoutes from "./routes/shopRoutes.js";
// import loyaltyRoutes from "./routes/loyaltyRoutes.js"; // Moved to modules
// import employeeRoutes from "./routes/employeeRoutes.js"; // Moved to modules
// import purchaseRoutes from "./routes/purchaseRoutes.js"; // Moved to modules


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

// =======================
// Routes
// =======================
// app.use("/api/health", healthRoutes); // Handled by coreRoutes

// Root Route
app.get("/", (_req, res) => {
    res.send("🚀 SmartERPAI Backend is running (TypeScript)");
});

// =======================
// Routes Integration
// =======================

// CORE Module (Auth, User, Business, Health, etc.)
import coreRoutes from "./modules/core/routes/core.routes.js";
app.use("/api", coreRoutes);

import roleRoutes from "./modules/core/routes/roleRoutes.js";
app.use("/api/roles", roleRoutes);

import syncRoutes from "./modules/core/routes/syncRoutes.js";
app.use("/api/sync", syncRoutes);

import feedbackRoutes from "./modules/core/routes/feedbackRoutes.js";
app.use("/api/feedback", feedbackRoutes);

import notificationRoutes from "./modules/core/routes/notificationRoutes.js";
app.use("/api/notifications", notificationRoutes);

import auditLogRoutes from "./modules/core/routes/auditLogRoutes.js";
app.use("/api/audit-logs", auditLogRoutes);

// INVENTORY Module
import inventoryRoutes from "./modules/inventory/routes/inventory.routes.js";
app.use("/api/inventory", inventoryRoutes);

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

// PURCHASE Module
import purchaseModuleRoutes from "./modules/purchase/routes/purchase.routes.js";
import purchasePaymentRoutes from "./modules/purchase/routes/purchasePaymentRoutes.js";
app.use("/api/purchases", purchaseModuleRoutes);
app.use("/api/purchase-payments", purchasePaymentRoutes);
app.use("/api/purchase-returns", purchaseModuleRoutes);

// FINANCE Module
import financeRoutes from "./modules/finance/routes/finance.routes.js";
app.use("/api", financeRoutes); // Bills, Cashbank, Due, Loyalty

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

// AI AGENT Module (Extraction, Audit, Communication)
import agentRoutes from "./modules/agents/routes/agentRoutes.js";
app.use("/api/v1/agents", agentRoutes);


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
