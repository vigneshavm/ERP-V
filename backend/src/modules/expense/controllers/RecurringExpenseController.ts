import { Request, Response } from 'express';
import mongoose from 'mongoose';

import RecurringExpense from '../models/RecurringExpense.js';

import Expense from '../models/Expense.js';
import { info, error } from '../../../config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
}

interface BranchSummary {
    branch_name: string;
    total_monthly_fixed_cost: number;
    monthly_sales: number;
    expenses: any[];
}

interface UpcomingDue {
    category_name: string;
    vendor: string;
    amount: number;
    next_due_date: Date;
    status: string;
}

/**
 * Calculate intelligence metrics for recurring expenses
 */
const calculateIntelligence = async (recurringExpenses: any[], userId: string) => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate cash required in next 30 days
    let cashRequired30Days = 0;
    const upcomingDues: UpcomingDue[] = [];

    for (const expense of recurringExpenses) {
        const dueDate = new Date(expense.next_due);
        const isOverdue = dueDate < now;
        const isDueIn30Days = dueDate <= thirtyDaysLater;

        if (isOverdue || isDueIn30Days) {
            cashRequired30Days += expense.amount;
            upcomingDues.push({
                category_name: expense.category,
                vendor: expense.vendor || 'Unknown',
                amount: expense.amount,
                next_due_date: expense.next_due,
                status: isOverdue ? 'OVERDUE' : 'UPCOMING',
            });
        }
    }

    // Sort upcoming dues by date
    upcomingDues.sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime());

    // Group by branch and calculate summary
    const branchMap = new Map<string, BranchSummary>();
    for (const expense of recurringExpenses) {
        const branchName = expense.branch_name || 'Main Branch';
        if (!branchMap.has(branchName)) {
            branchMap.set(branchName, {
                branch_name: branchName,
                total_monthly_fixed_cost: 0,
                monthly_sales: 0, // Would come from sales data in production
                expenses: [],
            });
        }
        const branch = branchMap.get(branchName)!;

        // Convert to monthly amount based on frequency
        let monthlyAmount = expense.amount;
        if (expense.frequency === 'QUARTERLY') {
            monthlyAmount = expense.amount / 3;
        } else if (expense.frequency === 'YEARLY') {
            monthlyAmount = expense.amount / 12;
        }

        branch.total_monthly_fixed_cost += monthlyAmount;
        branch.expenses.push(expense);
    }

    // Fetch actual expense data for context
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    await Expense.aggregate([
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(userId),
                date: { $gte: startOfMonth }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    // Estimate monthly sales (placeholder - in production would come from sales data)
    const estimatedMonthlySales = 500000; // Default estimate

    const summaryByBranch = Array.from(branchMap.values()).map(branch => {
        // Assign proportional sales estimate
        const salesEstimate = Math.round(estimatedMonthlySales / branchMap.size);
        branch.monthly_sales = salesEstimate;

        const costRatio = Math.round((branch.total_monthly_fixed_cost / salesEstimate) * 100);
        let riskLevel = 'LOW';
        let recommended_action = 'Maintain current operations, healthy margin.';

        if (costRatio > 30) {
            riskLevel = 'HIGH';
            recommended_action = 'Review fixed costs, consider optimizing vendor contracts.';
        } else if (costRatio > 20) {
            riskLevel = 'MEDIUM';
            recommended_action = 'Monitor expenses, identify optimization opportunities.';
        }

        return {
            branch_name: branch.branch_name,
            total_monthly_fixed_cost: Math.round(branch.total_monthly_fixed_cost),
            monthly_sales: branch.monthly_sales,
            cost_ratio: `${costRatio}%`,
            risk_level: riskLevel,
            recommended_action,
        };
    });

    return {
        cashRequired30Days,
        summaryByBranch,
        upcomingDues: upcomingDues.slice(0, 10), // Limit to top 10
    };
};

/**
 * @desc Get all recurring expenses with intelligence
 * @route GET /api/recurring-expenses
 */
export const getAllRecurringExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const recurringExpenses = await RecurringExpense.find({
            createdBy: req.user?._id,
            is_active: true
        }).sort({ next_due: 1 });

        const intelligence = await calculateIntelligence(recurringExpenses, req.user?._id as string);

        // Transform for frontend compatibility
        const expenses = recurringExpenses.map((exp: any) => ({
            id: exp._id,
            category: exp.category,
            amount: exp.amount,
            frequency: exp.frequency,
            vendor: exp.vendor,
            next_due: exp.next_due,
            branch_id: exp.branch_id,
            branch_name: exp.branch_name,
            description: exp.description,
            type: exp.type || "expense",
            accountId: exp.accountId,
        }));

        res.status(200).json({ expenses, intelligence });
    } catch (err) {
        error(`Get all recurring expenses failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Create new recurring expense
 * @route POST /api/recurring-expenses
 */
export const createRecurringExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { category, amount, frequency, vendor, next_due, branch_id, branch_name, description, type, accountId } = req.body;

        if (!category || !amount || !next_due) {
            res.status(400).json({ message: 'Category, amount, and next due date are required' });
            return;
        }

        const expense = await RecurringExpense.create({
            category,
            amount,
            frequency: frequency || 'MONTHLY',
            vendor,
            next_due,
            branch_id,
            branch_name,
            description,
            type: type || "expense",
            accountId,
            createdBy: req.user?._id
        });

        info(`Created recurring expense: ${category} - ₹${amount}`);

        res.status(201).json({
            id: expense._id,
            category: expense.category,
            amount: expense.amount,
            frequency: expense.frequency,
            vendor: expense.vendor,
            next_due: expense.next_due,
            branch_id: expense.branch_id,
            branch_name: expense.branch_name,
            description: expense.description,
            type: expense.type,
            accountId: expense.accountId,
        });
    } catch (err) {
        error(`Create recurring expense failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Update recurring expense
 * @route PUT /api/recurring-expenses/:id
 */
export const updateRecurringExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid expense ID format' });
            return;
        }

        const expense = await RecurringExpense.findOne({
            _id: req.params.id,
            createdBy: req.user?._id
        });

        if (!expense) {
            res.status(404).json({ message: 'Recurring expense not found or unauthorized' });
            return;
        }

        const updatedExpense = await RecurringExpense.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedExpense) {
            res.status(404).json({ message: 'Recurring expense not found' });
            return;
        }

        info(`Updated recurring expense: ${updatedExpense.category}`);

        res.status(200).json({
            id: updatedExpense._id,
            category: updatedExpense.category,
            amount: updatedExpense.amount,
            frequency: updatedExpense.frequency,
            vendor: updatedExpense.vendor,
            next_due: updatedExpense.next_due,
            branch_id: updatedExpense.branch_id,
            branch_name: updatedExpense.branch_name,
            description: updatedExpense.description,
            type: updatedExpense.type,
            accountId: updatedExpense.accountId,
        });
    } catch (err) {
        error(`Update recurring expense failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Delete recurring expense
 * @route DELETE /api/recurring-expenses/:id
 */
export const deleteRecurringExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid expense ID format' });
            return;
        }

        const expense = await RecurringExpense.findOne({
            _id: req.params.id,
            createdBy: req.user?._id
        });

        if (!expense) {
            res.status(404).json({ message: 'Recurring expense not found or unauthorized' });
            return;
        }

        await expense.deleteOne();
        info(`Deleted recurring expense: ${expense.category}`);

        res.status(200).json({ message: 'Recurring expense deleted' });
    } catch (err) {
        error(`Delete recurring expense failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    getAllRecurringExpenses,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
};
