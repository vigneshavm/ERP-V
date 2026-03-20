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
            cashRequired30Days: 78500,
            summaryByBranch: [
                {
                    branch_name: 'Chennai Main',
                    monthly_sales: 500000,
                    total_monthly_fixed_cost: 45000,
                    cost_ratio: '9%',
                    risk_level: 'LOW',
                    recommended_action: 'Maintain current overhead'
                },
                {
                    branch_name: 'Bangalore Sub',
                    monthly_sales: 200000,
                    total_monthly_fixed_cost: 15500,
                    cost_ratio: '7.7%',
                    risk_level: 'LOW',
                    recommended_action: 'Efficient operation'
                },
            ],
            upcomingDues: [
                {
                    id: '1',
                    category_name: 'Office Rent',
                    vendor: 'Elite Realty',
                    amount: 45000,
                    next_due_date: '2026-02-01',
                    status: 'OVERDUE'
                },
                {
                    id: '2',
                    category_name: 'Internet Lease',
                    vendor: 'Gigabit Fiber',
                    amount: 3500,
                    next_due_date: '2026-02-05',
                    status: 'UPCOMING'
                },
                {
                    id: '3',
                    category_name: 'Cloud Credits',
                    vendor: 'AWS',
                    amount: 12000,
                    next_due_date: '2026-02-10',
                    status: 'UPCOMING'
                },
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
