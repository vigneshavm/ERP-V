"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { PersonalUser } from '../types';

export const useUser = () => {
    const adapter = useData();
    const [user, setUser] = useState<PersonalUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadUser = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getUser();
            setUser(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const updateSettings = async (settings: Partial<PersonalUser>) => {
        if (!user) return;
        const original = { ...user };
        setUser({ ...user, ...settings });

        try {
            const updated = await adapter.updateUserSettings(settings);
            setUser(updated);
            return updated;
        } catch (err) {
            setUser(original);
            throw err;
        }
    };

    return { user, loading, error, refresh: loadUser, updateSettings };
};
