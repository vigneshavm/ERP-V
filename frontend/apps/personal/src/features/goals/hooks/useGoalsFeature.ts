"use client";

import { useState, useEffect } from 'react';
import { fetchGoals, addGoal, updateGoalProgress } from '@/features/goals/services/goalsApi';
import { useExpenseStore } from '@repo/shared';


export const useGoalsFeature = () => {
    const { refreshTrigger } = useExpenseStore();

    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchGoals();
            setGoals(result);
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

    const handleAddGoal = async (goal: any) => {
        try {
            await addGoal(goal);
            await loadData();
        } catch (err) {
            setError(err as Error);
        }
    };

    const handleUpdateProgress = async (id: string | number, current: number) => {
        try {
            await updateGoalProgress(id, current);
            await loadData();
        } catch (err) {
            setError(err as Error);
        }
    };

    return {
        goals,
        loading,
        error,
        addGoal: handleAddGoal,
        updateGoalProgress: handleUpdateProgress,
        refresh: loadData
    };
};
