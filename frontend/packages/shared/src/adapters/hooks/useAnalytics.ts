"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { AnalyticsSummary, YearlyOverview } from '../types';

export const useAnalytics = (year?: number) => {
    const adapter = useData();
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [yearlyOverview, setYearlyOverview] = useState<YearlyOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const [sum, yearly] = await Promise.all([
                adapter.getAnalyticsSummary('month'),
                year ? adapter.getYearlyOverview(year) : Promise.resolve(null)
            ]);
            setSummary(sum);
            setYearlyOverview(yearly);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter, year]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    return { summary, yearlyOverview, loading, error, refresh: loadAnalytics };
};
