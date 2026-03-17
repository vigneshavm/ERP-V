"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { JournalEntry } from '../types';

export const useJournalEntries = () => {
    const adapter = useData();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadEntries = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getJournalEntries();
            setEntries(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    return { entries, loading, error, refresh: loadEntries };
};
