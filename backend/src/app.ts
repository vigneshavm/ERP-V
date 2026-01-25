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
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// Routes
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import expenseCategoryRoutes from "./routes/expenseCategoryRoutes.js";
import recurringExpenseRoutes from "./routes/recurringExpenseRoutes.js";
import expenseReportRoutes from "./routes/expenseReportRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import purchaseReturnRoutes from "./routes/purchaseReturnRoutes.js";
import estimateRoutes from "./routes/estimateRoutes.js";
import dueRoutes from "./routes/dueRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import cashBankRoutes from "./routes/cashBankRoutes.js";
import paymentInRoutes from "./routes/paymentInRoutes.js";
import salesOrderRoutes from "./routes/salesOrderRoutes.js";
import deliveryChallanRoutes from "./routes/deliveryChallanRoutes.js";
import refreshTokenRoutes from "./routes/refreshTokenRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import loyaltyRoutes from "./routes/loyaltyRoutes.js";


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
// Swagger Documentation
// =======================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =======================
// Routes
// =======================
app.use("/api/health", healthRoutes);

// Root Route
app.get("/", (_req, res) => {
    res.send("🚀 SmartERPAI Backend is running (TypeScript)");
});

// Routes
// =======================
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes); // Registered Auth Routes
app.use("/api/auth", refreshTokenRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes); // Registered Inventory Routes
app.use("/api/pos", posRoutes);
app.use("/api/sales-invoice", salesRoutes); // Registered Sales Routes
app.use("/api/customers", customerRoutes); // Registered Customer Routes
app.use("/api/suppliers", supplierRoutes); // Registered Supplier Routes
app.use("/api/expenses", expenseRoutes); // Registered Expense Routes
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/recurring-expenses", recurringExpenseRoutes);
app.use("/api/expense-reports", expenseReportRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/purchase-returns", purchaseReturnRoutes);
app.use("/api/estimates", estimateRoutes);
app.use("/api/due", dueRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/cashbank", cashBankRoutes); // Registered Cash/Bank Routes
app.use("/api/payment-in", paymentInRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/delivery-challan", deliveryChallanRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/loyalty", loyaltyRoutes);

// ...

// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
