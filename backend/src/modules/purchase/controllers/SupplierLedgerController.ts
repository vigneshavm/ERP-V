import { Response } from 'express';
import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';
import Bill from '../../finance/models/Bill.js';
import { sumPaymentOuts, listPaymentOutsInRange } from '../../../integrations/textilesoft/erpPaymentOut.js';
import { sumApprovedDebitNotes, listApprovedDebitNotesInRange } from '../../../integrations/textilesoft/erpDebitNote.js';
import PurchaseReturn from '../models/PurchaseReturn.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { error } from '../../../config/logger.js';

export const getSupplierLedger = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        // Authenticated user context
        const tenantId = req.tenantId.toString();

        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate as string) : new Date();
        // Ensure end date includes the full day
        end.setHours(23, 59, 59, 999);

        // 1. Fetch Supplier to get Initial Opening Balance
        const supplier = await Supplier.findOne({ _id: id, tenantId });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        // 2. Calculate "Effective Opening Balance" as of 'start' date
        // Formula: SupplierInitialOpening + (Bills < start) - (Payments < start) - (DebitNotes < start)

        const [preBills, prePaymentsTotal, preDebitNotesTotal] = await Promise.all([
            Bill.aggregate([
                {
                    $match: {
                        supplier: new mongoose.Types.ObjectId(id as string),
                        tenantId: tenantId,
                        date: { $lt: start },
                        status: { $nin: ['draft', 'rejected', 'cancelled'] }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } } // Using amount (Total Bill Value)
            ]),
            sumPaymentOuts(String(id), ['cleared', 'pending'], { before: start }),
            sumApprovedDebitNotes(String(id), { before: start }),
        ]);

        const totalPreBills = preBills[0]?.total || 0;
        const totalPrePayments = prePaymentsTotal;
        const totalPreDebitNotes = preDebitNotesTotal;

        const effectiveOpeningBalance = (supplier.openingBalance || 0) + totalPreBills - totalPrePayments - totalPreDebitNotes;

        // 3. Fetch Transactions within Range
        const [bills, payments, debitNotes] = await Promise.all([
            Bill.find({
                supplier: id,
                tenantId,
                date: { $gte: start, $lte: end },
                status: { $nin: ['draft', 'rejected', 'cancelled'] }
            }).lean(),
            listPaymentOutsInRange(String(id), ['cleared', 'pending'], start, end),
            listApprovedDebitNotesInRange(String(id), start, end)
        ]);

        // FETCH LINKED PURCHASE RETURNS
        const debitNoteIds = debitNotes.map(d => d._id);
        const purchaseReturns = await PurchaseReturn.find({
            debitNoteId: { $in: debitNoteIds },
            tenantId
        }).select('_id debitNoteId').lean();

        const dnToPrMap: Record<string, string> = {};
        purchaseReturns.forEach(pr => {
            if (pr.debitNoteId) dnToPrMap[String(pr.debitNoteId)] = pr._id.toString();
        });

        // 4. Transform and Merge
        const transactions: any[] = [];

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
            purchaseReturnId: dnToPrMap[String(d._id)] // Link to PR if exists
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

    } catch (err: any) {
        error(`Ledger Error: ${(err as Error).message}`, { stack: (err as Error).stack });
        res.status(500).json({ success: false, message: err.message });
    }
};
