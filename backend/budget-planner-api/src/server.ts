import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRouter from './modules/auth/auth.routes';
import * as MockController from './modules/mock/mock.controller';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import expensesRouter from './modules/expenses/expenses.routes';
import budgetRouter from './modules/budget/budget.routes';
import {
  goalsRouter, loansRouter, accountsRouter, cardsRouter,
  notificationsRouter, reportsRouter, transactionsRouter, settingsRouter
} from './modules/combined.routes';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const BASE = `/api/${process.env.API_VERSION || 'v1'}`;

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'budget-planner-api', ts: new Date() }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get(`${BASE}/auth/me`, MockController.getMockUser);
app.get(`${BASE}/transactions`, MockController.getMockTransactions);
app.get(`${BASE}/personal/reports/analytics`, MockController.getMockAnalytics);

app.use(`${BASE}/auth`,          authRouter);
app.use(`${BASE}/dashboard`,     dashboardRouter);
app.use(`${BASE}/expenses`,      expensesRouter);
app.use(`${BASE}/budget`,        budgetRouter);
app.use(`${BASE}/goals`,         goalsRouter);
app.use(`${BASE}/loans`,         loansRouter);
app.use(`${BASE}/accounts`,      accountsRouter);
app.use(`${BASE}/cards`,         cardsRouter);
app.use(`${BASE}/notifications`, notificationsRouter);
app.use(`${BASE}/reports`,       reportsRouter);
app.use(`${BASE}/transactions`,  transactionsRouter);
app.use(`${BASE}/settings`,      settingsRouter);

// ─── Error handlers ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to DB, continuing in Mock mode...', err);
  }
  app.listen(PORT, () => console.log(`Budget Planner API running on port ${PORT}`));
})();

export default app;
