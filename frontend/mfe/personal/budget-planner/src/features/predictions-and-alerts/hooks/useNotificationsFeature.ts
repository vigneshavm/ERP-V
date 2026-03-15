"use client";

import { useState, useEffect } from 'react';
import { fetchNotifications } from '../services/notificationsApi';
import { useExpenses } from '@repo/shared';

export const useNotificationsFeature = () => {
    const { refreshTrigger } = useExpenses();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchNotifications();
            setNotifications(data);
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
        notifications,
        loading,
        error,
        refresh: loadData
    };
};
