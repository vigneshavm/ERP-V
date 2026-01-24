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

// Routes
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import cashBankRoutes from "./routes/cashBankRoutes.js";

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
    onSanitize: ({ req, key }) => {
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
// Routes
// =======================
app.use("/api/health", healthRoutes);

// Root Route
app.get("/", (req, res) => {
    res.send("🚀 SmartERPAI Backend is running (TypeScript)");
});

// Routes
// =======================
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes); // Registered Auth Routes
app.use("/api/inventory", inventoryRoutes); // Registered Inventory Routes
app.use("/api/customers", customerRoutes); // Registered Customer Routes
app.use("/api/suppliers", supplierRoutes); // Registered Supplier Routes
app.use("/api/sales-invoice", salesRoutes); // Registered Sales Routes
app.use("/api/expenses", expenseRoutes); // Registered Expense Routes
app.use("/api/cashbank", cashBankRoutes); // Registered Cash/Bank Routes
// ...

// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
