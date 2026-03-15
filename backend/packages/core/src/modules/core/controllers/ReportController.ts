import { Request, Response } from 'express';

import Invoice from '@smarterp/core/modules/sales/models/Invoice.js';

import Item from '@smarterp/core/modules/inventory/models/Item.js';

import Customer from '@smarterp/core/modules/crm/models/Customer.js';

import Expense from '@smarterp/core/modules/expense/models/Expense.js';

import { generateAIReport } from '@smarterp/shared/utils/aiReportHelper.js';

import { checkStockAlerts } from '@smarterp/shared/utils/stockAlert.js';
import { info, error } from '@smarterp/shared/config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
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
        // Only get invoices and items for current user
        const invoices = await Invoice.find({ createdBy: req.user?._id });
        const items = await Item.find({ addedBy: req.user?._id });

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
        const items = await Item.find({ addedBy: req.user?._id }).sort({ stockQty: 1 });
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
            owner: req.user?._id,
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

        // 0. Summary metrics
        const allInvoices = await Invoice.find({ createdBy: userId });
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
                    createdBy: userId,
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
                    createdBy: userId,
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
            { $match: { createdBy: userId } },
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
            owner: userId,
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
