"use client";

import { YearlyInsights } from '@/features/reports';
import { useExpenses } from '@repo/shared';
import { useNavigation } from '@/contexts/NavigationContext';

export default function InsightsPage() {
    useNavigation();
    const { refreshTrigger } = useExpenses();
    
    return <YearlyInsights refreshTrigger={refreshTrigger} onBack={() => window.history.back()} />;
}
