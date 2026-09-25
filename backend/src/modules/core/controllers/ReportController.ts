import { Request, Response } from 'express';

import Invoice from '../../sales/models/Invoice.js';

import Item from '../../inventory/models/Item.js';

import Customer from '../../crm/models/Customer.js';

import Expense from '../../expense/models/Expense.js';

import { generateAIReport } from '../../../utils/aiReportHelper.js';

import { checkStockAlerts } from '../../../utils/stockAlert.js';
import { info, error, warn } from '../../../config/logger.js';
import { isSqlItemSource } from '../../../config/itemDataSource.js';
import * as sqlItems from '../../../integrations/textilesoft/sqlItemSource.js';
import { hasSqlDashboard, sqlDashboardStats, type SqlDashboardStats } from '../../../integrations/textilesoft/sqlDashboard.js';
import { isSalesReportDim, sqlSalesReport, sqlStatusDebug, sqlSalesIntelligence } from '../../../integrations/textilesoft/sqlSalesReports.js';
import { sqlInvoiceListByDate } from '../../../integrations/textilesoft/sqlSales.js';
import { erpDayBills, erpSalesReport } from '../services/ErpSalesReportService.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        tenantId?: string;
        [key: string]: any;
    };
}

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     summary: Generate Sales Report (AI-powered)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales report generated successfully
 *       500:
 *         description: Server error during report generation
 */
export const getSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Shop-wide, not per-staff-member: scope by tenantId (matches how the rest of the app
        // scopes reads - e.g. InventoryRepository, the purchase-module SupplierController's
        // getSupplierAnalytics) rather than the single logged-in user, so a report reflects every
        // invoice/item recorded by any staff member on this tenant, not just this one.
        const tenantId = req.user?.tenantId;
        const invoices = await Invoice.find({ tenantId, isDeleted: { $ne: true } });
        const items = await Item.find({ tenantId });

        const report = generateAIReport(invoices, items);
        const stockAlerts = req.user?._id ? await checkStockAlerts(req.user._id) : [];

        info(`Sales report generated for ${req.user?.name} with ${report.summary.totalInvoices} invoices`);

        res.status(200).json({ report, stockAlerts });
    } catch (err) {
        error(`Report Generation Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/reports/stock:
 *   get:
 *     summary: Get Stock Report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock report retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems: { type: number }
 *                 lowStock: { type: array, items: { type: object } }
 */
export const getStockReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // ITEM_DATA_SOURCE=sql: totals and the low-stock list come from the shop DB.
        if (isSqlItemSource() && req.user?.tenantId) {
            const tenantId = String(req.user.tenantId);
            sqlItems.ensureMirror(tenantId);
            try {
                const [stats, lowStock] = await Promise.all([sqlItems.inventoryStats(), sqlItems.lowStockItems(tenantId, 50)]);
                res.status(200).json({
                    totalItems: stats.totalItems,
                    totalStockQuantity: stats.totalStockQuantity,
                    totalValuation: stats.totalValuation,
                    lowStockCount: stats.lowStockCount,
                    lowStock,
                    source: 'sql'
                });
                return;
            } catch (sqlErr) {
                warn(`Stock report: shop DB read failed, using MongoDB - ${(sqlErr as Error).message}`);
            }
        }
        const items = await Item.find({ tenantId: req.user?.tenantId }).sort({ stockQty: 1 });
        const lowStock = items.filter((i: any) => i.stockQty <= i.lowStockLimit);
        res.status(200).json({ totalItems: items.length, lowStock });
    } catch (err) {
        error(`Stock Report Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/reports/customers:
 *   get:
 *     summary: Get Customer Dues Report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer dues report retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 */
export const getCustomerReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customers = await Customer.find({
            tenantId: req.user?.tenantId,
            dues: { $gt: 0 }
        }).sort({ dues: -1 });
        res.status(200).json(customers);
    } catch (err) {
        error(`Customer Report Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/reports/dashboard-stats:
 *   get:
 *     summary: Get Dashboard Statistics for Graphs
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        // Shop-wide scope for everything that has a tenantId field (Invoice, Customer). Expense
        // has no tenantId on its schema (only createdBy) - see the monthlyExpenses aggregate
        // below - so that one stays per-user until Expense is given a tenant field.
        const tenantId = req.user?.tenantId;

        // ITEM_DATA_SOURCE=sql (with a `dashboard` section in the mapping): revenue, sales trend, payment
        // mix, purchases (and expenses when mapped) come from the shop DB. Customers and dues stay on MongoDB.
        let sql: SqlDashboardStats | undefined;
        if (isSqlItemSource()) {
            try {
                if (hasSqlDashboard()) sql = await sqlDashboardStats();
            } catch (sqlErr) {
                warn(`Dashboard: shop DB read failed, using MongoDB - ${(sqlErr as Error).message}`);
            }
        }

        // 0. Summary metrics
        const allInvoices = await Invoice.find({ tenantId, isDeleted: { $ne: true } });
        const totalInvoices = allInvoices.length;
        const totalRevenue = allInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
        const totalCollected = allInvoices.reduce((sum: number, inv: any) => {
            const collected = Math.min(inv.totalAmount || 0, (inv.paidAmount || 0) + (inv.creditApplied || 0));
            return sum + collected;
        }, 0);
        const totalOutstanding = Math.max(0, totalRevenue - totalCollected);

        // 1. Sales over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailySales = await Invoice.aggregate([
            {
                $match: {
                    tenantId,
                    isDeleted: { $ne: true },
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    totalSales: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Revenue vs Expenses (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await Invoice.aggregate([
            {
                $match: {
                    tenantId,
                    isDeleted: { $ne: true },
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Expense has no tenantId field (see backend/src/modules/expense/models/Expense.ts) -
        // stays scoped to the logged-in user until that model gains shop-wide scoping.
        const monthlyExpenses = await Expense.aggregate([
            {
                $match: {
                    createdBy: userId,
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
                    expenses: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Combine monthly revenue and expenses
        const months = Array.from(new Set([
            ...monthlyRevenue.map((r: any) => r._id),
            ...monthlyExpenses.map((e: any) => e._id)
        ])).sort();

        const revenueVsExpenses = months.map((month: string) => ({
            month,
            revenue: monthlyRevenue.find((r: any) => r._id === month)?.revenue || 0,
            expenses: monthlyExpenses.find((e: any) => e._id === month)?.expenses || 0
        }));

        // 3. Payment methods distribution (Invoices)
        const paymentMethods = await Invoice.aggregate([
            { $match: { tenantId, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // 4. Outstanding dues trend (Top 5 customers)
        const topCustomersWithDues = await Customer.find({
            tenantId,
            dues: { $gt: 0 }
        })
            .sort({ dues: -1 })
            .limit(5)
            .select('name dues');

        if (sql) {
            // Revenue side from SQL; expenses from SQL when mapped, otherwise the MongoDB expenses above.
            const sqlMonths = Array.from(new Set([...sql.monthlyRevenue.map((r) => r.month), ...(sql.monthlyExpenses ?? monthlyExpenses.map((e: any) => ({ month: e._id }))).map((e: any) => e.month)])).sort();
            const expenseFor = (month: string): number =>
                sql!.monthlyExpenses
                    ? sql!.monthlyExpenses.find((e) => e.month === month)?.expenses || 0
                    : monthlyExpenses.find((e: any) => e._id === month)?.expenses || 0;
            res.status(200).json({
                totalInvoices: sql.totalInvoices,
                totalRevenue: sql.totalRevenue,
                totalCollected,
                totalOutstanding,
                dailySales: sql.dailySales,
                revenueVsExpenses: sqlMonths.map((month) => ({
                    month,
                    revenue: sql!.monthlyRevenue.find((r) => r.month === month)?.revenue || 0,
                    expenses: expenseFor(month)
                })),
                paymentMethods: sql.paymentMethods,
                topCustomersWithDues,
                recentPurchases: sql.recentPurchases,
                expenseByCategory: sql.expenseByCategory,
                ...(sql.totalExpenses !== undefined ? { totalExpenses: sql.totalExpenses } : {}),
                asOf: sql.asOf,
                source: 'sql'
            });
            return;
        }

        res.status(200).json({
            totalInvoices,
            totalRevenue,
            totalCollected,
            totalOutstanding,
            dailySales,
            revenueVsExpenses,
            paymentMethods,
            topCustomersWithDues
        });
    } catch (err) {
        error(`Dashboard Stats Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

const SHOP_DB_DOWN = 'The shop database could not be reached, so this report cannot be shown right now. Try again in a moment.';

/**
 * GET /api/reports/shop-sales?dim=brand|category|counter|salesCounter|hour|day|product&range=TODAY|WEEK|MONTH|CUSTOM&from=&to=
 * Sales breakdown for the Detailed Analytics reports: from the shop database in SQL mode, else from the ERP's POS
 * invoices (all of them for the period, computed here; the pages no longer aggregate whatever sales the browser
 * happens to hold). In SQL mode a shop-database failure is a 503: ERP-only figures would silently undercount.
 */
export const getShopSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const q = req.query as Record<string, string | undefined>;
    if (!isSalesReportDim(q.dim)) {
        res.status(400).json({ message: 'dim must be brand, category, counter, salesCounter, hour, day or product' });
        return;
    }
    if (!isSqlItemSource()) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(403).json({ message: 'No shop is linked to this account' });
            return;
        }
        try {
            res.status(200).json(await erpSalesReport(q.dim, String(tenantId), q.range, q.from, q.to));
        } catch (err) {
            error(`[reports] ERP sales breakdown (${q.dim}) failed - ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
        return;
    }
    try {
        res.status(200).json(await sqlSalesReport(q.dim, q.range, q.from, q.to, req.user?.tenantId));
    } catch (err) {
        warn(`[sql-reports] shop sales report (${q.dim}) failed - ${(err as Error).message}`);
        res.status(503).json({ message: SHOP_DB_DOWN });
    }
};

/**
 * Bills for one calendar day, for the Daily Sales Report's drill-down (click a ledger row -> see every bill).
 * GET /api/reports/shop-sales/day-bills?date=YYYY-MM-DD
 */
export const getShopSalesDayBills = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const date = req.query.date;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ message: 'date must be YYYY-MM-DD' });
        return;
    }
    if (!isSqlItemSource()) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(403).json({ message: 'No shop is linked to this account' });
            return;
        }
        try {
            res.status(200).json({ source: 'mongo', date, rows: await erpDayBills(String(tenantId), date) });
        } catch (err) {
            error(`[reports] ERP day bills failed for ${date} - ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
        return;
    }
    try {
        const rows = await sqlInvoiceListByDate(date);
        res.status(200).json({ source: 'sql', date, rows });
    } catch (err) {
        warn(`[sql-reports] day bills failed for ${date} - ${(err as Error).message}`);
        res.status(503).json({ message: SHOP_DB_DOWN });
    }
};

/**
 * TEMPORARY DIAGNOSTIC route -- see sqlStatusDebug() in sqlSalesReports.ts for why this exists.
 * GET /api/reports/shop-sales/debug-status?from=&to=
 */
export const getShopSalesStatusDebug = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!isSqlItemSource()) {
        res.status(200).json({ source: 'mongo' });
        return;
    }
    try {
        const q = req.query as Record<string, string | undefined>;
        const result = await sqlStatusDebug(q.from, q.to);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * Real Gross/Net Sales, GST collected, cash/bank split and a revenue trend for the "Sales
 * Intelligence" report page (previously hardcoded mock numbers in useBusinessReports.ts).
 * GET /api/reports/shop-sales/intelligence?from=&to=
 */
export const getShopSalesIntelligence = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!isSqlItemSource()) {
        res.status(200).json({ source: 'mongo' });
        return;
    }
    try {
        const q = req.query as Record<string, string | undefined>;
        const result = await sqlSalesIntelligence(q.from, q.to);
        res.status(200).json(result);
    } catch (err) {
        warn(`[sql-reports] sales intelligence failed, no SQL figures returned - ${(err as Error).message}`);
        res.status(200).json({ source: 'mongo' });
    }
};

export default {
    getSalesReport,
    getStockReport,
    getCustomerReport,
    getDashboardStats,
    getShopSalesReport,
    getShopSalesDayBills,
    getShopSalesStatusDebug,
    getShopSalesIntelligence,
};
