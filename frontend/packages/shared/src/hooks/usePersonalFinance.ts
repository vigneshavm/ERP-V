"use client";

import { useState, useCallback } from 'react';
import { api } from '../services/apiClient';
import { PersonalTransaction, Category, BankAccount } from '../types';

export const usePersonalFinance = () => {
    const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [monthStartDay, setMonthStartDay] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async (startDate?: string, endDate?: string) => {
        setLoading(true);
        try {
            const url = startDate && endDate 
                ? `/personal/expenses/transactions?startDate=${startDate}&endDate=${endDate}`
                : '/personal/expenses/transactions';
            const data = await api.get<PersonalTransaction[]>(url);
            setTransactions(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get<{ categories: Category[] }>('/personal/expense-categories');
            setCategories(response.categories);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch categories');
        }
    }, []);

    const fetchAccounts = useCallback(async () => {
        try {
            const data = await api.get<BankAccount[]>('/personal/finance/accounts'); // Harmonized to /accounts
            setAccounts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch accounts');
        }
    }, []);

    const addTransaction = async (data: Partial<PersonalTransaction>) => {
        try {
            await api.post('/personal/expenses/transactions', data);
            await fetchTransactions();
            await fetchAccounts(); // Balance updated
        } catch (err: any) {
            throw new Error(err.message || 'Failed to add transaction');
        }
    };

    const updateTransaction = async (id: string, data: Partial<PersonalTransaction>) => {
        try {
            await api.put(`/personal/expenses/transactions/${id}`, data);
            await fetchTransactions();
            await fetchAccounts();
        } catch (err: any) {
            throw new Error(err.message || 'Failed to update transaction');
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            await api.delete(`/personal/expenses/transactions/${id}`);
            await fetchTransactions();
            await fetchAccounts();
        } catch (err: any) {
            throw new Error(err.message || 'Failed to delete transaction');
        }
    };

    const addCategory = async (data: Partial<Category>) => {
        try {
            await api.post('/personal/expense-categories', data);
            await fetchCategories();
        } catch (err: any) {
            throw new Error(err.message || 'Failed to add category');
        }
    };

    const updateMonthStartDay = async (day: number) => {
        try {
            await api.post('/personal/user/finance-settings', { monthStartDay: day });
            setMonthStartDay(day);
        } catch (err: any) {
            throw new Error(err.message || 'Failed to update settings');
        }
    };

    const getPeriodRange = (date: Date, startDay: number) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();
        let start, end;
        if (day >= startDay) {
            start = new Date(year, month, startDay);
            end = new Date(year, month + 1, startDay - 1);
        } else {
            start = new Date(year, month - 1, startDay);
            end = new Date(year, month, startDay - 1);
        }
        return { start, end };
    };

    const getNextPeriod = (currentStart: Date, startDay: number) => {
        const next = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, startDay);
        return getPeriodRange(next, startDay);
    };

    const getPrevPeriod = (currentStart: Date, startDay: number) => {
        const prev = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, startDay);
        return getPeriodRange(prev, startDay);
    };

    return {
        transactions,
        categories,
        accounts,
        monthStartDay,
        loading,
        error,
        fetchTransactions,
        fetchCategories,
        fetchAccounts,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateMonthStartDay,
        getPeriodRange,
        getNextPeriod,
        getPrevPeriod
    };
};
