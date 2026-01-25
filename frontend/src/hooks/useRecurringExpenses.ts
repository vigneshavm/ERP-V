import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { RootState } from '../redux/store';

export interface RecurringExpense {
    id: string;
    description: string;
    amount: number;
    category: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    next_due_date: string;
    is_active: boolean;
    branch_id?: string;
}

export interface RecurringIntelligence {
    cashRequired30Days: number;
    summaryByBranch: {
        branch_name: string;
        amount: number;
        count: number;
        cost_ratio: string;
        risk_level: 'HIGH' | 'LOW' | 'MEDIUM';
        monthly_sales: number;
        recommended_action: string;
        total_monthly_fixed_cost: number;
    }[];
    upcomingDues: {
        id: string;
        description: string;
        date: string;
        amount: number;
        status: 'OVERDUE' | 'UPCOMING' | 'PAID';
        category_name: string;
        vendor: string;
        next_due_date: string;
    }[];
}

interface AuthState {
    user: any;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

export const useRecurringExpenses = () => {
    const { user } = useSelector((state: RootState & { auth: AuthState }) => state.auth);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
    const [intelligence, setIntelligence] = useState<RecurringIntelligence>({
        cashRequired30Days: 0,
        summaryByBranch: [],
        upcomingDues: []
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecurringExpenses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/recurring-expenses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecurringExpenses(response.data?.expenses || []);
            setIntelligence(response.data?.intelligence || {
                cashRequired30Days: 0,
                summaryByBranch: [],
                upcomingDues: []
            });
            setError(null);
        } catch (err: any) {
            console.error('Error fetching recurring expenses:', err);
            setError(err.message);
            setRecurringExpenses([]);
            setIntelligence({
                cashRequired30Days: 0,
                summaryByBranch: [],
                upcomingDues: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRecurringExpenses();
        }
    }, [user]);

    const createRecurringExpense = async (data: Partial<RecurringExpense>) => {
        try {
            const token = localStorage.getItem('token');
            await api.post('/recurring-expenses', data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchRecurringExpenses();
        } catch (err: any) {
            console.error('Error creating recurring expense:', err);
            throw err;
        }
    };

    const updateRecurringExpense = async (id: string, data: Partial<RecurringExpense>) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(`/recurring-expenses/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchRecurringExpenses();
        } catch (err: any) {
            console.error('Error updating recurring expense:', err);
            throw err;
        }
    };

    const deleteRecurringExpense = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/recurring-expenses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchRecurringExpenses();
        } catch (err: any) {
            console.error('Error deleting recurring expense:', err);
            throw err;
        }
    };

    return {
        recurringExpenses,
        intelligence,
        loading,
        error,
        createRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        refetch: fetchRecurringExpenses
    };
};
