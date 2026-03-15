"use client";

import { useState, useEffect } from 'react';
import { fetchReports, fetchStatsData, fetchYearlyInsights } from '../services/reportsApi';
import { useExpenseStore } from '@repo/shared';

import { StatsData } from '@repo/shared';

export const useReportsFeature = () => {
    const { refreshTrigger } = useExpenseStore();

    const [reports, setReports] = useState<any[]>([]);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [yearlyInsights, setYearlyInsights] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reportsResult, statsResult, yearlyResult] = await Promise.all([
                fetchReports(),
                fetchStatsData(),
                fetchYearlyInsights()
            ]);
            setReports(reportsResult);
            setStats(statsResult);
            setYearlyInsights(yearlyResult);
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
        reports,
        stats,
        yearlyInsights,
        loading,
        error,
        refresh: loadData
    };
};
