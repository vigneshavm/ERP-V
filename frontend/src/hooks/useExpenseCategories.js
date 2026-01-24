import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

export const useExpenseCategories = () => {
    const { user } = useSelector((state) => state.auth);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/expense-categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data?.categories || response.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching expense categories:', err);
            setError(err.message);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCategories();
        }
    }, [user]);

    const upsertCategory = async (category) => {
        try {
            const token = localStorage.getItem('token');
            if (category.id) {
                await api.put(`/expense-categories/${category.id}`, category, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await api.post('/expense-categories', category, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            await fetchCategories();
        } catch (err) {
            console.error('Error upserting category:', err);
            throw err;
        }
    };

    const deleteCategory = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/expense-categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    };

    return { categories, loading, error, upsertCategory, deleteCategory, refetch: fetchCategories };
};

