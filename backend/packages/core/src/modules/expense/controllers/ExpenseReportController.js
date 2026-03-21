import Expense from '../models/Expense.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import User from '@smarterp/core/modules/core/models/User.js';
import { FinancialPeriod } from '@smarterp/shared/utils/FinancialPeriod.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
/**
 * Witty nudge generator based on category and variance
 */
const getWittyNudge = (category, amount, budget) => {
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
export const getExpenseReport = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();
    // Default to current month if no date range provided
    let startDate;
    let endDate;
    if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate);
        endDate = new Date(req.query.endDate);
    }
    else {
        // Get user preference for month start
        const user = await User.findById(userId);
        const monthStartDay = user?.personalFinanceSettings?.monthStartDay || 1;
        const period = FinancialPeriod.getPeriod(now, monthStartDay);
        startDate = period.startDate;
        endDate = period.endDate;
    }
    // Get report period label
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const report_period = startDate.getDate() === 1 && endDate.getDate() >= 28
        ? `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`
        : `${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    // Get all expenses for the period
    const expenses = await Expense.find({
        createdBy: userId,
        date: { $gte: startDate, $lte: endDate }
    });
    // Calculate total expense
    const total_expense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    // Aggregate by category
    const categoryMap = new Map();
    for (const exp of expenses) {
        const cat = exp.category || 'Uncategorized';
        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { amount: 0, count: 0 });
        }
        const catData = categoryMap.get(cat);
        catData.amount += exp.amount || 0;
        catData.count += 1;
    }
    // Fetch categories with budgets
    const categoriesWithBudgets = await ExpenseCategory.find({ createdBy: userId });
    const budgetMap = new Map();
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
    const paymentMap = new Map();
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
    // Branch analysis (placeholder)
    const by_branch = [
        { branch: 'Main Branch', amount: total_expense, risk: total_expense > 200000 ? 'HIGH' : 'LOW' }
    ];
    // Generate audit flags
    const audit_flags = [];
    // Check for expenses without descriptions
    const noDescriptionCount = expenses.filter((e) => !e.description).length;
    if (noDescriptionCount > 0) {
        const noDescTotal = expenses.filter((e) => !e.description)
            .reduce((sum, e) => sum + (e.amount || 0), 0);
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
    const recommendations = [];
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
    // Calculate monthly trends for the last 6 periods
    const user = await User.findById(userId);
    const monthStartDay = user?.personalFinanceSettings?.monthStartDay || 1;
    const recentPeriods = FinancialPeriod.getRecentPeriods(6, monthStartDay);
    const monthly_trends = [];
    for (const period of recentPeriods) {
        const mExpenses = await Expense.find({
            createdBy: userId,
            date: { $gte: period.startDate, $lte: period.endDate }
        });
        const mTotal = mExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const mIncome = mTotal * 1.5; // Mock income for visual consistency
        monthly_trends.push({
            month: monthNames[period.startDate.getMonth()],
            year: period.startDate.getFullYear(),
            expense: mTotal,
            income: mIncome,
            budget_utilization: 75,
            label: period.label
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
});
/**
 * @desc Get stats for statistics page
 * @route GET /api/expenses/expense-reports/stats
 */
export const getStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await Expense.find({
        createdBy: userId,
        date: { $gte: startOfMonth }
    });
    const categories = await ExpenseCategory.find({ createdBy: userId });
    const barData = categories.map(cat => {
        const spent = expenses
            .filter(e => e.category === cat.name)
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        return {
            name: cat.name,
            expense: spent,
            limit: cat.monthly_budget
        };
    });
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalBudget = categories.reduce((sum, c) => sum + (c.monthly_budget || 0), 0);
    res.status(200).json({
        stats: {
            barData,
            remainingBudget: Math.max(0, totalBudget - totalSpent)
        },
        categories
    });
});
/**
 * @desc Get history for history page
 * @route GET /api/expenses/history
 */
export const getHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await Expense.find({
        createdBy: userId,
        date: { $gte: startOfMonth }
    }).sort({ date: -1 });
    const categorySummary = await Expense.aggregate([
        { $match: { createdBy: userId, date: { $gte: startOfMonth } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ]);
    const paymentSummary = await Expense.aggregate([
        { $match: { createdBy: userId, date: { $gte: startOfMonth } } },
        { $group: { _id: { $toUpper: "$paymentMethod" }, total: { $sum: "$amount" } } }
    ]);
    const dailyTrend = await Expense.aggregate([
        { $match: { createdBy: userId, date: { $gte: startOfMonth } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                amount: { $sum: "$amount" }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    res.status(200).json({
        totalSpent: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        month: now.toLocaleString('default', { month: 'long' }),
        categories: categorySummary.map(c => ({ name: c._id || 'Other', value: c.total, color: '#4F46E5' })),
        paymentMethods: paymentSummary.map(p => ({ name: p._id || 'CASH', value: p.total, color: '#10B981' })),
        dailyTrend: dailyTrend.map(d => ({ day: d._id, amount: d.amount }))
    });
});
export default {
    getExpenseReport,
    getStats,
    getHistory
};
