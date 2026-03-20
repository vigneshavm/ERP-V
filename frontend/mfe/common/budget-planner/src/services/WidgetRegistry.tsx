import React from 'react';
import {
    LayoutDashboard,
    AlertTriangle,
    Smartphone,
    FileText,
    BarChart3,
    Target,
    PieChart,
    Camera
} from 'lucide-react';

export interface Widget {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'Essential' | 'Analysis' | 'Tools';
    defaultEnabled?: boolean;
}

export const WIDGET_REGISTRY: Widget[] = [
    {
        id: 'total-wealth',
        name: 'Total Wealth Hero',
        description: 'Displays your total balance prominently.',
        icon: <LayoutDashboard size={20} />,
        category: 'Essential',
        defaultEnabled: true
    },
    {
        id: 'predictive-alert',
        name: 'Predictive Alerts',
        description: 'AI-powered forecasts and budget warnings.',
        icon: <AlertTriangle size={20} />,
        category: 'Essential',
        defaultEnabled: true
    },
    {
        id: 'sms-helper',
        name: 'SMS Transaction Helper',
        description: 'Quick access to pending SMS transactions.',
        icon: <Smartphone size={20} />,
        category: 'Tools',
        defaultEnabled: true
    },
    {
        id: 'bank-statement',
        name: 'Bank Statement Parser',
        description: 'Upload and analyze PDF bank statements.',
        icon: <FileText size={20} />,
        category: 'Tools',
        defaultEnabled: true
    },
    {
        id: 'monthly-summary',
        name: 'Monthly Overview',
        description: 'Detailed cards for recent monthly spending.',
        icon: <BarChart3 size={20} />,
        category: 'Essential',
        defaultEnabled: true
    },
    {
        id: 'savings-goals',
        name: 'Savings Progress',
        description: 'Track your progress towards financial goals.',
        icon: <Target size={20} />,
        category: 'Analysis',
        defaultEnabled: false
    },
    {
        id: 'category-breakdown',
        name: 'Expense Categories',
        description: 'Visual breakdown of spending by category.',
        icon: <PieChart size={20} />,
        category: 'Analysis',
        defaultEnabled: false
    },
    {
        id: 'receipt-ocr',
        name: 'Receipt Scanner',
        description: 'Scan receipts using AI OCR to add transactions instantly.',
        icon: <Camera size={20} />,
        category: 'Tools',
        defaultEnabled: true
    }
];

export const getDefaultWidgetIds = () =>
    WIDGET_REGISTRY.filter(w => w.defaultEnabled).map(w => w.id);
