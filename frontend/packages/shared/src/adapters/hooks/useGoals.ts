"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { PersonalGoal, GoalStatus } from '../types';

export const useGoals = () => {
    const adapter = useData();
    const [goals, setGoals] = useState<PersonalGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadGoals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getGoals();
            setGoals(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        loadGoals();
    }, [loadGoals]);

    const addGoal = async (goal: Omit<PersonalGoal, 'id' | 'status'>) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticGoal: PersonalGoal = {
            ...goal,
            id: tempId,
            status: GoalStatus.IN_PROGRESS
        };
        setGoals(prev => [...prev, optimisticGoal]);

        try {
            const realGoal = await adapter.createGoal(goal);
            setGoals(prev => prev.map(g => g.id === tempId ? realGoal : g));
            return realGoal;
        } catch (err) {
            setGoals(prev => prev.filter(g => g.id !== tempId));
            throw err;
        }
    };

    const updateProgress = async (id: string, amount: number) => {
        // Find original for rollback
        const original = goals.find(g => g.id === id);
        if (!original) return;

        // Optimistic update
        setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: amount } : g));

        try {
            const updated = await adapter.updateGoalProgress(id, amount);
            setGoals(prev => prev.map(g => g.id === id ? updated : g));
        } catch (err) {
            // Rollback
            setGoals(prev => prev.map(g => g.id === id ? original : g));
            throw err;
        }
    };

    return { goals, loading, error, refresh: loadGoals, addGoal, updateProgress };
};
