import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from "../services/api.js";
import { RootState } from "../redux/store";

export interface ExpenseCategoryStat {
    category: string;
    amount: number;
    budget: number;
    variance: number;
    variancePercentage: number;
    percentage: string;
    type: 'FIXED' | 'VARIABLE';
    status: 'OVER' | 'UNDER' | 'NONE';
}

export interface ExpenseMonthlyTrend {
    month: string;
    year: number;
    expense: number;
    /** Invoiced sales that month; null when it couldn't be computed. */
    income: number | null;
    /** Spend as a % of the total monthly category budget; null when no budgets are set. */
    budget_utilization: number | null;
    budget: number | null;
    label: string;
}

// Shape returned by GET /api/expense-reports (ExpenseReportController.getExpenseReport).
export interface ExpenseReportStats {
    total_expense: number;
    report_period: string;
    by_category: ExpenseCategoryStat[];
    by_branch: { branch: string; amount: number; risk: 'HIGH' | 'LOW' | 'MEDIUM' }[];
    by_payment_mode: { mode: string; amount: number }[];
    audit_flags: string[];
    recommendations: string[];
    monthly_trends: ExpenseMonthlyTrend[];
}

interface AuthState {
    user: any;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

export const useExpenseReports = () => {
    const { user } = useSelector((state: RootState & { auth: AuthState }) => state.auth);
    const [report, setReport] = useState<ExpenseReportStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async (startDate?: string, endDate?: string) => {
        try {
            setLoading(true);
            let url = '/api/expense-reports';
            if (startDate || endDate) {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                url += `?${params.toString()}`;
            }
            const response = await api.get(url);
            const data = response.data;
            if (data && typeof data === 'object' && 'total_expense' in data) {
                setReport(data);
            } else {
                throw new Error('Invalid report data format');
            }
            setError(null);
        } catch (err: any) {
            console.error('Error fetching expense reports:', err);
            // No stand-in report: an all-zero report would read as "you spent ₹0".
            setError(err.message || 'Failed to load the expense report');
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchReport();
        }
    }, [user]);

    return { report, loading, error, refetch: fetchReport };
};
