import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import DayEndReconciliation from '../models/DayEndReconciliation.js';
import Invoice from '../../sales/models/Invoice.js';
import Expense from '../../expense/models/Expense.js';
import Cheque from '../models/Cheque.js';
import Supplier from '../../purchase/models/Supplier.js';
import Bill from '../models/Bill.js';
import BankAccount from '../models/BankAccount.js';
import CashbankTransaction from '../models/CashbankTransaction.js';
import { info, error as logError } from '../../../config/logger.js';

export const getDayEndSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId;
        const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
        const startDate = new Date(dateStr);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateStr);
        endDate.setHours(23, 59, 59, 999);

        // 1. Cash Tally Calculation
        // Expected Cash = Opening Cash + Cash Sales - Cash Expenses

        // Fetch last reconciliation for Opening Cash
        const lastReconciliation = await DayEndReconciliation.findOne({ tenantId })
            .sort({ date: -1 });
        const openingCash = lastReconciliation ? lastReconciliation.physicalCash : 0;

        // Cash Sales
        const cashSalesResult = await Invoice.aggregate([
            {
                $match: {
                    tenantId: new mongoose.Types.ObjectId(tenantId as string),
                    createdAt: { $gte: startDate, $lte: endDate },
                    $or: [{ paymentMethod: 'cash' }, { 'splitPaymentDetails.method': 'cash' }]
                }
            },
            { $unwind: { path: '$splitPaymentDetails', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    totalCash: {
                        $sum: {
                            $cond: [
                                { $eq: ['$paymentMethod', 'cash'] },
                                '$paidAmount',
                                { $cond: [{ $eq: ['$splitPaymentDetails.method', 'cash'] }, '$splitPaymentDetails.amount', 0] }
                            ]
                        }
                    }
                }
            }
        ]);
        const cashSales = cashSalesResult.length > 0 ? cashSalesResult[0].totalCash : 0;

        // Cash Expenses
        const cashExpensesResult = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    paymentMethod: 'cash'
                    // Note: Expense model currently uses createdBy, might need tenantId if available
                }
            },
            {
                $group: {
                    _id: null,
                    totalCash: { $sum: '$amount' }
                }
            }
        ]);
        const cashExpenses = cashExpensesResult.length > 0 ? cashExpensesResult[0].totalCash : 0;

        const expectedCash = openingCash + cashSales - cashExpenses;

        // 2. Pending Cheques
        const pendingCheques = await Cheque.find({
            tenantId,
            status: 'PENDING',
            date: { $lte: endDate }
        }).sort({ date: 1 });

        // 3. Supplier Limit Review
        // Suppliers whose "Credit Limit" resets tomorrow or who have hit their credit ceiling.
        // For simplicity, we fetch suppliers where outstanding balance is > 80% of limit
        const suppliers = await Supplier.find({ tenantId });
        const supplierAlerts = [];

        for (const supplier of suppliers) {
            // Calculate outstanding balance from Bills
            const unpaidBills = await Bill.aggregate([
                { $match: { supplier: supplier._id, status: 'unpaid' } },
                { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
            ]);
            const balance = unpaidBills.length > 0 ? unpaidBills[0].total : 0;

            // Assume supplier has creditLimit field (based on SupplierGroup link or direct)
            // If creditLimit is 0/undefined, it might be in SupplierGroup
            const creditLimit = (supplier as any).creditLimit || 0;

            if (creditLimit > 0 && balance >= creditLimit * 0.8) {
                supplierAlerts.push({
                    supplierId: supplier._id,
                    businessName: supplier.businessName,
                    balance,
                    creditLimit,
                    percentage: (balance / creditLimit) * 100
                });
            }
        }

        res.status(200).json({
            openingCash,
            cashSales,
            cashExpenses,
            expectedCash,
            pendingCheques,
            supplierAlerts
        });
    } catch (err) {
        logError(`Get Day End Summary Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const saveDayEndReconciliation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId;
        const {
            date, openingCash, cashSales, cashExpenses, expectedCash,
            physicalCash, variance, clearedChequeIds, notes
        } = req.body;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Save Reconciliation record
            const recon = await DayEndReconciliation.findOneAndUpdate(
                { tenantId, date: new Date(date).setHours(0, 0, 0, 0) },
                {
                    tenantId,
                    date: new Date(date),
                    openingCash,
                    cashSales,
                    cashExpenses,
                    expectedCash,
                    physicalCash,
                    variance,
                    notes,
                    performedBy: req.user?._id,
                    clearedChequesCount: clearedChequeIds?.length || 0,
                    status: 'COMPLETED'
                },
                { upsert: true, new: true, session }
            );

            // 2. Clear Cheques and update Bank Balances
            if (clearedChequeIds && clearedChequeIds.length > 0) {
                for (const chequeId of clearedChequeIds) {
                    const cheque = await Cheque.findOne({ _id: chequeId, tenantId }).session(session);
                    if (cheque && cheque.status !== 'CLEARED') {
                        cheque.status = 'CLEARED';
                        await cheque.save({ session });

                        // Create Bank Transaction
                        const transaction = await CashbankTransaction.create([{
                            type: cheque.type === 'RECEIVED' ? 'in' : 'out',
                            amount: cheque.amount,
                            fromAccount: cheque.type === 'RECEIVED' ? 'External' : cheque.accountId,
                            toAccount: cheque.type === 'RECEIVED' ? cheque.accountId : 'External',
                            description: `Cheque Cleared (Day End): ${cheque.number}`,
                            reference: cheque.number,
                            date: new Date(),
                            userId: req.user?._id,
                        }], { session });

                        // Update Bank Account Balance
                        await BankAccount.findByIdAndUpdate(cheque.accountId, {
                            $inc: { currentBalance: cheque.type === 'RECEIVED' ? cheque.amount : -cheque.amount },
                            $push: { transactions: transaction[0]._id }
                        }).session(session);
                    }
                }
            }

            await session.commitTransaction();
            info(`Day End Reconciliation saved for ${date} by ${req.user?.name}`);
            res.status(201).json(recon);
        } catch (innerErr) {
            await session.abortTransaction();
            throw innerErr;
        } finally {
            session.endSession();
        }
    } catch (err) {
        logError(`Save Day End Reconciliation Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

const DayEndController = {
    getDayEndSummary,
    saveDayEndReconciliation
};

export default DayEndController;
