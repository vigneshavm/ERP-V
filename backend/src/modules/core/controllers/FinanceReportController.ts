import { Request, Response } from "express";
import { error } from "../../../config/logger.js";
import {
    buildBillProfit, buildCashFlow, buildDayBook, buildProfitLoss, buildSalesReport, buildTransactions, parseFinanceRange,
} from "../../finance/services/FinanceReportService.js";
import { buildReturnsAudit } from "../../sales/services/ReturnAuditService.js";
import { buildExpenseAnalysis } from "../../expense/services/ExpenseAnalysisService.js";
import { buildBankReconciliation, buildCashBankOverview, buildLoansReport, confirmMatches } from "../../finance/services/CashBankOverviewService.js";

/**
 * Financial reports (Reports > Transaction Reports). Shop-database figures are included when ITEM_DATA_SOURCE=sql;
 * ERP records always are. See FinanceReportService for the rules.
 *
 *   GET /api/reports/finance/daybook?date=YYYY-MM-DD          (default: latest day with shop data, else today)
 *   GET /api/reports/finance/transactions?from&to&type&mode&source&search&sort&dir&page&limit
 *   GET /api/reports/finance/cash-flow?from&to
 *   GET /api/reports/finance/profit-loss?from&to
 *   GET /api/reports/finance/sales?from&to&source&mode&search&sort&dir&page&limit
 *   GET /api/reports/finance/bill-profit?from&to&source&show=loss|uncosted&search&sort&dir&page&limit
 *   GET /api/reports/returns-audit?from&to                   (ERP sales returns, all staff, with risk flags)
 *   GET /api/reports/finance/expenses?from&to               (ERP expenses, all staff, with rule-based flags)
 *   GET /api/reports/finance/cash-bank-overview              (cash in hand, banks, loans, cheques, overdue bills, alerts)
 *   GET /api/reports/finance/loans                           (loans with EMIs paid / due / overdue)
 *   GET /api/reports/finance/bank-reconciliation?accountId&from&to
 *   POST /api/reports/finance/bank-reconciliation/match      { pairs: [{ statementId, entryId }] }
 */

const q = (req: Request, k: string): string | undefined => (typeof req.query[k] === "string" ? (req.query[k] as string) : undefined);
const tenantOf = (req: Request): string => String((req as unknown as { tenantId?: string }).tenantId ?? "");

class BadRequest extends Error {}

function handler(label: string, fn: (req: Request, tenantId: string) => Promise<unknown>) {
    return async (req: Request, res: Response): Promise<void> => {
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

function rangeOf(req: Request) {
    const range = parseFinanceRange(q(req, "from"), q(req, "to"));
    if (!range) throw new BadRequest("Pass from and to as YYYY-MM-DD, with from on or before to.");
    return range;
}

const table = (req: Request) => ({ search: q(req, "search"), sort: q(req, "sort"), dir: q(req, "dir"), page: q(req, "page"), limit: q(req, "limit") });

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

export const getReturnsAudit = handler("Returns & Refund Audit", (req, tenantId) => buildReturnsAudit(tenantId, rangeOf(req)));

export const getCashBankOverview = handler("Cash & Bank Overview", (_req, tenantId) => buildCashBankOverview(tenantId));

export const getLoansReport = handler("Loans", (_req, tenantId) => buildLoansReport(tenantId));

export const getBankReconciliation = handler("Bank Reconciliation", (req, tenantId) => {
    const accountId = q(req, "accountId");
    if (!accountId) throw new BadRequest("Pick a bank account (accountId).");
    return buildBankReconciliation(tenantId, accountId, rangeOf(req));
});

export const postReconcileMatches = handler("Bank Reconciliation", (req, tenantId) => {
    const pairs = (req.body as { pairs?: unknown })?.pairs;
    if (!Array.isArray(pairs) || !pairs.length) throw new BadRequest("Send pairs: [{ statementId, entryId }].");
    const userId = String((req as unknown as { user?: { _id?: unknown } }).user?._id ?? "");
    const clean = pairs
        .filter((p): p is { statementId: string; entryId: string } => !!p && typeof p.statementId === "string" && typeof p.entryId === "string")
        .slice(0, 500);
    return confirmMatches(tenantId, userId, clean);
});

export const getExpenseAnalysis = handler("Expense Analysis", (req, tenantId) => buildExpenseAnalysis(tenantId, rangeOf(req)));
