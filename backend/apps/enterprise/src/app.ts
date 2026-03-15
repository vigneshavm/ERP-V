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
import swaggerSpec from '@smarterp/shared/config/swagger.js';

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
    res.send("🚀 SmartERPAI Enterprise API is running");
});

// =======================
// Routes Integration (Enterprise)
// =======================

// CORE Module (Auth, User, Business, Health, etc.)
import coreRoutes from "@smarterp/core/modules/core/routes/core.routes.js";
app.use("/api", coreRoutes);

import roleRoutes from "@smarterp/core/modules/core/routes/roleRoutes.js";
app.use("/api/roles", roleRoutes);

import syncRoutes from "@smarterp/core/modules/core/routes/syncRoutes.js";
app.use("/api/sync", syncRoutes);

import feedbackRoutes from "@smarterp/core/modules/core/routes/feedbackRoutes.js";
app.use("/api/feedback", feedbackRoutes);

import notificationRoutes from "@smarterp/core/modules/core/routes/notificationRoutes.js";
app.use("/api/notifications", notificationRoutes);

import auditLogRoutes from "@smarterp/core/modules/core/routes/auditLogRoutes.js";
app.use("/api/audit-logs", auditLogRoutes);

// INVENTORY Module
import inventoryRoutes from "@smarterp/core/modules/inventory/routes/inventory.routes.js";
app.use("/api/inventory", inventoryRoutes);

// SALES Module
import salesRoutes from "@smarterp/core/modules/sales/routes/sales.routes.js";
app.use("/api/sales-invoice", salesRoutes);
import paymentInRoutes from "@smarterp/core/modules/sales/routes/paymentIn.routes.js";
app.use("/api/payment-in", paymentInRoutes);
import salesOrderRoutes from "@smarterp/core/modules/sales/routes/salesOrder.routes.js";
app.use("/api/sales-orders", salesOrderRoutes);
import deliveryChallanRoutes from "@smarterp/core/modules/sales/routes/deliveryChallan.routes.js";
app.use("/api/delivery-challan", deliveryChallanRoutes);
import posRoutes from "@smarterp/core/modules/sales/routes/pos.routes.js";
app.use("/api/pos", posRoutes);

// PURCHASE Module
import purchaseModuleRoutes from "@smarterp/core/modules/purchase/routes/purchase.routes.js";
import purchasePaymentRoutes from "@smarterp/core/modules/purchase/routes/purchasePaymentRoutes.js";
app.use("/api/purchases", purchaseModuleRoutes);
app.use("/api/purchase-payments", purchasePaymentRoutes);
app.use("/api/purchase-returns", purchaseModuleRoutes);

// FINANCE Module
import financeRoutes from "@smarterp/core/modules/finance/routes/finance.routes.js";
app.use("/api", financeRoutes); // Bills, Cashbank, Due, Loyalty

// CRM Module
import crmRoutes from "@smarterp/core/modules/crm/routes/crm.routes.js";
app.use("/api", crmRoutes); // Customers, Suppliers, WhatsApp

// HR Module
import hrRoutes from "@smarterp/core/modules/hr/routes/hr.routes.js";
app.use("/api/hr", hrRoutes); // Employees

// MARKETING Module
import marketingRoutes from "@smarterp/core/modules/marketing/routes/meta.routes.js";
app.use("/api/marketing/meta", marketingRoutes);

// AI AGENT Module (Extraction, Audit, Communication)
import agentRoutes from "@smarterp/core/modules/agents/routes/agentRoutes.js";
app.use("/api/v1/agents", agentRoutes);


// MISC / LEGACY (To be modularized)
import returnRoutes from "@smarterp/core/modules/sales/routes/return.routes.js";
app.use("/api/returns", returnRoutes);
import estimateRoutes from "@smarterp/core/modules/sales/routes/estimate.routes.js";
app.use("/api/estimates", estimateRoutes);


// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
