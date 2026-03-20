"use client";

import { useState, useEffect, useTransition } from 'react';
import { fetchExpensesHistory, submitExpenseTransaction, fetchCategories } from '../services/expensesApi';
import { ExpenseHistory, Category } from '@repo/shared';
import { useExpenses } from '@repo/shared';

export const useExpensesFeature = () => {
    const { refreshTrigger, triggerRefresh } = useExpenses();
    const [data, setData] = useState<ExpenseHistory | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isPending, startTransition] = useTransition();

    const loadData = async () => {
        setLoading(true);
        try {
            const [historyResult, categoriesResult] = await Promise.all([
                fetchExpensesHistory(),
                fetchCategories()
            ]);
            setData(historyResult);
            setCategories(categoriesResult);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const addExpense = async (amount: number, categoryName: string, notes?: string) => {
        startTransition(async () => {
            try {
                await submitExpenseTransaction(amount, categoryName, notes);
                triggerRefresh();
            } catch (err) {
                console.error("Failed to add expense:", err);
            }
        });
    };

    return {
        data,
        categories,
        loading,
        error,
        isPending,
        addExpense,
        refresh: loadData
    };
};
