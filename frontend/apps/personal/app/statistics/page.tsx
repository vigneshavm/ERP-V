"use client";

import AnalyticsView from '@/features/reports/AnalyticsView';
import { useExpenses } from '@repo/shared';

export default function StatisticsPage() {
    const { refreshTrigger } = useExpenses();
    
    return <AnalyticsView refreshTrigger={refreshTrigger} />;
}
