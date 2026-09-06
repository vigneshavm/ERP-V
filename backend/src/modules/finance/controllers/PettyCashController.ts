import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import PettyCashClose, { IDenominationCounts, CASH_DENOMINATIONS } from '../models/PettyCashClose.js';
import Invoice from '../../sales/models/Invoice.js';
import Expense from '../../expense/models/Expense.js';
import { info, error as logError } from '../../../config/logger.js';

// Sums a denomination-count breakdown into a rupee total. Kept as a small pure function so it can
// be re-verified in a test without needing a live DB connection (mirrors the pure-logic test
// pattern already used for combo offer pricing / serialized unit validation).
export const computeCountedCash = (d: Partial<IDenominationCounts>): number => {
    const notesTotal = CASH_DENOMINATIONS.reduce((sum, denom) => {
        const key = `d${denom}` as keyof IDenominationCounts;
        return sum + denom * (Number(d[key]) || 0);
    }, 0);
    return notesTotal + (Number(d.coinsAmount) || 0);
};

const dayBounds = (dateStr: string) => {
    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

// Aggregates system-recorded sales for one payment-method family (cash/card/credit) over a day,
// covering both single-method invoices and split-payment line items -- same shape as the cash
// aggregation DayEndController already uses, extended to card/credit so the close screen can show
// what the system expects alongside what the cashier physically counts.
const sumInvoicesByMethod = async (tenantId: string, startDate: Date, endDate: Date, methods: string[]): Promise<number> => {
    const result = await Invoice.aggregate([
        {
            $match: {
                tenantId: new mongoose.Types.ObjectId(tenantId),
                createdAt: { $gte: startDate, $lte: endDate },
                $or: [
                    { paymentMethod: { $in: methods } },
                    { 'splitPaymentDetails.method': { $in: methods } },
                ],
            },
        },
        { $unwind: { path: '$splitPaymentDetails', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: null,
                total: {
                    $sum: {
                        $cond: [
                            { $in: ['$paymentMethod', methods] },
                            '$paidAmount',
                            { $cond: [{ $in: ['$splitPaymentDetails.method', methods] }, '$splitPaymentDetails.amount', 0] },
                        ],
                    },
                },
            },
        },
    ]);
    return result.length > 0 ? result[0].total : 0;
};

export const getPettyCashSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId as string;
        const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
        const counterId = (req.query.counterId as string) || 'MAIN';
        const { startDate, endDate } = dayBounds(dateStr);

        const lastClose = await PettyCashClose.findOne({ tenantId, counterId }).sort({ date: -1 });
        const openingCash = lastClose ? lastClose.countedCash : 0;

        const [cashSales, cardAmount, creditAmount, cashExpensesResult] = await Promise.all([
            sumInvoicesByMethod(tenantId, startDate, endDate, ['cash']),
            sumInvoicesByMethod(tenantId, startDate, endDate, ['card']),
            sumInvoicesByMethod(tenantId, startDate, endDate, ['credit', 'due']),
            Expense.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate }, paymentMethod: 'cash' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);
        const cashExpenses = cashExpensesResult.length > 0 ? cashExpensesResult[0].total : 0;
        const expectedCash = openingCash + cashSales - cashExpenses;

        res.status(200).json({
            date: dateStr,
            counterId,
            openingCash,
            cashSales,
            cashExpenses,
            expectedCash,
            cardAmount,
            creditAmount,
            denominations: CASH_DENOMINATIONS,
        });
    } catch (err) {
        logError(`Get Petty Cash Summary Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const createPettyCashClose = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId as string;
        const {
            date, counterId = 'MAIN', denominations,
            expectedCash, cardAmount, creditAmount,
            cancelledBillAmount, cancelledBillCount, notes,
        } = req.body;

        if (!date || !denominations) {
            res.status(400).json({ message: 'date and denominations are required' });
            return;
        }

        const countedCash = computeCountedCash(denominations);
        const variance = countedCash - (Number(expectedCash) || 0);

        const close = await PettyCashClose.findOneAndUpdate(
            { tenantId, date: new Date(new Date(date).setHours(0, 0, 0, 0)), counterId },
            {
                tenantId,
                date: new Date(date),
                counterId,
                denominations,
                countedCash,
                expectedCash: Number(expectedCash) || 0,
                cardAmount: Number(cardAmount) || 0,
                creditAmount: Number(creditAmount) || 0,
                cancelledBillAmount: Number(cancelledBillAmount) || 0,
                cancelledBillCount: Number(cancelledBillCount) || 0,
                variance,
                notes,
                performedBy: req.user?._id,
                status: 'COMPLETED',
            },
            { upsert: true, new: true }
        );

        info(`Petty cash close saved for ${date} (counter ${counterId}) by ${req.user?.name}`);
        res.status(201).json(close);
    } catch (err) {
        logError(`Create Petty Cash Close Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const getPettyCashHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId as string;
        const limit = Math.min(parseInt((req.query.limit as string) || '30', 10), 100);
        const history = await PettyCashClose.find({ tenantId })
            .sort({ date: -1 })
            .limit(limit)
            .populate('performedBy', 'name');
        res.status(200).json(history);
    } catch (err) {
        logError(`Get Petty Cash History Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

const PettyCashController = {
    getPettyCashSummary,
    createPettyCashClose,
    getPettyCashHistory,
};

export default PettyCashController;
