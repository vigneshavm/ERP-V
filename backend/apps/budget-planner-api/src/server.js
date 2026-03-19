"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const MockController = __importStar(require("./modules/mock/mock.controller"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const expenses_routes_1 = __importDefault(require("./modules/expenses/expenses.routes"));
const budget_routes_1 = __importDefault(require("./modules/budget/budget.routes"));
const combined_routes_1 = require("./modules/combined.routes");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 4000;
const BASE = `/api/${process.env.API_VERSION || 'v1'}`;
// ─── Global middleware ────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (process.env.ALLOWED_ORIGINS || '').split(','),
    credentials: true,
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'budget-planner-api', ts: new Date() }));
// ─── Routes ───────────────────────────────────────────────────────────────────
app.get(`${BASE}/auth/me`, MockController.getMockUser);
app.get(`${BASE}/transactions`, MockController.getMockTransactions);
app.get(`${BASE}/personal/reports/analytics`, MockController.getMockAnalytics);
app.use(`${BASE}/auth`, auth_routes_1.default);
app.use(`${BASE}/dashboards`, dashboard_routes_1.default);
app.use(`${BASE}/expenses`, expenses_routes_1.default);
app.use(`${BASE}/budgets`, budget_routes_1.default);
app.use(`${BASE}/goals`, combined_routes_1.goalsRouter);
app.use(`${BASE}/loans`, combined_routes_1.loansRouter);
app.use(`${BASE}/accounts`, combined_routes_1.accountsRouter);
app.use(`${BASE}/cards`, combined_routes_1.cardsRouter);
app.use(`${BASE}/notifications`, combined_routes_1.notificationsRouter);
app.use(`${BASE}/reports`, combined_routes_1.reportsRouter);
app.use(`${BASE}/transactions`, combined_routes_1.transactionsRouter);
app.use(`${BASE}/settings`, combined_routes_1.settingsRouter);
// ─── Error handlers ───────────────────────────────────────────────────────────
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// ─── Start ────────────────────────────────────────────────────────────────────
(async () => {
    try {
        await (0, database_1.connectDB)();
    }
    catch (err) {
        console.error('Failed to connect to DB, continuing in Mock mode...', err);
    }
    app.listen(PORT, () => console.log(`Budget Planner API running on port ${PORT}`));
})();
exports.default = app;
