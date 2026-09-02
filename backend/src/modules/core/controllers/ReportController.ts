import { Request, Response } from 'express';

import Invoice from '../../sales/models/Invoice.js';

import Item from '../../inventory/models/Item.js';

import Customer from '../../crm/models/Customer.js';

import Expense from '../../expense/models/Expense.js';

import { generateAIReport } from '../../../utils/aiReportHelper.js';

import { checkStockAlerts } from '../../../utils/stockAlert.js';
import { info, error } from '../../../config/logger.js';

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

export default {
    getSalesReport,
    getStockReport,
    getCustomerReport,
    getDashboardStats,
};
