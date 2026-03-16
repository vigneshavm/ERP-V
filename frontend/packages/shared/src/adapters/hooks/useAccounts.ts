"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { PersonalBankAccount } from '../types';

export const useAccounts = () => {
    const adapter = useData();
    const [accounts, setAccounts] = useState<PersonalBankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getBankAccounts();
            setAccounts(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch accounts'));
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        accounts,
        loading,
        error,
        refresh
    };
};
