/**
 * Centralized Plan Definitions
 * 
 * This file contains all plan data used across the application:
 * - Onboarding wizard
 * - Pricing pages
 * - Feature comparison
 * - Subscription management
 */

import { Globe, Zap, Shield, Crown, LucideIcon } from 'lucide-react';

export interface PlanFeature {
    name: string;
    starter: string | boolean;
    growth: string | boolean;
    scale: string | boolean;
    enterprise?: string | boolean;
}

export interface FeatureCategory {
    category: string;
    items: PlanFeature[];
}

export interface Plan {
    id: string;
    name: string;
    price: string;
    monthlyPrice: number; // For calculation
    period: string;
    description: string;
    icon: LucideIcon;
    features: string[];
    color: string;
    popular: boolean;
    limits: {
        users: number | 'unlimited';
        branches: number | 'unlimited';
        products: number | 'unlimited';
        transactionFee: number; // percentage
    };
    modules: string[]; // Included modules
}

// Available sectors for onboarding
export const SECTORS = [
    { id: 'textiles', name: 'Textiles & Apparel', icon: '👔' },
    { id: 'fmcg', name: 'FMCG & Grocery', icon: '🛒' },
    { id: 'electronics', name: 'Electronics & Gadgets', icon: '📱' },
    { id: 'healthcare', name: 'Healthcare & Pharma', icon: '💊' },
    { id: 'food', name: 'Food & Beverages', icon: '🍽️' },
    { id: 'automotive', name: 'Automotive & Parts', icon: '🚗' },
    { id: 'furniture', name: 'Furniture & Interiors', icon: '🪑' },
    { id: 'jewelry', name: 'Jewelry & Accessories', icon: '💎' },
    { id: 'services', name: 'Services & Consulting', icon: '💼' },
    { id: 'other', name: 'Other', icon: '📦' }
];

// Business types
export const BUSINESS_TYPES = [
    { id: 'retail', name: 'Retail', description: 'Direct to customer sales' },
    { id: 'wholesale', name: 'Wholesale', description: 'B2B bulk sales' },
    { id: 'distribution', name: 'Distribution', description: 'Supply chain distribution' },
    { id: 'manufacturing', name: 'Manufacturing', description: 'Product manufacturing' },
    { id: 'service', name: 'Service', description: 'Service-based business' }
];

// Available modules for feature selection
export const MODULES = [
    { id: 'pos', name: 'Point of Sale', description: 'Billing & invoicing', icon: '💳', essential: true },
    { id: 'inventory', name: 'Inventory Management', description: 'Stock tracking & alerts', icon: '📦', essential: true },
    { id: 'crm', name: 'Customer Management', description: 'Customer database & loyalty', icon: '👥', essential: false },
    { id: 'accounting', name: 'Accounting & GST', description: 'Books, GST & tax filing', icon: '📊', essential: false },
    { id: 'hrms', name: 'Staff Management', description: 'Employee management & payroll', icon: '👤', essential: false },
    { id: 'ecommerce', name: 'Online Store', description: 'Sell online with website', icon: '🌐', essential: false },
    { id: 'analytics', name: 'Advanced Analytics', description: 'Business intelligence & reports', icon: '📈', essential: false },
    { id: 'multi_branch', name: 'Multi-Branch', description: 'Manage multiple locations', icon: '🏪', essential: false }
];

// Plan definitions
export const PLANS: Plan[] = [
    {
        id: 'STARTER',
        name: 'Starter',
        price: 'Free',
        monthlyPrice: 0,
        period: 'forever',
        description: 'Perfect for new businesses just getting started.',
        icon: Globe,
        features: [
            'Up to 3 Users',
            '1 Branch',
            '50 Products',
            'Basic POS & Billing',
            'Inventory Tracking',
            '5% Transaction Fee',
            'Email Support'
        ],
        color: 'slate',
        popular: false,
        limits: {
            users: 3,
            branches: 1,
            products: 50,
            transactionFee: 5
        },
        modules: ['pos', 'inventory']
    },
    {
        id: 'GROWTH',
        name: 'Growth',
        price: '₹999',
        monthlyPrice: 999,
        period: '/ month',
        description: 'Everything you need to scale your business.',
        icon: Zap,
        features: [
            'Up to 10 Users',
            'Up to 3 Branches',
            'Unlimited Products',
            'Full POS + CRM',
            'Advanced Inventory',
            '2% Transaction Fee',
            'GST & Accounting',
            'Priority Support'
        ],
        color: 'indigo',
        popular: true,
        limits: {
            users: 10,
            branches: 3,
            products: 'unlimited',
            transactionFee: 2
        },
        modules: ['pos', 'inventory', 'crm', 'accounting']
    },
    {
        id: 'SCALE',
        name: 'Scale',
        price: '₹2,499',
        monthlyPrice: 2499,
        period: '/ month',
        description: 'Advanced tools for high-volume sellers.',
        icon: Shield,
        features: [
            'Up to 25 Users',
            'Up to 10 Branches',
            'Unlimited Products',
            'All Growth Features',
            '0% Transaction Fee',
            'HRMS & Payroll',
            'Multi-Branch Sync',
            'API Access',
            'Advanced Analytics'
        ],
        color: 'emerald',
        popular: false,
        limits: {
            users: 25,
            branches: 10,
            products: 'unlimited',
            transactionFee: 0
        },
        modules: ['pos', 'inventory', 'crm', 'accounting', 'hrms', 'analytics', 'multi_branch']
    },
    {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        price: 'Custom',
        monthlyPrice: 5000, // Base for calculation
        period: 'pricing',
        description: 'Tailored solutions for large organizations.',
        icon: Crown,
        features: [
            'Unlimited Users',
            'Unlimited Branches',
            'Unlimited Products',
            'All Scale Features',
            'Custom Integrations',
            'Dedicated Support',
            'On-premise Option',
            'SLA Guarantee',
            'Custom Development'
        ],
        color: 'amber',
        popular: false,
        limits: {
            users: 'unlimited',
            branches: 'unlimited',
            products: 'unlimited',
            transactionFee: 0
        },
        modules: ['pos', 'inventory', 'crm', 'accounting', 'hrms', 'ecommerce', 'analytics', 'multi_branch']
    }
];

// Feature comparison matrix
export const FEATURE_MATRIX: FeatureCategory[] = [
    {
        category: 'Core Business',
        items: [
            { name: 'Users', starter: '3', growth: '10', scale: '25', enterprise: 'Unlimited' },
            { name: 'Branches', starter: '1', growth: '3', scale: '10', enterprise: 'Unlimited' },
            { name: 'Products', starter: '50', growth: 'Unlimited', scale: 'Unlimited', enterprise: 'Unlimited' },
            { name: 'Transaction Fee', starter: '5%', growth: '2%', scale: '0%', enterprise: '0%' }
        ]
    },
    {
        category: 'Modules',
        items: [
            { name: 'Point of Sale', starter: true, growth: true, scale: true, enterprise: true },
            { name: 'Inventory Management', starter: true, growth: true, scale: true, enterprise: true },
            { name: 'CRM & Loyalty', starter: false, growth: true, scale: true, enterprise: true },
            { name: 'Accounting & GST', starter: false, growth: true, scale: true, enterprise: true },
            { name: 'HRMS & Payroll', starter: false, growth: false, scale: true, enterprise: true },
            { name: 'Online Store', starter: false, growth: false, scale: false, enterprise: true }
        ]
    },
    {
        category: 'Support & Services',
        items: [
            { name: 'Support Type', starter: 'Email', growth: 'Priority Chat', scale: '24/7 Phone', enterprise: 'Dedicated Manager' },
            { name: 'Training', starter: 'Self-serve', growth: 'Video Tutorials', scale: 'Live Sessions', enterprise: 'On-site Training' },
            { name: 'Data Backup', starter: 'Weekly', growth: 'Daily', scale: 'Real-time', enterprise: 'Real-time + Custom' }
        ]
    }
];

// Helper to get plan by ID
export const getPlanById = (planId: string): Plan | undefined => {
    return PLANS.find(p => p.id === planId);
};

// Helper to check if a module is included in a plan
export const isPlanModuleIncluded = (planId: string, moduleId: string): boolean => {
    const plan = getPlanById(planId);
    return plan ? plan.modules.includes(moduleId) : false;
};
