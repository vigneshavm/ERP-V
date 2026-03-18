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
    title: 'SmartERPAI Personal API',
    port: process.env.PERSONAL_PORT || 5001,
    modules: ['core', 'expense', 'sms-tracker']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Route
app.get("/", (_req, res) => {
    res.send("🚀 SmartERPAI Personal API is running");
});

// COMPATIBILITY ALIASES
import { container } from "tsyringe";
import { AuthController } from "@smarterp/core/modules/core/controllers/AuthController.js";
const authController = container.resolve(AuthController);
app.get("/api/v1/auth/me", protect, (req, res) => authController.getProfile(req, res));

// Health Check
import { healthCheck } from "@smarterp/core/modules/core/controllers/HealthController.js";
app.get("/health", healthCheck);

// =======================
// Routes Integration (Personal)
// =======================

// CORE Module (Auth, User, Business, Health, etc.)
import coreRoutes from "@smarterp/core/modules/core/routes/core.routes.js";
app.use("/api/v1/personal/core", coreRoutes);
app.use("/api/v1", coreRoutes); // Alias for shared adapter

import roleRoutes from "@smarterp/core/modules/core/routes/roleRoutes.js";
app.use("/api/v1/personal/roles", roleRoutes);

import syncRoutes from "@smarterp/core/modules/core/routes/syncRoutes.js";
app.use("/api/v1/personal/sync", syncRoutes);

import feedbackRoutes from "@smarterp/core/modules/core/routes/feedbackRoutes.js";
app.use("/api/v1/personal/feedback", feedbackRoutes);

import notificationRoutes from "@smarterp/core/modules/core/routes/notificationRoutes.js";
app.use("/api/v1/personal/notifications", notificationRoutes);

import auditLogRoutes from "@smarterp/core/modules/core/routes/auditLogRoutes.js";
app.use("/api/v1/personal/audit-logs", auditLogRoutes);

// EXPENSE Module
import expenseModuleRoutes from '@smarterp/core/modules/expense/routes/expense.routes.js';
app.use("/api/v1/personal/expenses", expenseModuleRoutes);
app.use("/api/v1", expenseModuleRoutes); // Alias for /v1/transactions, /v1/categories

// SMS Tracker Module
import smsTrackerRoutes from '@smarterp/core/modules/sms-tracker/routes/sms-tracker.routes.js';
app.use("/api/v1/personal/sms-trackers", smsTrackerRoutes);

// DASHBOARD Route
import { getDashboardData } from './controllers/DashboardController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
app.get("/api/v1/personal/dashboards", protect, getDashboardData);
app.get("/api/v1/personal/dashboard", protect, getDashboardData); // Compatibility
app.get("/api/v1/dashboard", protect, getDashboardData); // Shared adapter

// FINANCE Module
import financeRoutes from '@smarterp/core/modules/finance/routes/finance.routes.js';
app.use("/api/v1/personal/finance", financeRoutes);
app.use("/api/v1/finance", financeRoutes); // Alias for shared adapter


// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
