import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useExpenses } from './useExpenses';
import { useExpenseCategories } from './useExpenseCategories';

export interface ExpenseReportStats {
    total_expense: number;
    report_period: string;
    by_category: {
        category: string;
        amount: number;
        percentage: string;
        type: 'FIXED' | 'VARIABLE';
    }[];
    by_branch: {
        branch: string;
        amount: number;
        risk: 'NORMAL' | 'HIGH';
    }[];
    by_payment_mode: {
        mode: string;
        amount: number;
    }[];
    audit_flags: string[];
    recommendations: string[];
}

export const useExpenseReports = (filters?: { dateRange?: { from: string, to: string }, branchId?: string }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { expenses, loading: expensesLoading } = useExpenses();
    const { categories, loading: categoriesLoading } = useExpenseCategories();

    const [report, setReport] = useState<ExpenseReportStats | null>(null);

    const generateReport = useCallback(() => {
        if (!categories.length) return;

        const total_expense = expenses.reduce((sum, e) => sum + e.amount, 0);

        // Category Breakdown
        const categoryMap: Record<string, number> = {};
        expenses.forEach(e => {
            categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
        });

        const by_category = Object.entries(categoryMap).map(([name, amount]) => {
            const catInfo = categories.find(c => c.name === name);
            return {
                category: name,
                amount,
                percentage: `${Math.round((amount / total_expense) * 100)}%`,
                type: (catInfo?.name === 'Rent' || catInfo?.name === 'Salaries') ? 'FIXED' : 'VARIABLE' as 'FIXED' | 'VARIABLE'
            };
        }).sort((a, b) => b.amount - a.amount);

        // Branch Breakdown
        const branchMap: Record<string, number> = {};
        expenses.forEach(e => {
            const bName = e.branch_id || 'Main Branch';
            branchMap[bName] = (branchMap[bName] || 0) + e.amount;
        });

        const by_branch = Object.entries(branchMap).map(([branch, amount]) => ({
            branch,
            amount,
            risk: (amount > total_expense * 0.5) ? 'HIGH' : 'NORMAL' as 'NORMAL' | 'HIGH'
        }));

        // Payment Mode
        const modeMap: Record<string, number> = {};
        expenses.forEach(e => {
            modeMap[e.payment_method] = (modeMap[e.payment_method] || 0) + e.amount;
        });

        const by_payment_mode = Object.entries(modeMap).map(([mode, amount]) => ({ mode, amount }));

        // Audit Intelligence
        const audit_flags: string[] = [];
        const recommendations: string[] = [];

        const cashExpenses = expenses.filter(e => e.payment_method === 'CASH');
        const cashTotal = cashExpenses.reduce((s, e) => s + e.amount, 0);

        if (cashTotal > total_expense * 0.3) {
            audit_flags.push(`Excessive cash usage detected: ₹${cashTotal.toLocaleString()} (${Math.round((cashTotal / total_expense) * 100)}% of total)`);
            recommendations.push("Convert high cash expenses to bank payments for better audit trails.");
        }

        const duplicates = expenses.filter((e, i) =>
            expenses.some((e2, j) => i !== j && e.amount === e2.amount && e.category === e2.category && e.date === e2.date)
        );
        if (duplicates.length > 0) {
            audit_flags.push(`${duplicates.length} Potential duplicate entries detected for ${duplicates[0].category}`);
            recommendations.push("Review and merge duplicate expense recordings.");
        }

        const missingRefs = expenses.filter(e => !e.reference && e.amount > 5000);
        if (missingRefs.length > 0) {
            audit_flags.push(`${missingRefs.length} high-value expenses missing reference numbers`);
            recommendations.push("Mandate reference numbers/receipt IDs for all expenses above ₹5,000.");
        }

        setReport({
            total_expense,
            report_period: 'Jan 2026', // Mock period for demo
            by_category,
            by_branch,
            by_payment_mode,
            audit_flags,
            recommendations
        });

    }, [expenses, categories]);

    useEffect(() => {
        generateReport();
    }, [generateReport]);

    return {
        report,
        loading: expensesLoading || categoriesLoading,
        refresh: generateReport
    };
};
