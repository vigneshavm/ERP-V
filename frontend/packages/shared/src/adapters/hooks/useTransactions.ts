"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { PersonalTransaction, PersonalTransactionType } from '../types';

export const useTransactions = (type?: PersonalTransactionType) => {
    const adapter = useData();
    const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getTransactions();
            const filtered = type ? data.filter(t => t.type === type) : data;
            setTransactions(filtered);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter, type]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const addTransaction = async (transaction: Omit<PersonalTransaction, 'id' | 'createdAt'>) => {
        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticTxn: PersonalTransaction = {
            ...transaction,
            id: tempId,
            createdAt: new Date().toISOString()
        };
        
        setTransactions(prev => [optimisticTxn, ...prev]);

        try {
            const realTxn = await adapter.createTransaction(transaction);
            setTransactions(prev => prev.map(t => t.id === tempId ? realTxn : t));
            return realTxn;
        } catch (err) {
            // Rollback on error
            setTransactions(prev => prev.filter(t => t.id !== tempId));
            throw err;
        }
    };

    return { 
        transactions, 
        loading, 
        error, 
        refresh: loadTransactions,
        addTransaction
    };
};
