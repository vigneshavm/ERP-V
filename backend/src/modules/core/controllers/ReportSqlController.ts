import { Response } from "express";
import { error, warn } from "../../../config/logger.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import * as sqlItems from "../../../integrations/textilesoft/sqlItemSource.js";
import { hasSqlDashboard, sqlDashboardStats } from "../../../integrations/textilesoft/sqlDashboard.js";
import {
  isSalesReportDim,
  sqlSalesReport,
  sqlSalesIntelligence,
} from "../../../integrations/textilesoft/sqlSalesReports.js";
import { sqlInvoiceListByDate } from "../../../integrations/textilesoft/sqlSales.js";

/** Shop reports served only from the Textilesoft database (no MongoDB). */
const SHOP_DB_DOWN =
  "The shop database could not be reached, so this report cannot be shown right now. Try again in a moment.";

/** GET /api/reports/stock - totals and the low-stock list from the shop database. */
export const getStockReport = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [stats, lowStock] = await Promise.all([sqlItems.inventoryStats(), sqlItems.lowStockItems("", 50)]);
    res.status(200).json({ ...stats, lowStock, source: "sql" });
  } catch (err) {
    error(`SQL stock report failed: ${(err as Error).message}`);
    res.status(503).json({ message: SHOP_DB_DOWN });
  }
};

/** GET /api/reports/dashboard-stats */
export const getDashboardStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!hasSqlDashboard()) throw new Error("SQL dashboard mappings are not configured");
    const sql = await sqlDashboardStats();
    const months = Array.from(
      new Set([...sql.monthlyRevenue.map((r) => r.month), ...(sql.monthlyExpenses ?? []).map((r) => r.month)]),
    ).sort();
    res.status(200).json({
      totalInvoices: sql.totalInvoices,
      totalRevenue: sql.totalRevenue,
      // Customer credit/dues are not part of the first SQL billing scope.
      totalCollected: 0,
      totalOutstanding: 0,
      dailySales: sql.dailySales,
      revenueVsExpenses: months.map((month) => ({
        month,
        revenue: sql.monthlyRevenue.find((r) => r.month === month)?.revenue ?? 0,
        expenses: sql.monthlyExpenses?.find((r) => r.month === month)?.expenses ?? 0,
      })),
      paymentMethods: sql.paymentMethods,
      topCustomersWithDues: [],
      recentPurchases: sql.recentPurchases,
      expenseByCategory: sql.expenseByCategory,
      ...(sql.totalExpenses !== undefined ? { totalExpenses: sql.totalExpenses } : {}),
      asOf: sql.asOf,
      source: "sql",
    });
  } catch (err) {
    error(`SQL dashboard unavailable: ${(err as Error).message}`);
    res.status(503).json({ message: SHOP_DB_DOWN });
  }
};

/** GET /api/reports/shop-sales?dim=brand|category|counter|salesCounter|hour|day|product&range=&from=&to=&counter= */
export const getShopSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const q = req.query as Record<string, string | undefined>;
  if (!isSalesReportDim(q.dim)) {
    res.status(400).json({ message: "dim must be brand, category, counter, salesCounter, hour, day or product" });
    return;
  }
  const counter = typeof q.counter === "string" && q.counter.trim() ? q.counter.trim().slice(0, 100) : undefined;
  try {
    res.status(200).json(await sqlSalesReport(q.dim, q.range, q.from, q.to, req.tenantId?.toString(), counter));
  } catch (err) {
    warn(`[sql-reports] shop sales report (${q.dim}) failed - ${(err as Error).message}`);
    res.status(503).json({ message: SHOP_DB_DOWN });
  }
};

/** GET /api/reports/shop-sales/day-bills?date=YYYY-MM-DD&counter= - every bill of one day. */
export const getShopSalesDayBills = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const date = req.query.date;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ message: "date must be YYYY-MM-DD" });
    return;
  }
  const dayCounter = typeof req.query.counter === "string" && req.query.counter.trim() ? req.query.counter.trim() : undefined;
  try {
    const all = await sqlInvoiceListByDate(date);
    const rows = dayCounter
      ? all.filter((r: { counterName?: unknown }) => (String(r.counterName ?? "").trim() || "Main Counter") === dayCounter)
      : all;
    res.status(200).json({ source: "sql", date, rows });
  } catch (err) {
    warn(`[sql-reports] day bills failed for ${date} - ${(err as Error).message}`);
    res.status(503).json({ message: SHOP_DB_DOWN });
  }
};

/** GET /api/reports/shop-sales/intelligence?from=&to= - gross/net sales, GST collected, tender split, trend. */
export const getShopSalesIntelligence = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.status(200).json(await sqlSalesIntelligence(q.from, q.to));
  } catch (err) {
    warn(`[sql-reports] sales intelligence failed - ${(err as Error).message}`);
    res.status(503).json({ message: SHOP_DB_DOWN });
  }
};
