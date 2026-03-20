"use client";

import AnalyticsView from '@/features/reports/AnalyticsView';
import { useExpenseStore } from '@repo/shared';


export default function StatisticsPage() {
    const { refreshTrigger } = useExpenseStore();

    
    return <AnalyticsView refreshTrigger={refreshTrigger} />;
}
