import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Invoice  from '@smarterp/core/modules/sales/models/Invoice.js';
import Item     from '@smarterp/core/modules/inventory/models/Item.js';
import Customer from '@smarterp/core/modules/crm/models/Customer.js';
import Expense  from '@smarterp/core/modules/expense/models/Expense.js';
import { generateAIReport } from '@smarterp/shared/utils/aiReportHelper.js';
import { checkStockAlerts }  from '@smarterp/shared/utils/stockAlert.js';
import { info, error } from '@smarterp/shared/config/logger.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

/** Return tenantId as an ObjectId, or throw a clear error if it is missing. */
const resolveTenant = (req: AuthenticatedRequest): Types.ObjectId => {
    if (!req.tenantId) throw new Error('Tenant context missing — protect middleware not applied');
    return new Types.ObjectId(req.tenantId);
};

/**
 * GET /api/v1/reports/sales
 * Tenant-scoped sales report.  Previously filtered by createdBy (individual user)
 * which broke multi-tenancy — owners got empty reports when staff created invoices.
 */
export const getSalesReport = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const tenantId = resolveTenant(req);

    const [invoices, items] = await Promise.all([
        Invoice.find({ tenantId }).lean(),
        Item.find({ tenantId }).lean(),
    ]);

    const report      = generateAIReport(invoices, items);
    const stockAlerts = await checkStockAlerts(req.tenantId!);

    info(`Sales report: tenant=${req.tenantId} invoices=${report.summary.totalInvoices}`);
    res.status(200).json({ report, stockAlerts });

/**
 * GET /api/v1/reports/stock
 * Tenant-scoped stock report.
 */
export const getStockReport = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const tenantId = resolveTenant(req);

    const items    = await Item.find({ tenantId }).sort({ stockQty: 1 }).lean();
    const lowStock = items.filter((i: any) => i.stockQty <= i.lowStockLimit);

    res.status(200).json({ totalItems: items.length, lowStock });

/**
 * GET /api/v1/reports/customers
 * Tenant-scoped customer dues report.
 */
export const getCustomerReport = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const tenantId = resolveTenant(req);

    const customers = await Customer.find({ tenantId, dues: { $gt: 0 } })
        .sort({ dues: -1 })
        .lean();

    res.status(200).json(customers);

/**
 * GET /api/v1/reports/dashboard-stats
 * Tenant-scoped dashboard aggregations.
 */
export const getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const tenantId = resolveTenant(req);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Run all aggregations in parallel
    const [allInvoices, dailySales, monthlyRevenue, monthlyExpenses, paymentMethods, topCustomersWithDues] =
        await Promise.all([
            Invoice.find({ tenantId }).select('totalAmount paidAmount creditApplied').lean(),

            Invoice.aggregate([
                { $match: { tenantId, createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, totalSales: { $sum: '$totalAmount' } } },
                { $sort: { _id: 1 } },
            ]),

            Invoice.aggregate([
                { $match: { tenantId, createdAt: { $gte: sixMonthsAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
                { $sort: { _id: 1 } },
            ]),

            Expense.aggregate([
                { $match: { tenantId, date: { $gte: sixMonthsAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, expenses: { $sum: '$amount' } } },
                { $sort: { _id: 1 } },
            ]),

            Invoice.aggregate([
                { $match: { tenantId } },
                { $group: { _id: '$paymentMethod', count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
            ]),

            Customer.find({ tenantId, dues: { $gt: 0 } })
                .sort({ dues: -1 })
                .limit(5)
                .select('name dues')
                .lean(),
        ]);

    const totalRevenue    = allInvoices.reduce((s: number, inv: any) => s + (inv.totalAmount || 0), 0);
    const totalCollected  = allInvoices.reduce((s: number, inv: any) =>
        s + Math.min(inv.totalAmount || 0, (inv.paidAmount || 0) + (inv.creditApplied || 0)), 0);

    // Merge monthly revenue and expenses by month key
    const months = Array.from(new Set([
        ...monthlyRevenue.map((r: any) => r._id),
        ...monthlyExpenses.map((e: any) => e._id),
    ])).sort();

    const revenueVsExpenses = months.map((month: string) => ({
        month,
        revenue:  monthlyRevenue.find((r: any)  => r._id === month)?.revenue   ?? 0,
        expenses: monthlyExpenses.find((e: any)  => e._id === month)?.expenses  ?? 0,
    }));

    res.status(200).json({
        totalInvoices:      allInvoices.length,
        totalRevenue,
        totalCollected,
        totalOutstanding:   Math.max(0, totalRevenue - totalCollected),
        dailySales,
        revenueVsExpenses,
        paymentMethods,
        topCustomersWithDues,
    });

export default { getSalesReport, getStockReport, getCustomerReport, getDashboardStats };
