"use client";

import { useState, useEffect } from 'react';
import { fetchAllTransactions, fetchAccounts, createAccount, bulkUpdateTransactions, bulkDeleteTransactions, disputeTransaction } from '../services/transactionsApi';
import { CalendarTransaction } from '@repo/shared';
import { useExpenseStore } from '@repo/shared';


export const useTransactionsFeature = () => {
    const { refreshTrigger, refreshExpenses } = useExpenseStore();

    const [transactions, setTransactions] = useState<CalendarTransaction[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [txResult, accResult] = await Promise.all([
                fetchAllTransactions(),
                fetchAccounts()
            ]);
            setTransactions(txResult);
            setAccounts(accResult);
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

    const addAccount = async (account: any) => {
        await createAccount(account);
        refreshExpenses();
    };

    const updateTransactionsCategory = async (ids: string[], categoryId: string) => {
        await bulkUpdateTransactions(ids, categoryId);
        refreshExpenses();
    };

    const deleteTransactions = async (ids: string[]) => {
        await bulkDeleteTransactions(ids);
        refreshExpenses();
    };

    const reverseTransaction = async (id: string) => {
        await disputeTransaction(id);
        refreshExpenses();
    };

    return {
        transactions,
        accounts,
        loading,
        error,
        refresh: loadData,
        addAccount,
        updateTransactionsCategory,
        deleteTransactions,
        reverseTransaction
    };
};
