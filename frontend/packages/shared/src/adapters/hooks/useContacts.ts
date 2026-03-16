"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';

export const useContacts = () => {
    const adapter = useData();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getContacts();
            setContacts(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch contacts'));
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        contacts,
        loading,
        error,
        refresh
    };
};
