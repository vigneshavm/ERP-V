import { Router } from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import {
  rangeFrom, financeTransactions, financeCheques, financeDaily,
} from "../../../integrations/textilesoft/sqlFinanceViews.js";

/**
 * Read-only finance feeds from Textilesoft's existing tables (see sqlFinanceViews.ts). No MongoDB, no writes.
 *   GET /api/cashbank          transactions (cash in/out + bank in/out)
 *   GET /api/cashbank/cheques  cheques recorded on bank transactions
 *   GET /api/daily-finance     one record per day: sales split, expenses, counted cash
 * Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD (default: last 90 days).
 */
export const cashBankRouter = Router();
cashBankRouter.use(protect);
cashBankRouter.get("/", sql(async (req, res) => { res.json(await financeTransactions(rangeFrom(req.query))); }));
cashBankRouter.get("/cheques", sql(async (req, res) => { res.json(await financeCheques(rangeFrom(req.query))); }));

export const dailyFinanceRouter = Router();
dailyFinanceRouter.use(protect);
dailyFinanceRouter.get("/", sql(async (req, res) => { res.json(await financeDaily(rangeFrom(req.query))); }));
