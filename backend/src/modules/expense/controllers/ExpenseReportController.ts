import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Expense from '../models/Expense.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import Invoice from '../../sales/models/Invoice.js';
import { error } from '../../../config/logger.js';

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
 * Category data interface
 */
interface CategoryData {
    amount: number;
    count: number;
}

/**
 * Witty nudge generator based on category and variance
 */
const getWittyNudge = (category: string, amount: number, budget: number): string => {
    const variancePercent = Math.round(((amount - budget) / budget) * 100);
    const categoryLower = category.toLowerCase();

    if (categoryLower.includes('food') || categoryLower.includes('refreshment')) {
        return `Your stomach is happy, but your wallet is crying. ₹${amount.toLocaleString()} on food? Easy on the Zomato! (${variancePercent}% over)`;
    }
    if (categoryLower.includes('transport') || categoryLower.includes('travel') || categoryLower.includes('uber')) {
        return `Are we auditioning for a world tour? The travel budget is ₹${budget.toLocaleString()}, not a suggestion! (${variancePercent}% over)`;
    }
    if (categoryLower.includes('utility') || categoryLower.includes('electricity') || categoryLower.includes('water')) {
        return `Is the office trying to become a glacier? Electricity treats budget like it's free. (${variancePercent}% over)`;
    }
    if (categoryLower.includes('office') || categoryLower.includes('supply') || categoryLower.includes('stationery')) {
        return `Building a spaceship or just buying more pens? Your stationery stack is getting expensive. (${variancePercent}% over)`;
    }
    if (categoryLower.includes('marketing') || categoryLower.includes('advertis')) {
        return `We're famous! But also broke. Marketing just blew past the ₹${budget.toLocaleString()} limit. (${variancePercent}% over)`;
    }

    return `Budget? What budget? ${category} is treating your wallet like an open buffet. (${variancePercent}% over)`;
};

/**
 * @desc Get expense report with aggregations
 * @route GET /api/expense-reports
 */
export const getExpenseReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const now = new Date();

        // Default to current month if no date range provided
        const startDate = req.query.startDate
            ? new Date(req.query.startDate as string)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = req.query.endDate
            ? new Date(req.query.endDate as string)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Get report period label
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const report_period = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;

        // Get all expenses for the period
        const expenses = await Expense.find({
            createdBy: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        // Calculate total expense
        const total_expense = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);

        // Aggregate by category
        const categoryMap = new Map<string, CategoryData>();
        for (const exp of expenses) {
            const cat = exp.category || 'Uncategorized';
            if (!categoryMap.has(cat)) {
                categoryMap.set(cat, { amount: 0, count: 0 });
            }
            const catData = categoryMap.get(cat)!;
            catData.amount += exp.amount || 0;
            catData.count += 1;
        }

        // Fetch categories with budgets
        const categoriesWithBudgets = await ExpenseCategory.find({ createdBy: userId });
        const budgetMap = new Map<string, number>();
        categoriesWithBudgets.forEach(cb => budgetMap.set(cb.name, cb.monthly_budget));

        // Define fixed vs variable categories
        const fixedCategories = ['Rent', 'Salaries', 'Insurance', 'Utilities'];

        const by_category = Array.from(categoryMap.entries())
            .map(([category, data]) => {
                const budget = budgetMap.get(category) || 0;
                const variance = budget > 0 ? data.amount - budget : 0;
                const variancePercentage = budget > 0 ? Math.round((variance / budget) * 100) : 0;

                return {
                    category,
                    amount: data.amount,
                    budget,
                    variance,
                    variancePercentage,
                    percentage: total_expense > 0 ? `${Math.round((data.amount / total_expense) * 100)}%` : '0%',
                    type: fixedCategories.includes(category) ? 'FIXED' : 'VARIABLE',
                    status: budget > 0 ? (data.amount > budget ? 'OVER' : 'UNDER') : 'NONE'
                };
            })
            .sort((a, b) => b.amount - a.amount);

        // Aggregate by payment method
        const paymentMap = new Map<string, number>();
        for (const exp of expenses) {
            const method = (exp.paymentMethod || 'cash').toUpperCase();
            if (!paymentMap.has(method)) {
                paymentMap.set(method, 0);
            }
            paymentMap.set(method, (paymentMap.get(method) || 0) + (exp.amount || 0));
        }

        const by_payment_mode = Array.from(paymentMap.entries())
            .map(([mode, amount]) => ({ mode, amount }))
            .sort((a, b) => b.amount - a.amount);

        // Expenses aren't recorded against a branch (the Expense model has no branch field), so there
        // is no per-branch breakdown to report; an invented single-branch row used to stand in here.
        const by_branch: { branch: string; amount: number; risk: string }[] = [];

        // Generate audit flags
        const audit_flags: string[] = [];

        // Check for expenses without descriptions
        const noDescriptionCount = expenses.filter((e: any) => !e.description).length;
        if (noDescriptionCount > 0) {
            const noDescTotal = expenses.filter((e: any) => !e.description)
                .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            audit_flags.push(`Missing descriptions for ${noDescriptionCount} transactions totaling ₹${noDescTotal.toLocaleString('en-IN')}`);
        }

        // Check for high cash usage
        const cashAmount = paymentMap.get('CASH') || 0;
        const cashPercentage = total_expense > 0 ? (cashAmount / total_expense) * 100 : 0;
        if (cashPercentage > 20) {
            audit_flags.push(`High cash usage detected: ${Math.round(cashPercentage)}% of expenses paid in cash`);
        }

        // Check for budget overruns with witty nudges
        for (const catData of by_category) {
            if (catData.budget > 0 && catData.amount > catData.budget) {
                audit_flags.push(getWittyNudge(catData.category, catData.amount, catData.budget));
            }
        }

        const rentExpense = categoryMap.get('Rent')?.amount || 0;
        const utilitiesExpense = categoryMap.get('Utilities')?.amount || 0;
        if (utilitiesExpense > rentExpense * 0.3 && rentExpense > 0) {
            audit_flags.push('Utilities expense is unusually high relative to rent');
        }

        // Generate recommendations
        const recommendations: string[] = [];

        if (cashPercentage > 20) {
            recommendations.push('Implement mandatory digital payment for expenses above ₹500 to improve tracking');
        }

        if (noDescriptionCount > 5) {
            recommendations.push('Require descriptions for all expense entries to improve audit trail');
        }

        // Check for optimization opportunities
        const transportExpense = categoryMap.get('Transportation')?.amount || 0;
        if (transportExpense > total_expense * 0.15) {
            recommendations.push('Review transportation expenses - consider corporate travel partnerships');
        }

        const marketingExpense = categoryMap.get('Marketing')?.amount || 0;
        if (marketingExpense > total_expense * 0.2) {
            recommendations.push('High marketing spend detected - evaluate ROI on campaigns');
        }

        // Add general recommendation if few specific ones
        if (recommendations.length < 2) {
            recommendations.push('Regularly review expense patterns to identify cost optimization opportunities');
        }

        // Monthly trends for the last 6 months (current month first).
        // income: invoiced sales for the user's tenant, the same definition the dashboard uses
        //   (sum of totalAmount over non-deleted invoices); null when there's no tenant to scope by.
        // budget_utilization: that month's spend as a % of the total monthly budget set on the
        //   expense categories; null when no budgets are set.
        const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const trendEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthKey = (y: number, m: number) => `${y}-${m}`;
        // Group in the server's time zone, the same one the month keys below are built in.
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const toObjectId = (id: unknown) => new mongoose.Types.ObjectId(String(id));
        const byMonth = (rows: { _id: { y: number; m: number }; total: number }[]) =>
            new Map(rows.map(r => [monthKey(r._id.y, r._id.m), r.total]));

        const expenseRows = await Expense.aggregate([
            { $match: { createdBy: toObjectId(userId), date: { $gte: trendStart, $lte: trendEnd } } },
            { $group: { _id: { y: { $year: { date: '$date', timezone } }, m: { $month: { date: '$date', timezone } } }, total: { $sum: '$amount' } } }
        ]);
        const tenantId = req.user?.tenantId;
        const incomeRows = tenantId
            ? await Invoice.aggregate([
                { $match: { tenantId: toObjectId(tenantId), isDeleted: { $ne: true }, createdAt: { $gte: trendStart, $lte: trendEnd } } },
                { $group: { _id: { y: { $year: { date: '$createdAt', timezone } }, m: { $month: { date: '$createdAt', timezone } } }, total: { $sum: '$totalAmount' } } }
            ])
            : null;
        const expenseByMonth = byMonth(expenseRows);
        const incomeByMonth = incomeRows ? byMonth(incomeRows) : null;
        const totalMonthlyBudget = categoriesWithBudgets.reduce((sum, c) => sum + (c.monthly_budget || 0), 0);

        const monthly_trends = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = monthKey(d.getFullYear(), d.getMonth() + 1);
            const mTotal = expenseByMonth.get(key) || 0;

            monthly_trends.push({
                month: monthNames[d.getMonth()],
                year: d.getFullYear(),
                expense: mTotal,
                income: incomeByMonth ? (incomeByMonth.get(key) || 0) : null,
                budget_utilization: totalMonthlyBudget > 0 ? Math.round((mTotal / totalMonthlyBudget) * 100) : null,
                budget: totalMonthlyBudget > 0 ? totalMonthlyBudget : null,
                label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`
            });
        }

        res.status(200).json({
            report_period,
            total_expense,
            by_category,
            by_branch,
            by_payment_mode,
            audit_flags,
            recommendations,
            monthly_trends,
        });
    } catch (err) {
        error(`Get expense report failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    getExpenseReport,
};
