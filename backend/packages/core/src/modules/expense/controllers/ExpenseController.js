import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import CashbankTransaction from '@smarterp/core/modules/finance/models/CashbankTransaction.js';
import BankAccount from '@smarterp/core/modules/finance/models/BankAccount.js';
import { info } from '@smarterp/shared/config/logger.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';
import { parsePagination, parseSort } from '@smarterp/shared/utils/pagination.js';
import { requireUserId } from '@smarterp/shared/utils/tenantContext.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
const validId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError('Invalid ID format', 400);
    return id;
};
export const getAllExpenses = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const { page, limit } = parsePagination(req.query, 50);
    const sort = parseSort(req.query.sort, '-date');
    const [expenses, total] = await Promise.all([
        Expense.find({ createdBy: userId }).sort(sort).skip((page - 1) * limit).limit(limit),
        Expense.countDocuments({ createdBy: userId }),
    ]);
    paginated(res, expenses, total, page, limit);
});
export const createExpense = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const { expenseNo, date, category, amount, paymentMethod, description, receipt, bankAccount } = req.body;
    if (!expenseNo || !date || !category || !amount)
        throw new AppError('Expense number, date, category, and amount are required', 400);
    const dup = await Expense.exists({ expenseNo, createdBy: userId });
    if (dup)
        throw new AppError('Expense number already exists', 400);
    if (paymentMethod === 'bank_transfer' && bankAccount) {
        const bankAcc = await BankAccount.findOne({ _id: bankAccount, userId });
        if (!bankAcc)
            throw new AppError('Bank account not found', 400);
        if (bankAcc.currentBalance < amount)
            throw new AppError(`Insufficient balance. Available: ₹${bankAcc.currentBalance}`, 400);
    }
    const expense = await Expense.create({
        expenseNo, date, category, amount,
        paymentMethod: paymentMethod || 'cash',
        description, receipt,
        bankAccount: bankAccount || null,
        createdBy: userId,
    });
    if (paymentMethod === 'bank_transfer' && bankAccount) {
        const txn = await CashbankTransaction.create({
            type: 'out', amount, fromAccount: bankAccount, toAccount: 'expense',
            description: `Expense: ${category} - ${description || expenseNo}`,
            date: new Date(), userId,
        });
        await BankAccount.updateOne({ _id: bankAccount, userId }, { $inc: { currentBalance: -amount }, $push: { transactions: txn._id } });
        info(`Bank payment for expense ${expenseNo}: -₹${amount}`);
    }
    else if (paymentMethod === 'cash') {
        await CashbankTransaction.create({
            type: 'out', amount, fromAccount: 'cash', toAccount: 'expense',
            description: `Cash expense: ${category} - ${description || expenseNo}`,
            date: new Date(), userId,
        });
        info(`Cash payment for expense ${expenseNo}: -₹${amount}`);
    }
    created(res, expense);
});
export const getExpenseById = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const id = validId(req.params.id);
    const expense = await Expense.findOne({ _id: id, createdBy: userId });
    if (!expense)
        throw new AppError('Expense not found or unauthorized', 404);
    ok(res, expense);
});
export const updateExpense = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const id = validId(req.params.id);
    const expense = await Expense.findOne({ _id: id, createdBy: userId });
    if (!expense)
        throw new AppError('Expense not found or unauthorized', 404);
    if (req.body.expenseNo && req.body.expenseNo !== expense.expenseNo) {
        const dup = await Expense.exists({ expenseNo: req.body.expenseNo, createdBy: userId, _id: { $ne: id } });
        if (dup)
            throw new AppError('Expense number already exists', 400);
    }
    if (req.body.bankAccount === '')
        req.body.bankAccount = undefined;
    const updated = await Expense.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    ok(res, updated);
});
export const deleteExpense = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const id = validId(req.params.id);
    const expense = await Expense.findOne({ _id: id, createdBy: userId });
    if (!expense)
        throw new AppError('Expense not found or unauthorized', 404);
    await expense.deleteOne();
    ok(res, null, 'Expense deleted');
});
export const getExpenseSummary = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId)
        throw new AppError('Tenant context missing', 400);
    const { year, month } = req.query;
    const match = { tenantId: new mongoose.Types.ObjectId(tenantId) };
    if (year) {
        const y = parseInt(year);
        match.date = {
            $gte: new Date(y, month ? parseInt(month) - 1 : 0, 1),
            $lte: new Date(y, month ? parseInt(month) : 12, 0, 23, 59, 59),
        };
    }
    const summary = await Expense.aggregate([
        { $match: match },
        { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $project: { category: '$_id', totalAmount: 1, count: 1, _id: 0 } },
    ]);
    ok(res, summary);
});
export const approveExpense = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId)
        throw new AppError('Tenant context missing', 400);
    const expense = await Expense.findOneAndUpdate({ _id: req.params.id, tenantId }, { status: 'approved' }, { new: true });
    if (!expense)
        throw new AppError('Expense not found', 404);
    ok(res, expense, 'Expense approved');
});
export default { getAllExpenses, createExpense, getExpenseById, updateExpense, deleteExpense, getExpenseSummary, approveExpense };
