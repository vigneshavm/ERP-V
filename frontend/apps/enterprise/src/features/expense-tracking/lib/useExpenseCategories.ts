import { logger } from '@/shared/lib/logger';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from "@/shared/api/api";
import { RootState } from "@/app/store/store";

export interface ExpenseSubCategory {
    id: string;
    name: string;
    description?: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
    description?: string;
    monthly_budget: number;
    approval_required: boolean;
    is_cash_allowed: boolean;
    is_active: boolean;
    gst_eligible: boolean;
    subcategories?: ExpenseSubCategory[];
}



export const useExpenseCategories = () => {
    const { user } = useAuthStore();
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/expense-categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data?.categories || response.data || []);
            setError(null);
        } catch (err: any) {
            logger.error('Error fetching expense categories:', err);
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

    const upsertCategory = async (category: Partial<ExpenseCategory>) => {
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
        } catch (err: any) {
            logger.error('Error upserting category:', err);
            throw err;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/expense-categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchCategories();
        } catch (err: any) {
            logger.error('Error deleting category:', err);
            throw err;
        }
    };

    return { categories, loading, error, upsertCategory, deleteCategory, refetch: fetchCategories };
};
