import React from 'react';
import { FileText, ShoppingCart, Receipt, RotateCcw, ClipboardList, DollarSign, Truck } from 'lucide-react';

interface SalesModulePlaceholderProps {
    view: string;
}

/**
 * Placeholder component for Sales module subviews.
 * These will be replaced with actual implementations.
 */
const SalesModulePlaceholder: React.FC<SalesModulePlaceholderProps> = ({ view }) => {
    const viewConfig: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
        SALES_INVOICE: {
            title: 'Sales Invoice',
            description: 'Create and manage sales invoices',
            icon: <FileText className="w-12 h-12" />
        },
        SALES_ORDER: {
            title: 'Sales Order',
            description: 'Manage sales orders and commitments',
            icon: <ShoppingCart className="w-12 h-12" />
        },
        ESTIMATE: {
            title: 'Estimate / Proforma',
            description: 'Create estimates and proforma invoices',
            icon: <Receipt className="w-12 h-12" />
        },
        DELIVERY_CHALLAN: {
            title: 'Delivery Challan',
            description: 'Manage delivery challans for goods dispatch',
            icon: <Truck className="w-12 h-12" />
        },
        CHALLAN_LIST: {
            title: 'Delivery Challan List',
            description: 'View all delivery challans',
            icon: <ClipboardList className="w-12 h-12" />
        },
        PAYMENT_IN: {
            title: 'Payment In',
            description: 'Record payments received from customers',
            icon: <DollarSign className="w-12 h-12" />
        },
        PAYMENT_IN_LIST: {
            title: 'Payment In List',
            description: 'View all incoming payments',
            icon: <ClipboardList className="w-12 h-12" />
        },
        SALES_RETURN: {
            title: 'Sales Return',
            description: 'Process sales returns and credit notes',
            icon: <RotateCcw className="w-12 h-12" />
        },
        RETURNED_ITEMS: {
            title: 'Returned Items',
            description: 'View and manage returned items inventory',
            icon: <ClipboardList className="w-12 h-12" />
        },
        INVOICE_REGISTER: {
            title: 'Invoice Register',
            description: 'Complete register of all sales invoices',
            icon: <ClipboardList className="w-12 h-12" />
        },
        ORDER_REGISTER: {
            title: 'Order Register',
            description: 'Complete register of all sales orders',
            icon: <ClipboardList className="w-12 h-12" />
        }
    };

    const config = viewConfig[view] || {
        title: view,
        description: 'Coming soon',
        icon: <FileText className="w-12 h-12" />
    };

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-neutral-400">
            <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 text-neutral-300 dark:text-neutral-600">
                {config.icon}
            </div>
            <h2 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                {config.title}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                {config.description}
            </p>
            <span className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800">
                Coming Soon
            </span>
        </div>
    );
};

export default SalesModulePlaceholder;
