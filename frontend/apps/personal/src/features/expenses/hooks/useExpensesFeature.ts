"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchExpensesHistory, submitExpenseTransaction, fetchCategories } from '@/entities/expense/api';
import { ExpenseHistory, Category } from '@repo/shared';



export const useExpensesFeature = () => {
    const queryClient = useQueryClient();

    const { data: historyData, isLoading: historyLoading, error: historyError } = useQuery({
        queryKey: ['expenses', 'history'],
        queryFn: fetchExpensesHistory,
    });

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['expenses', 'categories'],
        queryFn: fetchCategories,
    });

    const addExpenseMutation = useMutation({
        mutationFn: ({ amount, categoryName, notes }: { amount: number; categoryName: string; notes?: string }) => 
            submitExpenseTransaction(amount, categoryName, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });

    const addExpense = async (amount: number, categoryName: string, notes?: string) => {
        addExpenseMutation.mutate({ amount, categoryName, notes });
    };

    return {
        data: historyData || null,
        categories: categoriesData || [],
        loading: historyLoading || categoriesLoading,
        error: (historyError as Error) || null,
        isPending: addExpenseMutation.isPending,
        addExpense,
        refresh: () => queryClient.invalidateQueries({ queryKey: ['expenses'] })
    };
};

