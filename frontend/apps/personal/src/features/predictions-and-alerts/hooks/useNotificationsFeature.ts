"use client";

import { useState, useEffect } from 'react';
import { fetchNotifications } from '@/features/predictions-and-alerts/services/notificationsApi';
import { useExpenseStore } from '@repo/shared';


export const useNotificationsFeature = () => {
    const { refreshTrigger } = useExpenseStore();

    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await fetchNotifications();
            setNotifications(response.data);
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
