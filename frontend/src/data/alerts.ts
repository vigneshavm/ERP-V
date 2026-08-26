export interface MockAlert {
    id: string;
    type: 'EXPENSE' | 'STOCK' | 'CREDIT';
    title: string;
    subtitle: string;
    description: string;
    metric: string;
    urgency: string;
    action: string;
    trend?: string;
}

export const business_alerts: MockAlert[] = [
    {
        id: 'AL-001',
        type: 'EXPENSE',
        title: 'High Expense Alert',
        subtitle: 'System has detected a risk',
        description: 'Logistics expenditure has deviated by +18% from the standard baseline in your shop.',
        metric: '₹42.5k',
        urgency: 'URGENT MITIGATION',
        action: 'Initiate Protocol',
        trend: '+18%'
    }
];
