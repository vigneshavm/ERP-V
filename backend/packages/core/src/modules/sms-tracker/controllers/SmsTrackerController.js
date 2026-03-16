import mongoose from 'mongoose';
import SmsTransaction from '../models/SmsTransaction.js';
import { SmsParserService } from '../services/SmsParserService.js';
import Expense from '@smarterp/core/modules/expense/models/Expense.js';
import BankAccount from '@smarterp/core/modules/finance/models/BankAccount.js';
import CashbankTransaction from '@smarterp/core/modules/finance/models/CashbankTransaction.js';
import { error } from '@smarterp/shared/config/logger.js';
export const receiveSms = async (req, res) => {
    try {
        const { text, sender } = req.body;
        if (!text || !sender) {
            res.status(400).json({ message: 'Text and sender are required' });
            return;
        }
        const parsedData = SmsParserService.parse(text, sender);
        const smsTxn = await SmsTransaction.create({
            rawText: text,
            sender,
            parsedData,
            userId: req.user?._id,
            tenantId: req.tenantId,
            status: 'pending'
        });
        res.status(201).json(smsTxn);
    }
    catch (err) {
        error(`Receive SMS Error: ${err.message}`);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
export const getSmsTransactions = async (req, res) => {
    try {
        const transactions = await SmsTransaction.find({
            userId: req.user?._id,
            status: { $ne: 'ignored' }
        }).sort({ createdAt: -1 });
        res.status(200).json(transactions);
    }
    catch (err) {
        error(`Get SMS Transactions Error: ${err.message}`);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
export const convertToExpense = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { category, description, expenseNo } = req.body;
        const smsTxn = await SmsTransaction.findOne({ _id: id, userId: req.user?._id }).session(session);
        if (!smsTxn) {
            res.status(404).json({ message: 'SMS transaction not found' });
            return;
        }
        if (smsTxn.status === 'converted') {
            res.status(400).json({ message: 'Already converted' });
            return;
        }
        // Try to find matching bank account
        const bankAccount = await BankAccount.findOne({
            userId: req.user?._id,
            accountNumber: { $regex: smsTxn.parsedData.accountNumber + '$' }
        }).session(session);
        const amount = smsTxn.parsedData.amount;
        const expense = await Expense.create([{
                expenseNo: expenseNo || `SMS-${Date.now()}`,
                date: smsTxn.parsedData.date || new Date(),
                category: category || 'Miscellaneous',
                amount: amount,
                paymentMethod: bankAccount ? 'bank_transfer' : 'cash',
                bankAccount: bankAccount ? bankAccount._id : null,
                description: description || smsTxn.parsedData.merchant || smsTxn.rawText,
                createdBy: req.user?._id
            }], { session });
        // Update bank balance if applicable (following ExpenseController logic)
        if (bankAccount) {
            const cashbankTxn = await CashbankTransaction.create([{
                    type: 'out',
                    amount,
                    fromAccount: bankAccount._id,
                    toAccount: 'expense',
                    description: `SMS Expense: ${category} - ${description || smsTxn.rawText}`,
                    date: smsTxn.parsedData.date || new Date(),
                    userId: req.user?._id,
                }], { session });
            await BankAccount.updateOne({ _id: bankAccount._id }, {
                $inc: { currentBalance: -amount },
                $push: { transactions: cashbankTxn[0]._id }
            }).session(session);
        }
        smsTxn.status = 'converted';
        smsTxn.expenseId = expense[0]._id;
        await smsTxn.save({ session });
        await session.commitTransaction();
        res.status(200).json({ message: 'Converted successfully', expense: expense[0] });
    }
    catch (err) {
        await session.abortTransaction();
        error(`Convert SMS to Expense Error: ${err.message}`);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
    finally {
        session.endSession();
    }
};
export const ignoreSms = async (req, res) => {
    try {
        const { id } = req.params;
        const smsTxn = await SmsTransaction.findOneAndUpdate({ _id: id, userId: req.user?._id }, { status: 'ignored' }, { new: true });
        if (!smsTxn) {
            res.status(404).json({ message: 'SMS transaction not found' });
            return;
        }
        res.status(200).json({ message: 'SMS ignored' });
    }
    catch (err) {
        error(`Ignore SMS Error: ${err.message}`);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
export default {
    receiveSms,
    getSmsTransactions,
    convertToExpense,
    ignoreSms
};
