"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { PersonalCategory } from '../types';

export const useCategories = () => {
    const adapter = useData();
    const [categories, setCategories] = useState<PersonalCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getCategories();
            setCategories(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addCategory = useCallback(async (category: Omit<PersonalCategory, 'id'>) => {
        try {
            const newCat = await adapter.createCategory(category);
            setCategories(prev => [...prev, newCat]);
            return newCat;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to create category');
        }
    }, [adapter]);

    return {
        categories,
        loading,
        error,
        refresh,
        addCategory
    };
};
