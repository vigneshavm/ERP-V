import { Response } from 'express';
import mongoose from 'mongoose';
import { container } from 'tsyringe';
import Supplier from '../models/Supplier.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { isSqlItemSource } from '../../../config/itemDataSource.js';
import { sqlSupplierList } from '../../../integrations/textilesoft/sqlSuppliers.js';
import { warn, error } from '../../../config/logger.js';
import { SupplierService } from '../services/SupplierService.js';
import { AppError } from '../../../utils/AppError.js';
// Removed static imports for Bill, PaymentOut, DebitNote to use dynamic imports in getSupplierLedger

const supplierService = container.resolve(SupplierService);

export const getSupplierAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        const branchId = req.query.branchId as string;
        const supplierId = req.query.supplierId as string;

        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const matchStage: any = { tenantId };
        if (supplierId) {
            matchStage._id = new mongoose.Types.ObjectId(supplierId);
        }
        // Note: Supplier itself is global per Tenant, but we filter their TRANSACTIONS by branch

        // We need to filter Bills and Purchases by branchId if provided

        const stats = await Supplier.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "bills",
                    let: { supplierId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$supplier", "$$supplierId"] },
                                status: { $nin: ["draft", "rejected", "cancelled"] },
                                ...(branchId ? { branchId: branchId } : {})
                            }
                        }
                    ],
                    as: "bills"
                }
            },
            {
                $lookup: {
                    from: "paymentouts",
                    let: { supplierId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$supplierId", "$$supplierId"] },
                                status: { $in: ["cleared", "pending"] }
                            }
                        }
                    ],
                    as: "payments"
                }
            },
            {
                $lookup: {
                    from: "debitnotes",
                    let: { supplierId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$vendorId", "$$supplierId"] },
                                status: "APPROVED"
                            }
                        }
                    ],
                    as: "debitNotes"
                }
            },
            {
                $project: {
                    businessName: 1,
                    contactPersonName: 1,
                    contactNo: 1,
                    email: 1,
                    supplierId: 1,
                    supplierType: 1,
                    status: 1,
                    supplierGroup: 1,
                    groupId: 1,
                    createdAt: 1,
                    openingBalance: { $ifNull: ["$openingBalance", 0] },
                    creditLimit: { $ifNull: ["$creditLimit", 0] },
                    // Metrics (Based on Bills)
                    billCount: { $size: "$bills" },
                    totalAmount: { $sum: "$bills.amount" },
                    totalPaid: { $sum: "$payments.amount" },
                    lastPaymentDate: { $max: "$payments.paymentDate" },
                    netBalance: {
                        $subtract: [
                            { $add: [{ $ifNull: ["$openingBalance", 0] }, { $sum: "$bills.amount" }] },
                            { $add: [{ $sum: "$payments.amount" }, { $sum: "$debitNotes.totalAmount" }] }
                        ]
                    },
                    currentBillOutstanding: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$bills",
                                        as: "bill",
                                        cond: { $ne: ["$$bill.status", "paid"] }
                                    }
                                },
                                as: "bill",
                                in: { $subtract: ["$$bill.amount", { $ifNull: ["$$bill.paidAmount", 0] }] }
                            }
                        }
                    },
                    // Payment Status Logic
                    overdueCount: {
                        $size: {
                            $filter: {
                                input: "$bills",
                                as: "bill",
                                cond: {
                                    $and: [
                                        { $ne: ["$$bill.status", "paid"] },
                                        { $lt: ["$$bill.dueDate", new Date()] }
                                    ]
                                }
                            }
                        }
                    },
                    overdueAmount: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$bills",
                                        as: "bill",
                                        cond: {
                                            $and: [
                                                { $ne: ["$$bill.status", "paid"] },
                                                { $lt: ["$$bill.dueDate", new Date()] }
                                            ]
                                        }
                                    }
                                },
                                as: "bill",
                                in: { $subtract: ["$$bill.amount", { $ifNull: ["$$bill.paidAmount", 0] }] }
                            }
                        }
                    },
                    dueSoonCount: {
                        $size: {
                            $filter: {
                                input: "$bills",
                                as: "bill",
                                cond: {
                                    $and: [
                                        { $ne: ["$$bill.status", "paid"] },
                                        { $gte: ["$$bill.dueDate", new Date()] },
                                        { $lt: ["$$bill.dueDate", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] } // 7 Days
                                    ]
                                }
                            }
                        }
                    },
                    dueNext7DaysAmount: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$bills",
                                        as: "bill",
                                        cond: {
                                            $and: [
                                                { $ne: ["$$bill.status", "paid"] },
                                                { $gte: ["$$bill.dueDate", new Date()] },
                                                { $lt: ["$$bill.dueDate", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] }
                                            ]
                                        }
                                    }
                                },
                                as: "bill",
                                in: { $subtract: ["$$bill.amount", { $ifNull: ["$$bill.paidAmount", 0] }] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalOutstanding: { $add: ["$openingBalance", "$currentBillOutstanding"] },
                    creditUtilization: {
                        $cond: {
                            if: { $gt: ["$creditLimit", 0] },
                            then: { $multiply: [{ $divide: [{ $add: ["$openingBalance", "$currentBillOutstanding"] }, "$creditLimit"] }, 100] },
                            else: 0
                        }
                    }
                }
            },
            { $sort: { totalOutstanding: -1 } } // Sort by who we owe the most
        ]);

        // Enrich with simplified status string
        const enrichedStats = stats.map(s => {
            let paymentStatus = 'Good';
            if (s.overdueCount > 0) paymentStatus = 'Overdue';
            else if (s.dueSoonCount > 0) paymentStatus = 'Due Soon';

            // Add risk flag if credit limit exceeded (e.g. > 90%)
            const isCreditRisk = s.creditLimit > 0 && s.totalOutstanding > s.creditLimit;

            return {
                ...s,
                paymentStatus,
                isCreditRisk
            };
        });

        // SQL mode: add suppliers seen in the shop's own purchase entries (an ERP supplier with the same name wins).
        if (isSqlItemSource() && !supplierId && !branchId) {
            try {
                const known = new Set(enrichedStats.map((x: any) => String(x.businessName || '').trim().toLowerCase()));
                const shop = (await sqlSupplierList()).filter((x) => !known.has(String(x.businessName).trim().toLowerCase()));
                res.status(200).json({ success: true, data: [...enrichedStats, ...shop] });
                return;
            } catch (e) {
                warn(`[sql-suppliers] shop suppliers unavailable, showing ERP suppliers only - ${(e as Error).message}`);
            }
        }
        res.status(200).json({ success: true, data: enrichedStats });

    } catch (err: any) {
        error(`Get Supplier Analytics Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const supplier = await supplierService.createSupplier(tenantId, req.user._id.toString(), req.body);
        res.status(201).json({ success: true, data: supplier });
    } catch (err: any) {
        error(`Create Supplier Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

export const getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const suppliers = await supplierService.getSuppliers(tenantId);
        res.status(200).json({ success: true, data: suppliers });
    } catch (err: any) {
        error(`Get Suppliers Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

export const getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const data = await supplierService.getSupplierById(String(id), tenantId);
        res.status(200).json({ success: true, data });
    } catch (err: any) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        error(`Get Supplier Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const supplier = await supplierService.updateSupplier(String(id), tenantId, req.body);
        res.status(200).json({ success: true, data: supplier });
    } catch (err: any) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        error(`Update Supplier Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        await supplierService.deleteSupplier(String(id), tenantId);
        res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (err: any) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

export const evaluateSupplierPerformance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { evaluateSupplier } = await import('../services/SupplierPerformanceService.js');
        const id = req.params.id as string;
        const metrics = await evaluateSupplier(id);
        res.json({ success: true, data: metrics });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getSupplierReports = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

        const {
            getPayablesOverview,
            getPurchaseTrends,
            getCashFlowForecast,
            getProfitabilityAnalysis,
            getOverdueList
        } = await import('../services/SupplierReportService.js');

        const [payables, trends, cashFlow, profitability, overdue] = await Promise.all([
            getPayablesOverview(tenantId),
            getPurchaseTrends(tenantId),
            getCashFlowForecast(tenantId),
            getProfitabilityAnalysis(tenantId),
            getOverdueList(tenantId)
        ]);

        res.json({
            success: true,
            data: {
                payables,
                trends,
                cashFlow,
                profitability,
                overdue
            }
        });
    } catch (err: any) {
        error(`Report Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        res.status(500).json({ message: err.message });
    }
};

export const getAgeingAnalysis = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { getSupplierAgeingReport } = await import('../services/SupplierAgeingService.js');
        const data = await getSupplierAgeingReport(tenantId);

        res.status(200).json({
            success: true,
            data
        });
    } catch (err: any) {
        error(`Ageing Analysis Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const bulkUpdateOpeningBalance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

        const { updates } = req.body; // Array of { supplierName, openingBalance }
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ message: 'Invalid updates format' });
        }

        const results = { updated: 0, failed: 0, errors: [] as any[] };

        for (const update of updates) {
            try {
                const { businessName, openingBalance, balanceType = 'payable' } = update;

                // Find supplier by name (case insensitive)
                const supplier = await Supplier.findOne({
                    tenantId,
                    businessName: { $regex: new RegExp(`^${businessName}$`, 'i') }
                });

                if (supplier) {
                    supplier.openingBalance = parseFloat(openingBalance);
                    supplier.balanceType = balanceType;
                    await supplier.save();
                    results.updated++;
                } else {
                    results.failed++;
                    results.errors.push(`Supplier not found: ${businessName}`);
                }
            } catch (err: any) {
                results.failed++;
                results.errors.push(`Error updating ${update.businessName}: ${err.message}`);
            }
        }

        res.status(200).json({
            success: true,
            message: `Bulk update completed. Updated: ${results.updated}, Failed: ${results.failed}`,
            data: results
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getVendorInflowOutflow = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const { startDate, endDate, supplierId } = req.query as {
            startDate?: string;
            endDate?: string;
            supplierId?: string;
        };

        // Build supplier match stage
        const supplierMatch: any = { tenantId };
        if (supplierId) {
            supplierMatch._id = new mongoose.Types.ObjectId(supplierId);
        }

        // Build date filter for bills and payments
        const billDateFilter: any = {};
        const paymentDateFilter: any = {};
        if (startDate) {
            billDateFilter.$gte = new Date(startDate);
            paymentDateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            billDateFilter.$lte = end;
            paymentDateFilter.$lte = end;
        }

        const hasBillDateFilter = Object.keys(billDateFilter).length > 0;
        const hasPaymentDateFilter = Object.keys(paymentDateFilter).length > 0;

        const stats = await Supplier.aggregate([
            { $match: supplierMatch },
            // Lookup transactions BEFORE startDate to calculate Opening Balance
            {
                $lookup: {
                    from: 'bills',
                    let: { supplierId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$supplier', '$$supplierId'] },
                                tenantId,
                                status: { $nin: ['draft', 'rejected', 'cancelled'] },
                                ...(startDate ? { date: { $lt: new Date(startDate) } } : { _id: null }) // if no startDate, pre is empty
                            }
                        }
                    ],
                    as: 'preBills'
                }
            },
            {
                $lookup: {
                    from: 'paymentouts',
                    let: { supplierId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$supplierId', '$$supplierId'] },
                                tenantId,
                                status: { $in: ['cleared', 'pending'] },
                                ...(startDate ? { paymentDate: { $lt: new Date(startDate) } } : { _id: null })
                            }
                        }
                    ],
                    as: 'prePayments'
                }
            },
            {
                $lookup: {
                    from: 'debitnotes',
                    let: { supplierId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$vendorId', '$$supplierId'] },
                                tenantId,
                                status: 'APPROVED',
                                ...(startDate ? { date: { $lt: new Date(startDate) } } : { _id: null })
                            }
                        }
                    ],
                    as: 'preDebitNotes'
                }
            },
            // Lookup bills (inflow) in period
            {
                $lookup: {
                    from: 'bills',
                    let: { supplierId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$supplier', '$$supplierId'] },
                                tenantId,
                                status: { $nin: ['draft', 'rejected', 'cancelled'] },
                                ...(hasBillDateFilter ? { date: billDateFilter } : {})
                            }
                        }
                    ],
                    as: 'bills'
                }
            },
            // Lookup payments (outflow) in period
            {
                $lookup: {
                    from: 'paymentouts',
                    let: { supplierId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$supplierId', '$$supplierId'] },
                                tenantId,
                                status: { $in: ['cleared', 'pending'] },
                                ...(hasPaymentDateFilter ? { paymentDate: paymentDateFilter } : {})
                            }
                        }
                    ],
                    as: 'payments'
                }
            },
            // Lookup debit notes (adjustments) in period
            {
                $lookup: {
                    from: 'debitnotes',
                    let: { supplierId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$vendorId', '$$supplierId'] },
                                tenantId,
                                status: 'APPROVED',
                                ...(hasBillDateFilter ? { date: billDateFilter } : {})
                            }
                        }
                    ],
                    as: 'debitNotes'
                }
            },
            {
                $project: {
                    businessName: 1,
                    contactPersonName: 1,
                    supplierId: 1,
                    totalInflow: { $sum: '$bills.amount' },
                    totalOutflow: { $sum: '$payments.amount' },
                    debitNoteTotal: { $sum: '$debitNotes.totalAmount' },
                    billCount: { $size: '$bills' },
                    paymentCount: { $size: '$payments' },
                    openingBalance: {
                        $subtract: [
                            { $add: [{ $ifNull: ['$openingBalance', 0] }, { $sum: '$preBills.amount' }] },
                            { $add: [{ $sum: '$prePayments.amount' }, { $sum: '$preDebitNotes.totalAmount' }] }
                        ]
                    },
                    closingBalance: {
                        $subtract: [
                            { $add: [{ $ifNull: ['$openingBalance', 0] }, { $sum: '$preBills.amount' }, { $sum: '$bills.amount' }] },
                            { $add: [{ $sum: '$prePayments.amount' }, { $sum: '$payments.amount' }, { $sum: '$preDebitNotes.totalAmount' }, { $sum: '$debitNotes.totalAmount' }] }
                        ]
                    }
                }
            },
            // Only include suppliers that have activity or a non-zero balance
            {
                $match: {
                    $or: [
                        { totalInflow: { $gt: 0 } },
                        { totalOutflow: { $gt: 0 } },
                        { debitNoteTotal: { $gt: 0 } },
                        { openingBalance: { $ne: 0 } },
                        { closingBalance: { $ne: 0 } }
                    ]
                }
            },
            { $sort: { totalInflow: -1 } }
        ]);

        // Calculate overall totals
        const totals = stats.reduce(
            (acc, s) => ({
                totalInflow: acc.totalInflow + (s.totalInflow || 0),
                totalOutflow: acc.totalOutflow + (s.totalOutflow || 0),
                debitNoteTotal: acc.debitNoteTotal + (s.debitNoteTotal || 0),
                totalOpeningBalance: acc.totalOpeningBalance + (s.openingBalance || 0),
                totalClosingBalance: acc.totalClosingBalance + (s.closingBalance || 0),
                vendorCount: acc.vendorCount + 1
            }),
            { totalInflow: 0, totalOutflow: 0, debitNoteTotal: 0, totalOpeningBalance: 0, totalClosingBalance: 0, vendorCount: 0 }
        );

        res.status(200).json({
            success: true,
            data: {
                vendors: stats,
                totals
            }
        });
    } catch (err: any) {
        error(`Get Vendor Inflow/Outflow Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

export const getSupplierLedger = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        const { id } = req.params;
        const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        // Dynamic Imports
        const { default: Bill } = await import('../../finance/models/Bill.js');
        const { default: PaymentOut } = await import('../models/PaymentOut.js');
        const { default: DebitNote } = await import('../models/DebitNote.js');


        const supplier = await Supplier.findOne({ _id: id, tenantId });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        // Default dates: Start of current month to today
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // 1. Calculate Opening Balance (before start date)
        // Opening = Initial Opening Balance + (Bills - Payments - DebitNotes) before start date
        const preBills = await Bill.aggregate([
            {
                $match: {
                    supplier: new mongoose.Types.ObjectId(id as string),
                    tenantId,
                    status: { $nin: ['draft', 'rejected', 'cancelled'] },
                    date: { $lt: start }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const prePayments = await PaymentOut.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(id as string),
                    tenantId,
                    status: { $in: ['cleared', 'pending'] },
                    paymentDate: { $lt: start }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const preDebitNotes = await DebitNote.aggregate([
            {
                $match: {
                    vendorId: new mongoose.Types.ObjectId(id as string),
                    tenantId,
                    status: 'APPROVED',
                    date: { $lt: start }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const initialOpening = supplier.openingBalance || 0;
        const billsBefore = preBills[0]?.total || 0;
        const paymentsBefore = prePayments[0]?.total || 0;
        const debitNotesBefore = preDebitNotes[0]?.total || 0;

        // For a supplier (Credit):
        // Balance = (Opening + Bills) - (Payments + DebitNotes)
        // If BalanceType is 'receivable', Opening is negative liability (asset). Let's assume standard Payable.
        // Actually, if balanceType is 'receivable', we should treat opening balance as negative in payable context?
        // Standard approach: Opening Balance is amount WE OWE.
        let openingBalance = initialOpening;
        if (supplier.balanceType === 'receivable') {
            openingBalance = -initialOpening;
        }

        // Calculate running opening balance at start date
        const runningOpeningBalance = (openingBalance + billsBefore) - (paymentsBefore + debitNotesBefore);


        // 2. Fetch Transactions in Range
        const bills = await Bill.find({
            supplier: id,
            tenantId,
            status: { $nin: ['draft', 'rejected', 'cancelled'] },
            date: { $gte: start, $lte: end }
        }).lean();

        const payments = await PaymentOut.find({
            supplierId: id,
            tenantId,
            status: { $in: ['cleared', 'pending'] },
            paymentDate: { $gte: start, $lte: end }
        }).lean();

        const debitNotes = await DebitNote.find({
            vendorId: id,
            tenantId,
            status: 'APPROVED',
            date: { $gte: start, $lte: end }
        }).lean();

        // 3. Merge and Sort
        const transactions: any[] = [];

        bills.forEach(b => {
            transactions.push({
                date: b.date,
                type: 'BILL',
                refNo: b.billNo,
                description: `Bill #${b.billNo}`,
                credit: b.amount, // Bill increases payable (Credit)
                debit: 0,
                originalRef: b
            });
        });

        payments.forEach(p => {
            transactions.push({
                date: p.paymentDate,
                type: 'PAYMENT',
                refNo: p.paymentNo,
                description: `Payment via ${p.paymentMode}`,
                credit: 0,
                debit: p.amount, // Payment decreases payable (Debit)
                originalRef: p
            });
        });

        debitNotes.forEach(d => {
            transactions.push({
                date: d.date,
                type: 'DEBIT_NOTE',
                refNo: d.debitNoteNumber,
                description: d.reason || 'Debit Note',
                credit: 0,
                debit: d.totalAmount, // Debit Note decreases payable (Debit)
                originalRef: d,
                purchaseReturnId: d.sourceId // Link to return if exists
            });
        });

        // Sort by Date
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 4. Calculate Running Balance
        let currentBalance = runningOpeningBalance;
        let totalCredit = 0;
        let totalDebit = 0;

        const processedTransactions = transactions.map(t => {
            currentBalance = currentBalance + t.credit - t.debit;
            totalCredit += t.credit;
            totalDebit += t.debit;
            return {
                ...t,
                balance: currentBalance
            };
        });

        res.status(200).json({
            success: true,
            data: {
                supplier: {
                    _id: supplier._id,
                    businessName: supplier.businessName,
                    openingBalance: supplier.openingBalance
                },
                period: {
                    start: start.toISOString(),
                    end: end.toISOString()
                },
                openingBalance: runningOpeningBalance,
                closingBalance: currentBalance,
                totals: {
                    credit: totalCredit,
                    debit: totalDebit
                },
                transactions: processedTransactions
            }
        });

    } catch (err: any) {
        error(`Get Supplier Ledger Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
