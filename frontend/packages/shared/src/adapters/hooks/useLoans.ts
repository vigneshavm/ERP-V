"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { PersonalLoan } from '../types';

export const useLoans = () => {
    const adapter = useData();
    const [loans, setLoans] = useState<PersonalLoan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadLoans = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getLoans();
            setLoans(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        loadLoans();
    }, [loadLoans]);

    const getLoanDetails = useCallback(async (id: string) => {
        try {
            return await adapter.getLoanDetails(id);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [adapter]);

    const addLoan = async (loan: Omit<PersonalLoan, 'id' | 'status'>) => {
        try {
            const created = await adapter.createLoan(loan);
            setLoans(prev => [...prev, created]);
            return created;
        } catch (err) {
            throw err;
        }
    };

    const recordPayment = async (id: string, amount: number) => {
        try {
            const updated = await adapter.recordLoanPayment(id, amount);
            setLoans(prev => prev.map(l => l.id === id ? updated : l));
            return updated;
        } catch (err) {
            throw err;
        }
    };

    const deleteLoan = async (id: string) => {
        try {
            const success = await adapter.deleteLoan(id);
            if (success) {
                setLoans(prev => prev.filter(l => l.id !== id));
            }
            return success;
        } catch (err) {
            throw err;
        }
    };

    return { loans, loading, error, refresh: loadLoans, getLoanDetails, addLoan, recordPayment, deleteLoan };
};
