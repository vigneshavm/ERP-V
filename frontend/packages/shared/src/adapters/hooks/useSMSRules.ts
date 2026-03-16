"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { SmsRule, SmsTransaction } from '../types';

export const useSMSRules = () => {
    const adapter = useData();
    const [rules, setRules] = useState<SmsRule[]>([]);
    const [pendingSms, setPendingSms] = useState<SmsTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [rulesData, smsData] = await Promise.all([
                adapter.getSmsRules(),
                adapter.getPendingSmsTransactions()
            ]);
            setRules(rulesData);
            setPendingSms(smsData);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const convertSms = async (smsId: string, categoryId: string) => {
        try {
            const txn = await adapter.convertSmsToTransaction(smsId, categoryId);
            setPendingSms(prev => prev.filter(s => s.id !== smsId));
            return txn;
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    return { rules, pendingSms, loading, error, refresh: loadData, convertSms };
};
