"use client";

import { DetailedReports } from '@/features/reports';
import { useExpenses } from '@repo/shared';

export default function ReportsPage() {
    const { refreshTrigger } = useExpenses();
    
    return <DetailedReports refreshTrigger={refreshTrigger} onBack={() => window.history.back()} />;
}
