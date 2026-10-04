import dataBackupRoutes from "./modules/core/routes/dataBackup.routes.js";
import "reflect-metadata"; // Required for tsyringe
import sqlRestoreRoutes from "./modules/core/routes/sqlRestore.routes.js";
import express, { Express } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

// Configs & Utils
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} from "./config/sentry.js";
import { corsOptions } from "./config/cors.config.js";
import { stream } from "./config/logger.js";
import requestId from "./middlewares/requestId.js";
import requestTimeout from "./middlewares/timeout.js";
import errorHandler from "./middlewares/errorHandler.js";
import tenantResolver from "./middlewares/tenantResolver.js";
import { isSqlOnlyMode } from "./config/appDataMode.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

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
  }),
);

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

// SQL-only mode deliberately exposes only route groups reviewed as SQL-backed. All other mounted
// legacy routers are denied before they can reach a Mongoose model.
if (isSqlOnlyMode()) {
  app.use("/api", (req, res, next) => {
    const method = req.method.toUpperCase();
    const route = req.path.replace(/\/+$/, "") || "/";
    const allowed =
      route === "/system/data-backup" ||
      (method === "POST" && /^\/auth\/(login|refresh|logout|force-logout|register|forgot-password|reset-password)$/.test(route)) ||
      (method === "GET" && /^\/auth\/(profile|csrf-token)$/.test(route)) ||
      (method === "GET" && /^\/health(\/live|\/ready)?$/.test(route)) ||
      (method === "GET" && route === "/users") ||
      (method === "PUT" && /^\/users\/[^/]+$/.test(route)) ||
      (method === "PATCH" && /^\/users\/[^/]+\/discount-limit$/.test(route)) ||
      (method === "GET" && /^\/business\/(profile|setup)$/.test(route)) ||
      (method === "PUT" && route === "/business/profile") ||
      /^\/(branches|stores|companies|warehouses|counters)(\/|$)/.test(route) ||
      (method === "GET" && /^\/(customers|agents|cashiers|customer-groups)(\/[^/]+)?$/.test(route)) ||
      (method === "PUT" && /^\/customers\/[^/]+\/(mobile|card|name)$/.test(route)) ||
      (method === "POST" && /^\/(customers|agents)$/.test(route)) ||
      (["GET", "POST", "PUT"].includes(method) && /^\/suppliers(\/[^/]+)?$/.test(route)) ||
      (method === "GET" && /^\/sales-invoice\/(invoices|summary|invoice\/[^/]+)$/.test(route)) ||
      (method === "GET" && /^\/purchases(\/[^/]+|\/suppliers\/analytics)?$/.test(route)) ||
      (method === "GET" && /^\/expenses(\/[^/]+)?$/.test(route)) ||
      (method === "GET" && /^\/(cashbank(\/cheques)?|daily-finance)$/.test(route)) ||
      /^\/sync\/sql\/(config|backup-files|verify|restore|access)$/.test(route) ||
      /^\/hr\/employees(\/|$)/.test(route) ||
      /^\/masters(\/|$)/.test(route) ||
      /^\/product-master(\/|$)/.test(route) ||
      /^\/product-attributes(\/|$)/.test(route) ||
      /^\/purchase-entry(\/|$)/.test(route) ||
      /^\/pos(\/|$)/.test(route) ||
      /^\/purchase-returns(\/|$)/.test(route) ||
      /^\/reports(\/|$)/.test(route) ||
      /^\/inventory(\/|$)/.test(route);

    if (allowed) return next();
    return res.status(503).json({
      success: false,
      error: {
        code: "SQL_ONLY_ROUTE_UNAVAILABLE",
        message: "This route is not enabled in SQL-only mode.",
      },
    });
  });
}

// =======================
// Swagger Documentation
// =======================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Route
app.get("/", (_req, res) => {
  res.send("🚀 SmartERPAI Backend is running (TypeScript)");
});

// =======================
// Routes Integration
// =======================

// SQL-only route set. Mongo-backed routers are intentionally not imported or mounted.
import {
  branchRouter,
  companyRouter,
  warehouseRouter,
  counterRouter,
} from "./modules/core/routes/org.routes.js";
import productMasterRoutes, {
  attributeRouter,
} from "./modules/inventory/routes/productMaster.routes.js";
import purchaseEntryRoutes from "./modules/purchase/routes/purchaseEntry.routes.js";
import authRoutes from "./modules/core/routes/auth.routes.js";
import healthRoutes from "./modules/core/routes/health.routes.js";
import { SQL_MASTER_TYPES } from "./integrations/textilesoft/sqlMasters.js";
import { protect } from "./middlewares/authMiddleware.js";
import { listCustomerGroups } from "./integrations/textilesoft/sqlParties.js";
import expenseSqlRoutes from "./modules/expense/routes/expenseSql.routes.js";
import employeeSqlRoutes from "./modules/hr/routes/employeeSql.routes.js";
import masterDataRoutes from "./modules/masters/routes/masterData.routes.js";
import { customerRouter, agentRouter, cashierRouter, customerGroupRouter, supplierRouter } from "./modules/crm/routes/partiesSql.routes.js";
import salesSqlRoutes from "./modules/sales/routes/salesSql.routes.js";
import purchaseSqlRoutes from "./modules/purchase/routes/purchaseSql.routes.js";
import { cashBankRouter, dailyFinanceRouter } from "./modules/finance/routes/financeSql.routes.js";
import userSqlRoutes from "./modules/core/routes/userSql.routes.js";
import businessSqlRoutes from "./modules/core/routes/businessSql.routes.js";
import posSqlRoutes from "./modules/sales/routes/posSql.routes.js";
import purchaseReturnSqlRoutes from "./modules/purchase/routes/purchaseReturnSql.routes.js";
import reportSqlRoutes from "./modules/core/routes/reportSql.routes.js";
import inventorySqlRoutes from "./modules/inventory/routes/inventorySql.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/system/data-backup", dataBackupRoutes);
app.use("/api/users", userSqlRoutes);
app.use("/api/cashbank", cashBankRouter);
app.use("/api/daily-finance", dailyFinanceRouter);
app.use("/api/sales-invoice", salesSqlRoutes);
app.use("/api/purchases", purchaseSqlRoutes);
// Only the master types Textilesoft keeps in its own tables. The others would fall back to erp.master_entry
// (and seed default rows on first read), which is not allowed in SQL-only mode.
// Customer groups live in dbo.CustomerGroup: read-only here (the generic master path would use erp.master_entry).
app.get("/api/masters/CUSTOMER_GROUP", protect, async (_req, res, next) => {
  try {
    res.json(await listCustomerGroups());
  } catch (err) {
    next(err);
  }
});
app.use("/api/masters", (req, res, next) => {
  const seg = req.path.split("/").filter(Boolean);
  const isEntry = seg[0] === "entry";
  const ok = seg[0] === "types" || (isEntry ? String(seg[1] ?? "").startsWith("sql.") : SQL_MASTER_TYPES.has(seg[0] ?? ""));
  if (ok) return next();
  return res.status(503).json({ success: false, error: { code: "SQL_ONLY_ROUTE_UNAVAILABLE", message: "This master type is not stored in Textilesoft's database." } });
}, masterDataRoutes);
app.use("/api/hr/employees", employeeSqlRoutes);
app.use("/api/expenses", expenseSqlRoutes);
app.use("/api/customers", customerRouter);
app.use("/api/sync", sqlRestoreRoutes);
app.use("/api/agents", agentRouter);
app.use("/api/cashiers", cashierRouter);
app.use("/api/customer-groups", customerGroupRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/business", businessSqlRoutes);
app.use("/api/branches", branchRouter);
app.use("/api/stores", branchRouter);
app.use("/api/companies", companyRouter);
app.use("/api/warehouses", warehouseRouter);
app.use("/api/counters", counterRouter);
app.use("/api/product-master", productMasterRoutes);
app.use("/api/product-attributes", attributeRouter);
app.use("/api/purchase-entry", purchaseEntryRoutes);
app.use("/api/pos", posSqlRoutes);
app.use("/api/purchase-returns", purchaseReturnSqlRoutes);
app.use("/api/reports", reportSqlRoutes);
app.use("/api/inventory", inventorySqlRoutes);

// =======================
// Error Handler (must be last)
// =======================
if (process.env.SENTRY_DSN) {
  app.use(sentryErrorHandler());
}
app.use(errorHandler);

export default app;
