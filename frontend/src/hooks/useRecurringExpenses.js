import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

export const useRecurringExpenses = () => {
    const { user } = useSelector((state) => state.auth);
    const [recurringExpenses, setRecurringExpenses] = useState([]);
    const [intelligence, setIntelligence] = useState({
        cashRequired30Days: 0,
        summaryByBranch: [],
        upcomingDues: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        } catch (err) {
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

    const createRecurringExpense = async (data) => {
        try {
            const token = localStorage.getItem('token');
            await api.post('/recurring-expenses', data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchRecurringExpenses();
        } catch (err) {
            console.error('Error creating recurring expense:', err);
            throw err;
        }
    };

    const updateRecurringExpense = async (id, data) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(`/recurring-expenses/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchRecurringExpenses();
        } catch (err) {
            console.error('Error updating recurring expense:', err);
            throw err;
        }
    };

    const deleteRecurringExpense = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/recurring-expenses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchRecurringExpenses();
        } catch (err) {
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

