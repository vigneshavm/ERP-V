import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import PurchaseReturn from '../models/PurchaseReturn.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
// Removed static imports for Bill, PaymentOut, DebitNote to use dynamic imports in getSupplierLedger
export const getSupplierAnalytics = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId?.toString();
    const branchId = req.query.branchId;
    const supplierId = req.query.supplierId;
    if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }
    const matchStage = { tenantId };
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
        if (s.overdueCount > 0)
            paymentStatus = 'Overdue';
        else if (s.dueSoonCount > 0)
            paymentStatus = 'Due Soon';
        // Add risk flag if credit limit exceeded (e.g. > 90%)
        const isCreditRisk = s.creditLimit > 0 && s.totalOutstanding > s.creditLimit;
        return {
            ...s,
            paymentStatus,
            isCreditRisk
        };
    });
    res.status(200).json({ success: true, data: enrichedStats });
});
export const createSupplier = asyncHandler(async (req, res) => {
    const { businessName, contactPersonName, contactNo, email, physicalAddress, gstNo, panNo, supplierType, openingBalance, balanceType, creditPeriod, status, supplierGroup, groupId, defaultPaymentMode, isOneTime, bankAccounts } = req.body;
    const tenantId = req.user.tenantId?.toString();
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
        if (!isNaN(lastNum))
            nextId = lastNum + 1;
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
        owner: req.user._id
    });
    res.status(201).json({ success: true, data: supplier });
});
export const getSuppliers = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId?.toString();
    if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }
    const suppliers = await Supplier.find({ tenantId })
        .populate('groupId')
        .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: suppliers });
});
export const getSupplierById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId?.toString();
    // Dynamic Imports to avoid circular dependencies
    const { default: Bill } = await import('../../finance/models/Bill.js');
    const { default: PaymentOut } = await import('../models/PaymentOut.js');
    const { default: DebitNote } = await import('../models/DebitNote.js');
    const supplier = await Supplier.findOne({ _id: id, tenantId }).populate('groupId').lean();
    if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    // Calculate functionality metrics (Live Data)
    const s = supplier;
    const [billStats, paymentStats, debitNoteStats] = await Promise.all([
        Bill.aggregate([
            { $match: { supplier: s._id, tenantId, status: { $nin: ['draft', 'rejected', 'cancelled'] } } },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
        ]),
        PaymentOut.aggregate([
            { $match: { supplierId: s._id, tenantId, status: { $in: ['cleared', 'pending'] } } },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
        ]),
        DebitNote.aggregate([
            { $match: { vendorId: s._id, tenantId, status: 'APPROVED' } },
            { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
        ])
    ]);
    const totalInvoiced = (billStats[0]?.totalAmount || 0) + (s.manualTotalInvoiced || 0);
    const totalPaid = (paymentStats[0]?.totalAmount || 0) + (s.manualTotalPaid || 0);
    const totalDebitNotes = debitNoteStats[0]?.totalAmount || 0;
    const openingBalance = s.openingBalance || 0;
    // Net Balance = (Opening + Invoiced) - (Paid + DebitNotes)
    // Assuming standard payable context
    let netBalance = (openingBalance + totalInvoiced) - (totalPaid + totalDebitNotes);
    res.status(200).json({
        success: true,
        data: {
            ...supplier,
            totalAmount: totalInvoiced,
            totalPaid,
            netBalance,
            debitNoteTotal: totalDebitNotes,
            // Explicitly return manual fields for UI editing
            manualTotalInvoiced: s.manualTotalInvoiced || 0,
            manualTotalPaid: s.manualTotalPaid || 0
        }
    });
});
export const updateSupplier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId?.toString();
    let supplier = await Supplier.findOne({ _id: id, tenantId });
    if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    supplier = await Supplier.findOneAndUpdate({ _id: id, tenantId }, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: supplier });
});
export const deleteSupplier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId?.toString();
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
});
export const evaluateSupplierPerformance = asyncHandler(async (req, res) => {
    const { evaluateSupplier } = await import('../services/SupplierPerformanceService.js');
    const id = req.params.id;
    const metrics = await evaluateSupplier(id);
    res.json({ success: true, data: metrics });
});
export const getSupplierReports = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId?.toString();
    if (!tenantId)
        return res.status(401).json({ message: 'Unauthorized' });
    const { getPayablesOverview, getPurchaseTrends, getCashFlowForecast, getProfitabilityAnalysis, getOverdueList } = await import('../services/SupplierReportService.js');
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
});
export const getAgeingAnalysis = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId?.toString();
    if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { getSupplierAgeingReport } = await import('../services/SupplierAgeingService.js');
    const data = await getSupplierAgeingReport(tenantId);
    res.status(200).json({
        success: true,
        data
    });
});
export const bulkUpdateOpeningBalance = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId?.toString();
    if (!tenantId)
        return res.status(401).json({ message: 'Unauthorized' });
    const { updates } = req.body; // Array of { supplierName, openingBalance }
    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: 'Invalid updates format' });
    }
    const results = { updated: 0, failed: 0, errors: [] };
    for (const update of updates) {
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
        }
        else {
            results.failed++;
            results.errors.push(`Supplier not found: ${businessName}`);
        }
    }
    res.status(200).json({
        success: true,
        message: `Bulk update completed. Updated: ${results.updated}, Failed: ${results.failed}`,
        data: results
    });
});
export const getVendorInflowOutflow = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId?.toString();
    if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }
    const { startDate, endDate, supplierId } = req.query;
    // Build supplier match stage
    const supplierMatch = { tenantId };
    if (supplierId) {
        supplierMatch._id = new mongoose.Types.ObjectId(supplierId);
    }
    // Build date filter for bills and payments
    const billDateFilter = {};
    const paymentDateFilter = {};
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
    const totals = stats.reduce((acc, s) => ({
        totalInflow: acc.totalInflow + (s.totalInflow || 0),
        totalOutflow: acc.totalOutflow + (s.totalOutflow || 0),
        debitNoteTotal: acc.debitNoteTotal + (s.debitNoteTotal || 0),
        totalOpeningBalance: acc.totalOpeningBalance + (s.openingBalance || 0),
        totalClosingBalance: acc.totalClosingBalance + (s.closingBalance || 0),
        vendorCount: acc.vendorCount + 1
    }), { totalInflow: 0, totalOutflow: 0, debitNoteTotal: 0, totalOpeningBalance: 0, totalClosingBalance: 0, vendorCount: 0 });
    res.status(200).json({
        success: true,
        data: {
            vendors: stats,
            totals
        }
    });
});
export const getSupplierLedger = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId?.toString();
    const { id } = req.params;
    const { startDate, endDate } = req.query;
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
                supplier: new mongoose.Types.ObjectId(id),
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
                supplierId: new mongoose.Types.ObjectId(id),
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
                vendorId: new mongoose.Types.ObjectId(id),
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
    const transactions = [];
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
});
