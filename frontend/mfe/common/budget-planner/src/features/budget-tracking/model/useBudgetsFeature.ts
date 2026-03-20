"use client";

import { useState, useEffect } from 'react';
import { fetchBudget, updateBudgetMode } from '../api/budgetsApi';
import { useExpenses } from '@repo/shared';

export const useBudgetsFeature = () => {
    const { refreshTrigger } = useExpenses();
    const [budget, setBudget] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchBudget();
            setBudget(result);
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

    const handleUpdateMode = async (mode: 'zero-based' | 'flexible') => {
        try {
            await updateBudgetMode(mode);
            await loadData();
        } catch (err) {
            setError(err as Error);
        }
    };

    return {
        budget,
        loading,
        error,
        updateMode: handleUpdateMode,
        refresh: loadData
    };
};
