"use client";

import { YearlyInsights } from '@/features/reports';
import { useExpenseStore } from '@repo/shared';

import { useNavigation } from '@/contexts/NavigationContext';

export default function InsightsPage() {
    useNavigation();
    const { refreshTrigger } = useExpenseStore();

    
    return <YearlyInsights refreshTrigger={refreshTrigger} onBack={() => window.history.back()} />;
}
