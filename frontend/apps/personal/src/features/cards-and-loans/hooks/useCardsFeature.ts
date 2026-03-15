"use client";

import { useState, useEffect } from 'react';
import { fetchCreditCards, fetchDebitCards } from '../services/cardsApi';
import { useExpenseStore } from '@repo/shared';


export const useCardsFeature = () => {
    const { refreshTrigger } = useExpenseStore();

    const [creditCards, setCreditCards] = useState<any[]>([]);
    const [debitCards, setDebitCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [creditResult, debitResult] = await Promise.all([
                fetchCreditCards(),
                fetchDebitCards()
            ]);
            setCreditCards(creditResult);
            setDebitCards(debitResult);
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
        creditCards,
        debitCards,
        loading,
        error,
        refresh: loadData
    };
};
