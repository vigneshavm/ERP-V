"use client";

import { useState, useEffect } from 'react';
import { fetchLoans, createLoan, updateLoan, deleteLoan, recordLoanPayment } from '@/features/cards-and-loans/services/loansApi';
import { useExpenseStore } from '@repo/shared';

import { Loan } from '@repo/shared';

export const useLoansFeature = () => {
    const { refreshTrigger } = useExpenseStore();

    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchLoans();
            setLoans(result);
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

    const handleAddLoan = async (loan: Omit<Loan, 'id'>) => {
        try {
            await createLoan(loan);
            await loadData();
        } catch (err) {
            setError(err as Error);
        }
    };

    const handleUpdateLoan = async (id: number, updates: Partial<Loan>) => {
        try {
            await updateLoan(id, updates);
            await loadData();
        } catch (err) {
            setError(err as Error);
        }
    };

    const handleDeleteLoan = async (id: number) => {
        try {
            await deleteLoan(id);
            await loadData();
        } catch (err) {
            setError(err as Error);
        }
    };

    const handleRecordPayment = async (id: number, amount: number) => {
        try {
            await recordLoanPayment(id, amount);
            await loadData();
        } catch (err) {
            setError(err as Error);
        }
    };

    return {
        loans,
        loading,
        error,
        addLoan: handleAddLoan,
        updateLoan: handleUpdateLoan,
        deleteLoan: handleDeleteLoan,
        recordPayment: handleRecordPayment,
        refresh: loadData
    };
};
