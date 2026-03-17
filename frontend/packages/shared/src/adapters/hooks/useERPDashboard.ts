"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { StockReport, DashboardStats, SupplierAnalytics } from '../types';

export const useERPDashboard = () => {
    const adapter = useData();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [stockReport, setStockReport] = useState<StockReport | null>(null);
    const [suppliers, setSuppliers] = useState<SupplierAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, stockData, suppliersData] = await Promise.all([
                adapter.getDashboardStats(),
                adapter.getStockReport(),
                adapter.getSuppliers()
            ]);
            setStats(statsData);
            setStockReport(stockData);
            setSuppliers(suppliersData);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    return { stats, stockReport, suppliers, loading, error, refresh: loadDashboardData };
};
