import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from "../services/api.js";
import { RootState } from "../redux/store";

export interface ExpenseReportStats {
    total_expense: number;
    report_period: string;
    by_category: { category: string; amount: number; percentage: number; type?: string }[];
    by_branch: { branch: string; amount: number; percentage: number; risk: 'HIGH' | 'LOW' | 'MEDIUM' }[];
    by_payment_mode: { mode: string; amount: number; percentage: number }[];
    audit_flags: string[];
    recommendations: string[];
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
            const token = localStorage.getItem('token');
            let url = '/expense-reports';
            if (startDate || endDate) {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                url += `?${params.toString()}`;
            }
            const response = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReport(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching expense reports:', err);
            setError(err.message);
            // Return empty report structure
            setReport({
                report_period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                total_expense: 0,
                by_category: [],
                by_branch: [],
                by_payment_mode: [],
                audit_flags: [],
                recommendations: ['Add expenses to generate insights'],
            });
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
