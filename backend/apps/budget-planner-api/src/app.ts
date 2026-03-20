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
import swaggerUi from "swagger-ui-express";
import { getSwaggerSpec } from "@smarterp/shared/config/swagger.js";

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
                styleSrc:   ["'self'", "'unsafe-inline'"],
                scriptSrc:  ["'self'"],
                imgSrc:     ["'self'", "data:", "https:"],
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
    replaceWith: "_",
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
    title: "SmartERPAI Budget Planner API",
    port: process.env.BUDGET_PORT || process.env.PORT || 4000,
    modules: ["auth", "budget", "expenses", "goals", "loans", "accounts", "reports"],
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Route
app.get("/", (_req, res) => {
    res.send("🚀 SmartERPAI Budget Planner API is running");
});

// Health Check
import { healthCheck } from "@smarterp/core/modules/core/controllers/HealthController.js";
app.get("/health", healthCheck);

// =======================
// Routes Integration (Budget Planner)
// =======================

// =======================
// MOCK DATA ROUTES (Mock-First Strategy - v1)
// =======================
import * as MockController from "./controllers/MockController.js";
const BASE = `/api/${process.env.API_VERSION || "v1"}`;
app.get(`${BASE}/auth/me`,                    MockController.getMockUser);
app.get(`${BASE}/transactions`,               MockController.getMockTransactions);
app.get(`${BASE}/personal/reports/analytics`, MockController.getMockAnalytics);

// AUTH Module
import authRouter from "./modules/auth/auth.routes.js";
app.use(`${BASE}/auth`, authRouter);

// DASHBOARD Module
import dashboardRouter from "./modules/dashboard/dashboard.routes.js";
app.use(`${BASE}/dashboards`, dashboardRouter);

// EXPENSES & CATEGORIES Module
import expensesRouter from "./modules/expenses/expenses.routes.js";
app.use(`${BASE}/expenses`, expensesRouter);

// BUDGET Module
import budgetRouter from "./modules/budget/budget.routes.js";
app.use(`${BASE}/budgets`, budgetRouter);

// GOALS / LOANS / ACCOUNTS / CARDS / NOTIFICATIONS / REPORTS / TRANSACTIONS / SETTINGS
import {
    goalsRouter,
    loansRouter,
    accountsRouter,
    cardsRouter,
    notificationsRouter,
    reportsRouter,
    transactionsRouter,
    settingsRouter,
} from "./modules/combined.routes.js";
app.use(`${BASE}/goals`,         goalsRouter);
app.use(`${BASE}/loans`,         loansRouter);
app.use(`${BASE}/accounts`,      accountsRouter);
app.use(`${BASE}/cards`,         cardsRouter);
app.use(`${BASE}/notifications`, notificationsRouter);
app.use(`${BASE}/reports`,       reportsRouter);
app.use(`${BASE}/transactions`,  transactionsRouter);
app.use(`${BASE}/settings`,      settingsRouter);

// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
