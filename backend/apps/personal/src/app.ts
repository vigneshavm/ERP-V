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
    res.send("🚀 SmartERPAI Personal API is running");
});

// =======================
// Routes Integration (Personal)
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

// EXPENSE Module
import expenseModuleRoutes from '@smarterp/core/modules/expense/routes/expense.routes.js';
app.use("/api", expenseModuleRoutes);

// SMS Tracker Module
import smsTrackerRoutes from '@smarterp/core/modules/sms-tracker/routes/sms-tracker.routes.js';
app.use("/api/sms-tracker", smsTrackerRoutes);


// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
