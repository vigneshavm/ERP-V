import { Response } from 'express';
import mongoose from 'mongoose';
import { container } from 'tsyringe';
import Supplier from '../models/Supplier.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { isSqlItemSource } from '../../../config/itemDataSource.js';
import { sqlSupplierList, updateSqlSupplier } from '../../../integrations/textilesoft/sqlSuppliers.js';
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

        if (isSqlItemSource()) {
            const rows = await sqlSupplierList();
            const data = rows.filter((row) => !supplierId || String(row._id) === supplierId);
            return void res.status(200).json({ success: true, data });
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
            }
        ]);

        // Payments/debit-notes live in erp.* now (not Mongo collections a $lookup can join against) --
        // batch-fetch per supplier and merge in application code instead.
        const { listPaymentOutsBySuppliers } = await import('../../../integrations/textilesoft/erpPaymentOut.js');
        const { listApprovedDebitNotesByVendors } = await import('../../../integrations/textilesoft/erpDebitNote.js');
        const supplierIds = stats.map((s: any) => String(s._id));
        const [payments, debitNotes] = await Promise.all([
            listPaymentOutsBySuppliers(supplierIds, ['cleared', 'pending']),
            listApprovedDebitNotesByVendors(supplierIds),
        ]);
        const paymentsBySupplier = new Map<string, { total: number; lastDate: Date | null }>();
        for (const p of payments) {
            const key = p.supplierId._id;
            const cur = paymentsBySupplier.get(key) ?? { total: 0, lastDate: null };
            cur.total += p.amount;
            if (!cur.lastDate || p.paymentDate > cur.lastDate) cur.lastDate = p.paymentDate;
            paymentsBySupplier.set(key, cur);
        }
        const debitNoteTotalBySupplier = new Map<string, number>();
        for (const d of debitNotes) {
            debitNoteTotalBySupplier.set(d.vendorId, (debitNoteTotalBySupplier.get(d.vendorId) ?? 0) + d.totalAmount);
        }
        const statsWithPayments = stats.map((s: any) => {
            const id = String(s._id);
            const pay = paymentsBySupplier.get(id) ?? { total: 0, lastDate: null };
            const debitNoteTotal = debitNoteTotalBySupplier.get(id) ?? 0;
            const netBalance = (s.openingBalance + s.totalAmount) - (pay.total + debitNoteTotal);
            const totalOutstanding = s.openingBalance + s.currentBillOutstanding;
            return {
                ...s,
                totalPaid: pay.total,
                lastPaymentDate: pay.lastDate,
                netBalance,
                totalOutstanding,
                creditUtilization: s.creditLimit > 0 ? (totalOutstanding / s.creditLimit) * 100 : 0,
            };
        });
        statsWithPayments.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

        // Enrich with simplified status string
        const enrichedStats = statsWithPayments.map(s => {
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
        if (isSqlItemSource()) {
            const supplier = (await sqlSupplierList()).find((row) => String(row._id) === String(req.params.id));
            res.json({ success: true, data: supplier ? { supplierId: supplier._id, supplierName: supplier.businessName, score: 0, rating: 'unrated', note: 'Performance history is not represented by the existing SQL supplier table.' } : null });
            return;
        }
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
        if (isSqlItemSource()) {
            const suppliers = await sqlSupplierList();
            return void res.json({ success: true, data: { payables: suppliers, trends: [], cashFlow: [], profitability: [], overdue: [] } });
        }

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
        const { updates } = req.body;
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ message: 'Invalid updates format' });
        }

        if (isSqlItemSource()) {
            const results = { updated: 0, failed: 0, errors: [] as string[] };
            for (const update of updates as Array<{ businessName: string; openingBalance: number }>) {
                const supplier = (await sqlSupplierList()).find((row) => String(row.businessName).toLowerCase() === String(update.businessName).toLowerCase());
                if (!supplier) {
                    results.failed++;
                    results.errors.push(`Supplier not found: ${update.businessName}`);
                    continue;
                }
                if (await updateSqlSupplier(String(supplier._id), { openingBalance: Number(update.openingBalance) })) results.updated++;
                else results.failed++;
            }
            return void res.status(200).json({ success: true, data: results, message: `Bulk update completed. Updated: ${results.updated}, Failed: ${results.failed}` });
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

        if (isSqlItemSource()) {
            const vendors = (await sqlSupplierList())
                .filter((supplier) => !supplierId || String(supplier._id) === supplierId)
                .map((supplier) => ({
                    businessName: supplier.businessName,
                    supplierId: supplier._id,
                    totalInflow: Number(supplier.totalAmount ?? 0),
                    totalOutflow: Number(supplier.totalPaid ?? 0),
                    debitNoteTotal: 0,
                    billCount: Number(supplier.billCount ?? 0),
                    paymentCount: 0,
                    openingBalance: Number(supplier.openingBalance ?? 0),
                    closingBalance: Number(supplier.netBalance ?? 0),
                }));
            const totals = vendors.reduce((sum, vendor) => ({
                totalInflow: sum.totalInflow + vendor.totalInflow,
                totalOutflow: sum.totalOutflow + vendor.totalOutflow,
                debitNoteTotal: 0,
                totalOpeningBalance: sum.totalOpeningBalance + vendor.openingBalance,
                totalClosingBalance: sum.totalClosingBalance + vendor.closingBalance,
                vendorCount: sum.vendorCount + 1,
            }), { totalInflow: 0, totalOutflow: 0, debitNoteTotal: 0, totalOpeningBalance: 0, totalClosingBalance: 0, vendorCount: 0 });
            return void res.status(200).json({ success: true, data: { vendors, totals, range: { startDate: startDate ?? null, endDate: endDate ?? null } } });
        }

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
            {
                $project: {
                    businessName: 1,
                    contactPersonName: 1,
                    supplierId: 1,
                    openingBalanceRaw: { $ifNull: ['$openingBalance', 0] },
                    totalInflow: { $sum: '$bills.amount' },
                    billCount: { $size: '$bills' },
                    preBillsAmount: { $sum: '$preBills.amount' },
                }
            },
        ]);

        // Payments/debit-notes live in erp.* now (not Mongo collections a $lookup can join against) --
        // batch-fetch per supplier and merge in application code instead.
        const { listPaymentOutsBySuppliers } = await import('../../../integrations/textilesoft/erpPaymentOut.js');
        const { listApprovedDebitNotesByVendorsInRange } = await import('../../../integrations/textilesoft/erpDebitNote.js');
        const supplierIds = stats.map((s: any) => String(s._id));
        const [prePayments, payments, preDebitNotes, debitNotes] = await Promise.all([
            startDate ? listPaymentOutsBySuppliers(supplierIds, ['cleared', 'pending'], { before: new Date(startDate) }) : Promise.resolve([]),
            listPaymentOutsBySuppliers(supplierIds, ['cleared', 'pending'], hasPaymentDateFilter ? { from: paymentDateFilter.$gte, to: paymentDateFilter.$lte } : undefined),
            startDate ? listApprovedDebitNotesByVendorsInRange(supplierIds, { before: new Date(startDate) }) : Promise.resolve([]),
            listApprovedDebitNotesByVendorsInRange(supplierIds, hasBillDateFilter ? { from: billDateFilter.$gte, to: billDateFilter.$lte } : undefined),
        ]);
        const sumBySupplier = <T extends { amount: number }>(entries: T[], keyOf: (e: T) => string) => {
            const map = new Map<string, number>();
            for (const e of entries) map.set(keyOf(e), (map.get(keyOf(e)) ?? 0) + e.amount);
            return map;
        };
        const prePaymentsBySupplier = sumBySupplier(prePayments, (p) => p.supplierId._id);
        const paymentsBySupplier = new Map<string, { total: number; count: number }>();
        for (const p of payments) {
            const key = p.supplierId._id;
            const cur = paymentsBySupplier.get(key) ?? { total: 0, count: 0 };
            cur.total += p.amount;
            cur.count += 1;
            paymentsBySupplier.set(key, cur);
        }
        const preDebitNotesBySupplier = new Map<string, number>();
        for (const d of preDebitNotes) preDebitNotesBySupplier.set(d.vendorId, (preDebitNotesBySupplier.get(d.vendorId) ?? 0) + d.totalAmount);
        const debitNotesBySupplier = new Map<string, number>();
        for (const d of debitNotes) debitNotesBySupplier.set(d.vendorId, (debitNotesBySupplier.get(d.vendorId) ?? 0) + d.totalAmount);

        const merged = stats.map((s: any) => {
            const id = String(s._id);
            const totalOutflow = paymentsBySupplier.get(id)?.total ?? 0;
            const paymentCount = paymentsBySupplier.get(id)?.count ?? 0;
            const debitNoteTotal = debitNotesBySupplier.get(id) ?? 0;
            const prePaymentsTotal = prePaymentsBySupplier.get(id) ?? 0;
            const preDebitNotesTotal = preDebitNotesBySupplier.get(id) ?? 0;
            const openingBalance = (s.openingBalanceRaw + s.preBillsAmount) - (prePaymentsTotal + preDebitNotesTotal);
            const closingBalance = (s.openingBalanceRaw + s.preBillsAmount + s.totalInflow) - (prePaymentsTotal + totalOutflow + preDebitNotesTotal + debitNoteTotal);
            return {
                businessName: s.businessName,
                contactPersonName: s.contactPersonName,
                supplierId: s.supplierId,
                totalInflow: s.totalInflow,
                totalOutflow,
                debitNoteTotal,
                billCount: s.billCount,
                paymentCount,
                openingBalance,
                closingBalance,
            };
        }).filter((s) =>
            s.totalInflow > 0 || s.totalOutflow > 0 || s.debitNoteTotal > 0 || s.openingBalance !== 0 || s.closingBalance !== 0
        ).sort((a, b) => b.totalInflow - a.totalInflow);

        // Calculate overall totals
        const totals = merged.reduce(
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
                vendors: merged,
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

        if (isSqlItemSource()) {
            const supplier = (await sqlSupplierList()).find((row) => String(row._id) === String(id));
            if (!supplier) return void res.status(404).json({ success: false, message: 'Supplier not found' });
            const opening = Number(supplier.openingBalance ?? 0);
            return void res.status(200).json({ success: true, data: {
                supplier: { _id: supplier._id, businessName: supplier.businessName, openingBalance: opening },
                period: { start: startDate ?? null, end: endDate ?? null },
                openingBalance: opening,
                closingBalance: Number(supplier.netBalance ?? opening),
                totals: { credit: 0, debit: 0 },
                transactions: [],
            } });
        }

        // Dynamic Imports
        const { default: Bill } = await import('../../finance/models/Bill.js');
        const { sumPaymentOuts, listPaymentOutsInRange } = await import('../../../integrations/textilesoft/erpPaymentOut.js');
        const { sumApprovedDebitNotes, listApprovedDebitNotesInRange } = await import('../../../integrations/textilesoft/erpDebitNote.js');


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

        const prePayments = await sumPaymentOuts(String(id), ['cleared', 'pending'], { before: start });

        const preDebitNotes = await sumApprovedDebitNotes(String(id), { before: start });

        const initialOpening = supplier.openingBalance || 0;
        const billsBefore = preBills[0]?.total || 0;
        const paymentsBefore = prePayments;
        const debitNotesBefore = preDebitNotes;

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

        const payments = await listPaymentOutsInRange(String(id), ['cleared', 'pending'], start, end);

        const debitNotes = await listApprovedDebitNotesInRange(String(id), start, end);

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
