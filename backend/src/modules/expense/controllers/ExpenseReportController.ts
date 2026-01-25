import { Request, Response } from 'express';

import Expense from '../models/Expense.js';
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

        // Define fixed vs variable categories
        const fixedCategories = ['Rent', 'Salaries', 'Insurance', 'Utilities'];

        const by_category = Array.from(categoryMap.entries())
            .map(([category, data]) => ({
                category,
                amount: data.amount,
                percentage: total_expense > 0 ? `${Math.round((data.amount / total_expense) * 100)}%` : '0%',
                type: fixedCategories.includes(category) ? 'FIXED' : 'VARIABLE',
            }))
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

        // Branch analysis (placeholder)
        const by_branch = [
            { branch: 'Main Branch', amount: total_expense, risk: total_expense > 200000 ? 'HIGH' : 'LOW' }
        ];

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

        // Check for budget overruns in categories
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

        res.status(200).json({
            report_period,
            total_expense,
            by_category,
            by_branch,
            by_payment_mode,
            audit_flags,
            recommendations,
        });
    } catch (err) {
        error(`Get expense report failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    getExpenseReport,
};
