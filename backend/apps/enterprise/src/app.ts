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
import { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from "@smarterp/shared/config/sentry.js";
import { corsOptions } from "@smarterp/shared/config/cors.config.js";
import { stream } from "@smarterp/shared/config/logger.js";
import requestId from "@smarterp/shared/middlewares/requestId.js";
import requestTimeout from "@smarterp/shared/middlewares/timeout.js";
import errorHandler from "@smarterp/shared/middlewares/errorHandler.js";
import tenantResolver from "@smarterp/shared/middlewares/tenantResolver.js";
import swaggerUi from 'swagger-ui-express';
import { getSwaggerSpec } from '@smarterp/shared/config/swagger.js';

// Load environment variables from current directory or root
dotenv.config();
dotenv.config({ path: "../../.env" });

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
const swaggerSpec = getSwaggerSpec({
    title: 'SmartERPAI Enterprise API',
    port: process.env.PORT || 5000,
    modules: ['core', 'crm', 'finance', 'hr', 'inventory', 'marketing', 'purchase', 'sales', 'agents']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Route
app.get("/", (_req, res) => {
    res.send("🚀 SmartERPAI Enterprise API is running");
});

// Health Check
import { healthCheck } from "@smarterp/core/modules/core/controllers/HealthController.js";
app.get("/health", healthCheck);

// =======================
// Routes Integration (Enterprise)
// =======================

// =======================
// MOCK DATA ROUTES (Mock-First Strategy - v1)
// =======================
// Mock / stub routes — development only. Never expose in production.
if (process.env.NODE_ENV !== 'production') {
    const MockController = await import("./controllers/MockController.js");
    app.get("/api/v1/inventory/stock-reports",     MockController.getMockStockReport);
    app.get("/api/v1/enterprise/dashboards/stats", MockController.getMockDashboardStats);
    app.get("/api/v1/crm/suppliers/analytics",     MockController.getMockSuppliers);
    app.get("/api/business/profile",               MockController.getMockBusinessProfile);
    app.get("/api/v1/business/profile",            MockController.getMockBusinessProfile);
    app.get("/api/employees",    MockController.getMockEmployees);
    app.get("/api/v1/employees", MockController.getMockEmployees);
    app.get("/api/branches",    (_req, res) => res.json({ success: true, data: [] }));
    app.get("/api/v1/branches", (_req, res) => res.json({ success: true, data: [] }));
}


// CORE Module (Auth, User, Business, Health, etc.)
import coreRoutes from "@smarterp/core/modules/core/routes/core.routes.js";
app.use("/api/v1", coreRoutes);
app.use("/api", coreRoutes); // Alias for compatibility with some MFEs

import roleRoutes from "@smarterp/core/modules/core/routes/roleRoutes.js";
app.use("/api/v1/core/roles", roleRoutes);

import syncRoutes from "@smarterp/core/modules/core/routes/syncRoutes.js";
app.use("/api/v1/core/sync", syncRoutes);

import feedbackRoutes from "@smarterp/core/modules/core/routes/feedbackRoutes.js";
app.use("/api/v1/core/feedback", feedbackRoutes);

import notificationRoutes from "@smarterp/core/modules/core/routes/notificationRoutes.js";
app.use("/api/v1/core/notifications", notificationRoutes);

import auditLogRoutes from "@smarterp/core/modules/core/routes/auditLogRoutes.js";
app.use("/api/v1/core/audit-logs", auditLogRoutes);

// INVENTORY Module
import inventoryRoutes from "@smarterp/core/modules/inventory/routes/inventory.routes.js";
app.use("/api/v1/inventory", inventoryRoutes);
// Unversioned /api/inventory alias removed — all clients must use /api/v1/inventory

// SALES Module
import salesRoutes from "@smarterp/core/modules/sales/routes/sales.routes.js";
app.use("/api/v1/sales/invoices", salesRoutes);
import paymentInRoutes from "@smarterp/core/modules/sales/routes/paymentIn.routes.js";
app.use("/api/v1/sales/payments-in", paymentInRoutes);
import salesOrderRoutes from "@smarterp/core/modules/sales/routes/salesOrder.routes.js";
app.use("/api/v1/sales/orders", salesOrderRoutes);
import deliveryChallanRoutes from "@smarterp/core/modules/sales/routes/deliveryChallan.routes.js";
app.use("/api/v1/sales/delivery-challans", deliveryChallanRoutes);
import posRoutes from "@smarterp/core/modules/sales/routes/pos.routes.js";
app.use("/api/v1/sales/pos", posRoutes);

// PURCHASE Module
import purchaseModuleRoutes from "@smarterp/core/modules/purchase/routes/purchase.routes.js";
import purchasePaymentRoutes from "@smarterp/core/modules/purchase/routes/purchasePaymentRoutes.js";
app.use("/api/v1/purchases", purchaseModuleRoutes);
app.use("/api/v1/purchases/payments", purchasePaymentRoutes);
app.use("/api/v1/purchases/returns", purchaseModuleRoutes);

// FINANCE Module
import financeRoutes from "@smarterp/core/modules/finance/routes/finance.routes.js";
app.use("/api/v1/finance", financeRoutes); // Bills, Cashbank, Due, Loyalty

// import financeAIRoutes from "@smarterp/core/modules/finance-ai/routes/finance-ai.routes.js";
// app.use("/api/v1/finance", financeAIRoutes); // Document Extraction, AI Prediction, AI Chat

// CRM Module
import crmRoutes from "@smarterp/core/modules/crm/routes/crm.routes.js";
app.use("/api/v1/crm", crmRoutes); // Customers, Suppliers, WhatsApp

// HR Module
import hrRoutes from "@smarterp/core/modules/hr/routes/hr.routes.js";
app.use("/api/v1/hr", hrRoutes); // Employees

// MARKETING Module
import marketingRoutes from "@smarterp/core/modules/marketing/routes/meta.routes.js";
app.use("/api/v1/marketing/meta", marketingRoutes);

// AI AGENT Module (Extraction, Audit, Communication)
import agentRoutes from "@smarterp/core/modules/agents/routes/agentRoutes.js";
app.use("/api/v1/agents", agentRoutes);


// MISC / LEGACY (To be modularized)
import returnRoutes from "@smarterp/core/modules/sales/routes/return.routes.js";
app.use("/api/v1/sales/returns", returnRoutes);
import estimateRoutes from "@smarterp/core/modules/sales/routes/estimate.routes.js";
app.use("/api/v1/sales/estimates", estimateRoutes);


// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
