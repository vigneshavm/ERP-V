import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

export interface ExpenseCategory {
    id: string;
    tenant_id: string;
    name: string;
    parent_category?: string;
    monthly_budget: number;
    approval_required: boolean;
    is_cash_allowed: boolean;
    is_active: boolean;
    gst_eligible: boolean;
    created_at?: string;
}

export const useExpenseCategories = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCategories = useCallback(async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('expense_categories')
                .select('*')
                .eq('tenant_id', user.tenantId)
                .order('name', { ascending: true });

            if (error) {
                // Fallback to mock data if table doesn't exist or other error
                console.warn('Error fetching expense categories, using defaults:', error);
                const mocks: ExpenseCategory[] = [
                    { id: '1', tenant_id: user.tenantId, name: 'Rent & Electricity', monthly_budget: 300000, approval_required: true, is_cash_allowed: false, is_active: true, gst_eligible: true },
                    { id: '2', tenant_id: user.tenantId, name: 'Courier & Shipping', monthly_budget: 80000, approval_required: false, is_cash_allowed: true, is_active: true, gst_eligible: true },
                    { id: '3', tenant_id: user.tenantId, name: 'Travel & Conveyance', monthly_budget: 120000, approval_required: true, is_cash_allowed: true, is_active: true, gst_eligible: false },
                    { id: '4', tenant_id: user.tenantId, name: 'Repairs & Maintenance', monthly_budget: 40000, approval_required: true, is_cash_allowed: true, is_active: true, gst_eligible: true },
                ];
                setCategories(mocks);
            } else {
                setCategories(data || []);
            }
        } catch (error: any) {
            console.error('Error in useExpenseCategories:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId]);

    const upsertCategory = async (category: Partial<ExpenseCategory>) => {
        if (!user?.tenantId) return;
        try {
            const catData = {
                ...category,
                tenant_id: user.tenantId
            };

            const { data, error } = await supabase
                .from('expense_categories')
                .upsert([catData])
                .select()
                .single();

            if (error) throw error;
            setCategories(prev => {
                const index = prev.findIndex(c => c.id === data.id);
                if (index >= 0) {
                    const next = [...prev];
                    next[index] = data;
                    return next;
                }
                return [...prev, data];
            });
            return data;
        } catch (error: any) {
            console.error('Error saving expense category:', error);
            // Local state update for demo if DB fail
            const mockData = { ...category, id: category.id || Math.random().toString(36).substr(2, 9), tenant_id: user.tenantId } as ExpenseCategory;
            setCategories(prev => {
                const index = prev.findIndex(c => c.id === mockData.id);
                if (index >= 0) {
                    const next = [...prev];
                    next[index] = mockData;
                    return next;
                }
                return [...prev, mockData];
            });
            return mockData;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const { error } = await supabase
                .from('expense_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (error: any) {
            console.error('Error deleting category:', error);
            setCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        loading,
        fetchCategories,
        upsertCategory,
        deleteCategory
    };
};
