"use client";

import { DetailedReports } from '@/features/reports';
import { useExpenseStore } from '@repo/shared';


export default function ReportsPage() {
    const { refreshTrigger } = useExpenseStore();

    
    return <DetailedReports refreshTrigger={refreshTrigger} onBack={() => window.history.back()} />;
}
