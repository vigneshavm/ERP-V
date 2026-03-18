import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Expense from '../models/Expense.js';

import CashbankTransaction from '@smarterp/core/modules/finance/models/CashbankTransaction.js';
import BankAccount from '@smarterp/core/modules/finance/models/BankAccount.js';
import { info, error } from '@smarterp/shared/config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        [key: string]: any;
    };
}

/**
 * @desc Get all expenses (only for current owner)
 * @route GET /api/expenses
 */
export const getAllExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 50, sort = '-date' } = req.query;
        const pageSize = Number(limit);
        const skip = (Number(page) - 1) * pageSize;

        // Handle sort
        const sortField = String(sort).startsWith('-') ? String(sort).substring(1) : String(sort);
        const sortOrder = String(sort).startsWith('-') ? -1 : 1;
        const sortObj: any = {};
        sortObj[sortField] = sortOrder;

        const match = { createdBy: req.user?._id };

        const expenses = await Expense.find(match)
            .sort(sortObj)
            .skip(skip)
            .limit(pageSize);

        const total = await Expense.countDocuments(match);

        res.status(200).json({
            success: true,
            data: expenses,
            pagination: {
                total,
                page: Number(page),
                limit: pageSize,
                pages: Math.ceil(total / pageSize)
            }
        });
    } catch (err) {
        error(`Get all expenses failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Create new expense
 * @route POST /api/expenses
 */
export const createExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { expenseNo, date, category, amount, paymentMethod, description, receipt, bankAccount } = req.body;

        if (!expenseNo || !date || !category || !amount) {
            res.status(400).json({ message: 'Expense number, date, category, and amount are required' });
            return;
        }

        // Check for duplicate expenseNo within this owner's expenses
        const existingExpense = await Expense.findOne({
            expenseNo,
            createdBy: req.user?._id
        });

        if (existingExpense) {
            res.status(400).json({ message: 'Expense number already exists' });
            return;
        }

        // Validate bank payment
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: bankAccount, userId: req.user?._id });
            if (!bankAcc) {
                res.status(400).json({ message: 'Bank account not found' });
                return;
            }

            if (bankAcc.currentBalance < amount) {
                res.status(400).json({
                    message: `Insufficient balance. Available: ₹${bankAcc.currentBalance}`
                });
                return;
            }
        }

        const expense = await Expense.create({
            expenseNo,
            date,
            category,
            amount,
            paymentMethod: paymentMethod || 'cash',
            description,
            receipt,
            bankAccount: bankAccount || null,
            createdBy: req.user?._id
        });

        // Handle bank payment
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            // Create cashbank transaction (money OUT)
            const cashbankTxn = await CashbankTransaction.create({
                type: 'out',
                amount,
                fromAccount: bankAccount,
                toAccount: 'expense',
                description: `Expense: ${category} - ${description || expenseNo}`,
                date: new Date(),
                userId: req.user?._id,
            });

            // Update bank balance (deduct)
            await BankAccount.updateOne(
                { _id: bankAccount, userId: req.user?._id },
                {
                    $inc: { currentBalance: -amount },
                    $push: { transactions: cashbankTxn._id }
                }
            );

            info(`Bank payment for expense ${expenseNo}: -₹${amount} from account ${bankAccount}`);
        } else if (paymentMethod === 'cash') {
            // Record cash expense transaction
            await CashbankTransaction.create({
                type: 'out',
                amount,
                fromAccount: 'cash',
                toAccount: 'expense',
                description: `Cash expense: ${category} - ${description || expenseNo}`,
                date: new Date(),
                userId: req.user?._id,
            });

            info(`Cash payment for expense ${expenseNo}: -₹${amount}`);
        }

        res.status(201).json(expense);
    } catch (err) {
        error(`Create expense failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Get single expense
 * @route GET /api/expenses/:id
 */
export const getExpenseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid expense ID format' });
            return;
        }

        const expense = await Expense.findOne({
            _id: req.params.id,
            createdBy: req.user?._id
        });

        if (!expense) {
            res.status(404).json({ message: 'Expense not found or unauthorized' });
            return;
        }

        res.status(200).json(expense);
    } catch (err) {
        error(`Get expense by ID failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Update expense
 * @route PUT /api/expenses/:id
 */
export const updateExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid expense ID format' });
            return;
        }

        // First check if expense belongs to this user
        const expense = await Expense.findOne({
            _id: req.params.id,
            createdBy: req.user?._id
        });

        if (!expense) {
            res.status(404).json({ message: 'Expense not found or unauthorized' });
            return;
        }

        // Check for duplicate expenseNo if being updated
        if (req.body.expenseNo && req.body.expenseNo !== expense.expenseNo) {
            const existingExpense = await Expense.findOne({
                expenseNo: req.body.expenseNo,
                createdBy: req.user?._id,
                _id: { $ne: req.params.id }
            });

            if (existingExpense) {
                res.status(400).json({ message: 'Expense number already exists' });
                return;
            }
        }

        // Sanitize bankAccount if provided as empty string
        if (req.body.bankAccount === '') {
            req.body.bankAccount = undefined;
        }

        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedExpense);
    } catch (err) {
        error(`Update expense failed: ${(err as Error).stack || (err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Delete expense
 * @route DELETE /api/expenses/:id
 */
export const deleteExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid expense ID format' });
            return;
        }

        const expense = await Expense.findOne({
            _id: req.params.id,
            createdBy: req.user?._id
        });

        if (!expense) {
            res.status(404).json({ message: 'Expense not found or unauthorized' });
            return;
        }

        await expense.deleteOne();
        res.status(200).json({ message: 'Expense deleted' });
    } catch (err) {
        error(`Delete expense failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Get expense summary by category
 * @route GET /api/expenses/summary
 */
export const getExpenseSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { year, month } = req.query;
        const tenantId = (req as any).tenantId;

        const match: any = { tenantId: new mongoose.Types.ObjectId(tenantId as string) };

        if (year) {
            const y = parseInt(year as string);
            const start = new Date(y, month ? parseInt(month as string) - 1 : 0, 1);
            const end = new Date(y, month ? parseInt(month as string) : 12, 0, 23, 59, 59);
            match.date = { $gte: start, $lte: end };
        }

        const summary = await Expense.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: "$_id",
                    totalAmount: 1,
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json(summary);
    } catch (err) {
        error(`Get expense summary failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Approve an expense
 * @route POST /api/expenses/:id/approve
 */
export const approveExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, tenantId: (req as any).tenantId },
            { status: 'approved' },
            { new: true }
        );

        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }

        res.status(200).json(expense);
    } catch (err) {
        error(`Approve expense failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    getAllExpenses,
    createExpense,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
    approveExpense
};
