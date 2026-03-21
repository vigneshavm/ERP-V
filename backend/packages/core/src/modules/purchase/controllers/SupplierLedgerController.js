import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';
import Bill from '@smarterp/core/modules/finance/models/Bill.js';
import PaymentOut from '../models/PaymentOut.js';
import DebitNote from '../models/DebitNote.js';
import PurchaseReturn from '../models/PurchaseReturn.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
export const getSupplierLedger = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    // Authenticated user context
    const tenantId = req.user.tenantId?.toString();
    if (!tenantId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    // Ensure end date includes the full day
    end.setHours(23, 59, 59, 999);
    // 1. Fetch Supplier to get Initial Opening Balance
    const supplier = await Supplier.findOne({ _id: id, tenantId });
    if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    // 2. Calculate "Effective Opening Balance" as of 'start' date
    // Formula: SupplierInitialOpening + (Bills < start) - (Payments < start) - (DebitNotes < start)
    const [preBills, prePayments, preDebitNotes] = await Promise.all([
        Bill.aggregate([
            {
                $match: {
                    supplier: new mongoose.Types.ObjectId(id),
                    tenantId: tenantId,
                    date: { $lt: start },
                    status: { $nin: ['draft', 'rejected', 'cancelled'] }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } } // Using amount (Total Bill Value)
        ]),
        PaymentOut.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(id),
                    tenantId: tenantId,
                    paymentDate: { $lt: start },
                    // Only cleared payments count? Or all? Usually cleared/issued. 
                    // Ledger usually strictly financial, so cleared.
                    // However, issued cheques block funds. Let's stick to 'cleared' for true ledger,
                    // or maybe 'cleared' + 'pending' if we want to show committed.
                    // Standard accounting: Checks issued are credits.
                    // Let's include 'cleared' and 'pending' (issued but not cleared) as credits to bank / debits to supplier?
                    // Actually PaymentOut status: 'pending' (Cheque issued).
                    // Ideally, when cheque is issued, we debit Supplier. So 'cleared' and 'pending'.
                    status: { $in: ['cleared', 'pending'] }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        DebitNote.aggregate([
            {
                $match: {
                    vendorId: new mongoose.Types.ObjectId(id),
                    // tenantId? DebitNote has vendorId. CreatedBy has tenant context. 
                    // For safety, we can filter by vendorId which is unique to tenant+supplier usually, 
                    // but safer to filter by date only if we trust ID.
                    date: { $lt: start },
                    status: 'APPROVED'
                }
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
    ]);
    const totalPreBills = preBills[0]?.total || 0;
    const totalPrePayments = prePayments[0]?.total || 0;
    const totalPreDebitNotes = preDebitNotes[0]?.total || 0;
    const effectiveOpeningBalance = (supplier.openingBalance || 0) + totalPreBills - totalPrePayments - totalPreDebitNotes;
    // 3. Fetch Transactions within Range
    const [bills, payments, debitNotes] = await Promise.all([
        Bill.find({
            supplier: id,
            tenantId,
            date: { $gte: start, $lte: end },
            status: { $nin: ['draft', 'rejected', 'cancelled'] }
        }).lean(),
        PaymentOut.find({
            supplierId: id,
            tenantId,
            paymentDate: { $gte: start, $lte: end },
            status: { $in: ['cleared', 'pending'] }
        }).lean(),
        DebitNote.find({
            vendorId: id,
            date: { $gte: start, $lte: end },
            status: 'APPROVED'
        }).lean()
    ]);
    // FETCH LINKED PURCHASE RETURNS
    const debitNoteIds = debitNotes.map(d => d._id);
    const purchaseReturns = await PurchaseReturn.find({
        debitNoteId: { $in: debitNoteIds },
        tenantId
    }).select('_id debitNoteId').lean();
    const dnToPrMap = {};
    purchaseReturns.forEach(pr => {
        if (pr.debitNoteId)
            dnToPrMap[pr.debitNoteId.toString()] = pr._id.toString();
    });
    // 4. Transform and Merge
    let transactions = [];
    bills.forEach(b => transactions.push({
        date: b.date,
        type: 'BILL',
        refNo: b.billNo,
        description: `Bill #${b.billNo}`,
        credit: b.amount, // Payload (Liability increases)
        debit: 0,
        originalRef: b
    }));
    payments.forEach(p => transactions.push({
        date: p.paymentDate,
        type: 'PAYMENT',
        refNo: p.paymentNo,
        description: `Payment (${p.paymentMode}) - ${p.referenceNo || ''}`,
        credit: 0,
        debit: p.amount, // Payment reduces liability
        originalRef: p
    }));
    debitNotes.forEach(d => transactions.push({
        date: d.date,
        type: 'DEBIT_NOTE',
        refNo: d.noteId,
        description: `Debit Note (${d.reason})`,
        credit: 0,
        debit: d.totalAmount, // Reduces liability
        originalRef: d,
        purchaseReturnId: dnToPrMap[d._id.toString()] // Link to PR if exists
    }));
    // Sort Chronologically
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // 5. Compute Running Balance
    let runningBalance = effectiveOpeningBalance;
    const timeline = transactions.map(t => {
        // Payable Logic: Balance = Credits - Debits
        // If runningBalance is Credit (Positive for Payable), then Bill adds, Payment subtracts.
        runningBalance = runningBalance + t.credit - t.debit;
        return {
            ...t,
            balance: runningBalance
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
            period: { start, end },
            openingBalance: effectiveOpeningBalance,
            closingBalance: runningBalance,
            totals: {
                credit: bills.reduce((sum, b) => sum + b.amount, 0),
                debit: payments.reduce((sum, p) => sum + p.amount, 0) + debitNotes.reduce((sum, d) => sum + d.totalAmount, 0)
            },
            transactions: timeline
        }
    });
});
