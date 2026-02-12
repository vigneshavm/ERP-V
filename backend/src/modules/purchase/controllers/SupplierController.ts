import { Response } from 'express';
import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import PurchaseReturn from '../models/PurchaseReturn.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

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
                    from: "purchasepayments",
                    let: { supplierId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$supplierId", "$$supplierId"] }
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

        res.status(200).json({ success: true, data: enrichedStats });

    } catch (error: any) {
        console.error('Get Supplier Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            businessName, contactPersonName, contactNo, email, physicalAddress,
            gstNo, panNo, supplierType, openingBalance, balanceType, creditPeriod,
            status, supplierGroup, groupId, defaultPaymentMode, isOneTime, bankAccounts
        } = req.body;

        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        // Check if supplier exists
        const existingSupplier = await Supplier.findOne({ tenantId, businessName });
        if (existingSupplier) {
            return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
        }

        // Auto-generate supplierId
        const lastSupplier = await Supplier.findOne({ tenantId }).sort({ supplierId: -1 });
        let nextId = 1;
        if (lastSupplier && lastSupplier.supplierId && lastSupplier.supplierId.includes('-')) {
            const lastNum = parseInt(lastSupplier.supplierId.split('-')[1]);
            if (!isNaN(lastNum)) nextId = lastNum + 1;
        }
        const supplierId = `SUP-${nextId.toString().padStart(5, '0')}`;

        const supplier = await Supplier.create({
            tenantId,
            supplierId,
            businessName,
            contactPersonName,
            contactNo,
            email,
            physicalAddress,
            gstNo,
            panNo,
            supplierType,
            openingBalance: openingBalance || 0,
            balanceType: balanceType || 'payable',
            creditPeriod: creditPeriod || 0,
            status: status || 'active',
            supplierGroup: supplierGroup || undefined,
            groupId: groupId || undefined,
            defaultPaymentMode: defaultPaymentMode || 'NEFT',
            isOneTime: !!isOneTime,
            bankAccounts: bankAccounts || [],
            owner: req.user?._id
        });

        res.status(201).json({ success: true, data: supplier });
    } catch (error: any) {
        console.error('Create Supplier Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const suppliers = await Supplier.find({ tenantId })
            .populate('groupId')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: suppliers });
    } catch (error: any) {
        console.error('Get Suppliers Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId?.toString();

        const supplier = await Supplier.findOne({ _id: id, tenantId }).populate('groupId');

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        res.status(200).json({ success: true, data: supplier });
    } catch (error: any) {
        console.error('Get Supplier Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId?.toString();

        let supplier = await Supplier.findOne({ _id: id, tenantId });

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        supplier = await Supplier.findOneAndUpdate(
            { _id: id, tenantId },
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: supplier });
    } catch (error: any) {
        console.error('Update Supplier Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId?.toString();

        // Check if supplier is used in any Purchase Orders
        const hasPurchases = await Purchase.findOne({ vendorId: id, tenantId });
        if (hasPurchases) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete supplier with existing purchase records. Please delete associated purchases first.'
            });
        }

        // Check if supplier is used in any Purchase Returns
        const hasReturns = await PurchaseReturn.findOne({ vendorId: id, tenantId });
        if (hasReturns) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete supplier with existing purchase return records. Please delete associated returns first.'
            });
        }

        const supplier = await Supplier.findOneAndDelete({ _id: id, tenantId });

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
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
        console.error('Report Error', err);
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
    } catch (error: any) {
        console.error('Ageing Analysis Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
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
    } catch (error: any) {
        console.error('Get Vendor Inflow/Outflow Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
