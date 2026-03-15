import { useState, useEffect } from 'react';

export interface RecurringExpense {
    id: string;
    description: string;
    amount: number;
    frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
    nextDue: string;
    status: 'ACTIVE' | 'PAUSED';
}

export const useRecurringExpenses = () => {
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
    const [intelligence, setIntelligence] = useState<any>({
        summaryByBranch: [],
        upcomingDues: [],
        riskFactors: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking the data for now since the hook was missing
        const mockExpenses: RecurringExpense[] = [
            { id: '1', description: 'Office Rent', amount: 45000, frequency: 'MONTHLY', nextDue: '2026-02-01', status: 'ACTIVE' },
            { id: '2', description: 'Internet Lease', amount: 3500, frequency: 'MONTHLY', nextDue: '2026-02-05', status: 'ACTIVE' },
            { id: '3', description: 'AWS Infrastructure', amount: 12000, frequency: 'MONTHLY', nextDue: '2026-02-10', status: 'ACTIVE' },
        ];

        const mockIntelligence = {
            summaryByBranch: [
                { branch: 'Chennai Main', amount: 45000, cost_ratio: '12%', risk_level: 'LOW' },
                { branch: 'Bangalore Sub', amount: 15500, cost_ratio: '8%', risk_level: 'LOW' },
            ],
            upcomingDues: [
                { id: '1', description: 'Jan Rent', amount: 45000, dueDate: '2026-01-31', status: 'OVERDUE' },
                { id: '2', description: 'Cloud Credits', amount: 12000, dueDate: '2026-02-10', status: 'UPCOMING' },
            ],
            riskFactors: ['High fixed cost in Chennai']
        };

        setTimeout(() => {
            setRecurringExpenses(mockExpenses);
            setIntelligence(mockIntelligence);
            setLoading(false);
        }, 500);
    }, []);

    return { recurringExpenses, intelligence, loading };
};
