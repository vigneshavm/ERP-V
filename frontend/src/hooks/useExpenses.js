import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

// Transform backend expense to frontend format
const transformExpense = (exp) => ({
    id: exp._id || exp.id,
    expense_number: exp.expenseNo || exp.expense_number,
    date: exp.date,
    amount: exp.amount,
    category: exp.category,
    payment_method: (exp.paymentMethod || exp.payment_method || 'cash').toUpperCase(),
    description: exp.description,
    branch_id: exp.branch_id || exp.bankAccount,
    reference: exp.reference,
});

// Transform frontend expense to backend format
const transformToBackend = (data) => ({
    expenseNo: data.expense_number || data.expenseNo,
    date: data.date,
    amount: data.amount,
    category: data.category,
    paymentMethod: (data.payment_method || data.paymentMethod || 'cash').toLowerCase().replace(' ', '_'),
    description: data.description,
    bankAccount: data.bankAccount || data.branch_id,
    reference: data.reference,
});

// Export Expense type for use in other components
export const useExpenses = () => {
    const { user } = useSelector((state) => state.auth);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/expenses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rawExpenses = response.data?.expenses || response.data || [];
            setExpenses(rawExpenses.map(transformExpense));
            setError(null);
        } catch (err) {
            console.error('Error fetching expenses:', err);
            setError(err.message);
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchExpenses();
        }
    }, [user]);

    const createExpense = async (data) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.post('/expenses', transformToBackend(data), {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchExpenses();
            return transformExpense(response.data);
        } catch (err) {
            console.error('Error creating expense:', err);
            throw err;
        }
    };

    const updateExpense = async (id, data) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.put(`/expenses/${id}`, transformToBackend(data), {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchExpenses();
            return transformExpense(response.data);
        } catch (err) {
            console.error('Error updating expense:', err);
            throw err;
        }
    };

    const deleteExpense = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/expenses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchExpenses();
        } catch (err) {
            console.error('Error deleting expense:', err);
            throw err;
        }
    };

    return { expenses, loading, error, createExpense, updateExpense, deleteExpense, refetch: fetchExpenses };
};

