import { Response } from "express";
import { error } from "../../../config/logger.js";
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import {
    buildBillProfit, buildCashFlow, buildDayBook, buildProfitLoss, buildSalesReport, buildTransactions, parseFinanceRange,
} from "../../finance/services/FinanceReportService.js";
import { sqlCashBank } from "../../../integrations/textilesoft/sqlCashBank.js";
import { buildReturnsAudit } from "../../sales/services/ReturnAuditService.js";
import { buildExpenseAnalysis } from "../../expense/services/ExpenseAnalysisService.js";

/**
 * Financial reports (Reports > Transaction Reports) from the shop (Textilesoft) database only - no MongoDB.
 * See FinanceReportService for the rules.
 *
 *   GET /api/reports/finance/daybook?date=YYYY-MM-DD          (default: latest day with shop data, else today)
 *   GET /api/reports/finance/transactions?from&to&type&mode&search&sort&dir&page&limit
 *   GET /api/reports/finance/cash-flow?from&to
 *   GET /api/reports/finance/profit-loss?from&to
 *   GET /api/reports/finance/sales?from&to&mode&search&sort&dir&page&limit
 *   GET /api/reports/finance/bill-profit?from&to&show=loss|uncosted&search&sort&dir&page&limit
 *   GET /api/reports/finance/expenses?from&to               (dbo.expenseentry, with rule-based flags)
 */

const q = (req: AuthenticatedRequest, k: string): string | undefined => (typeof req.query[k] === "string" ? (req.query[k] as string) : undefined);
const tenantOf = (req: AuthenticatedRequest): string => String(req.user.tenantId ?? "");

class BadRequest extends Error {}

function handler(label: string, fn: (req: AuthenticatedRequest, tenantId: string) => Promise<unknown>) {
    return async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            res.status(200).json(await fn(req, tenantOf(req)));
        } catch (err) {
            if (err instanceof BadRequest) {
                res.status(400).json({ message: err.message });
                return;
            }
            if ((err as { status?: number }).status === 404) {
                res.status(404).json({ message: (err as Error).message });
                return;
            }
            error(`${label} Error: ${(err as Error).message}`);
            res.status(500).json({ message: `Unable to load ${label}`, error: (err as Error).message });
        }
    };
}

function rangeOf(req: AuthenticatedRequest) {
    const range = parseFinanceRange(q(req, "from"), q(req, "to"));
    if (!range) throw new BadRequest("Pass from and to as YYYY-MM-DD, with from on or before to.");
    return range;
}

const table = (req: AuthenticatedRequest) => ({ search: q(req, "search"), sort: q(req, "sort"), dir: q(req, "dir"), page: q(req, "page"), limit: q(req, "limit") });

export const getDayBook = handler("Day Book", (req, tenantId) => buildDayBook(tenantId, q(req, "date")));

export const getTransactions = handler("All Transactions", (req, tenantId) =>
    buildTransactions(tenantId, rangeOf(req), { ...table(req), type: q(req, "type"), mode: q(req, "mode"), source: q(req, "source") }),
);

export const getCashFlow = handler("Cash Flow", (req, tenantId) => buildCashFlow(tenantId, rangeOf(req)));

export const getProfitLoss = handler("Profit & Loss", (req, tenantId) => buildProfitLoss(tenantId, rangeOf(req)));

export const getBillProfit = handler("Bill-Wise Profit", (req, tenantId) =>
    buildBillProfit(tenantId, rangeOf(req), { ...table(req), source: q(req, "source"), show: q(req, "show") }),
);

export const getSalesReportData = handler("Sales Report", (req, tenantId) =>
    buildSalesReport(tenantId, rangeOf(req), { ...table(req), source: q(req, "source"), mode: q(req, "mode") }),
);

export const getExpenseAnalysis = handler("Expense Analysis", (req, tenantId) => buildExpenseAnalysis(tenantId, rangeOf(req)));

export const getReturnsAudit = handler("Returns & Refund Audit", (req, tenantId) => buildReturnsAudit(tenantId, rangeOf(req)));

/** GET /api/reports/finance/cash-bank?from&to - Cash & Bank screen from Textilesoft's own cash, day-close and bank tables. */
export const getCashBank = handler("Cash & Bank", (req) => sqlCashBank(rangeOf(req)));
