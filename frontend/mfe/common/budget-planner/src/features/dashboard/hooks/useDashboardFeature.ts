"use client";

import { useState, useEffect } from 'react';
import { fetchDashboardData } from '../services/dashboardApi';
import { DashboardData } from '@repo/shared';
import { useExpenses } from '@repo/shared';

export const useDashboardFeature = () => {
    const { refreshTrigger } = useExpenses();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchDashboardData();
            setData(result);
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

    return {
        data,
        loading,
        error,
        refresh: loadData
    };
};
