import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

export interface Expense {
    id: string;
    tenant_id: string;
    branch_id?: string;
    expense_number: string;
    date: string;
    category: string;
    description?: string;
    payment_method: string;
    amount: number;
    tax_percent?: number;
    vendor_id?: string;
    reference?: string;
    created_by?: string;
    created_at?: string;
    synced?: boolean;
}

export const useExpenses = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch Expenses
    const fetchExpenses = useCallback(async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('tenant_id', user.tenantId)
                .order('date', { ascending: false });

            if (error) {
                console.warn('Error fetching expenses, using demo data:', error);
                const mocks: Expense[] = [
                    { id: '1', tenant_id: user.tenantId, date: '2026-01-10', category: 'Salaries', amount: 480000, payment_method: 'BANK', reference: 'PAY-JAN-001', expense_number: 'EXP/26/001' },
                    { id: '2', tenant_id: user.tenantId, date: '2026-01-08', category: 'Rent & Electricity', amount: 220000, payment_method: 'BANK', reference: 'RT-JAN-44', expense_number: 'EXP/26/002' },
                    { id: '3', tenant_id: user.tenantId, date: '2026-01-05', category: 'Courier & Shipping', amount: 15000, payment_method: 'CASH', expense_number: 'EXP/26/003' },
                    { id: '4', tenant_id: user.tenantId, date: '2026-01-05', category: 'Courier & Shipping', amount: 15000, payment_method: 'CASH', expense_number: 'EXP/26/004' }, // Intentional duplicate for audit demo
                ];
                setExpenses(mocks);
            } else {
                setExpenses(data || []);
            }
        } catch (error: any) {
            console.error('Error fetching expenses:', error);
            console.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId]);

    // Create Expense
    const createExpense = async (expense: Partial<Expense>) => {
        if (!user?.tenantId) return;
        try {
            const expenseData = {
                ...expense,
                tenant_id: user.tenantId,
                created_by: user.id
            };

            const { data, error } = await supabase
                .from('expenses')
                .insert([expenseData])
                .select()
                .single();

            if (error) throw error;

            setExpenses(prev => [data, ...prev]);
            console.log('Expense saved successfully');
            return data;
        } catch (error: any) {
            console.error('Error saving expense:', error);
            console.error(error.message || 'Failed to save expense');
            throw error;
        }
    };

    // Update Expense
    const updateExpense = async (id: string, updates: Partial<Expense>) => {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setExpenses(prev => prev.map(e => e.id === id ? data : e));
            console.log('Expense updated');
            return data;
        } catch (error: any) {
            console.error('Error updating expense:', error);
            console.error('Failed to update expense');
            throw error;
        }
    };

    // Delete Expense
    const deleteExpense = async (id: string) => {
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setExpenses(prev => prev.filter(e => e.id !== id));
            console.log('Expense deleted');
        } catch (error: any) {
            console.error('Error deleting expense:', error);
            console.error('Failed to delete expense');
            throw error;
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    return {
        expenses,
        loading,
        fetchExpenses,
        createExpense,
        updateExpense,
        deleteExpense
    };
};
