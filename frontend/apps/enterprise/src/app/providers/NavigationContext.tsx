"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppView } from '@repo/shared';

interface NavigationContextType {
    currentView: AppView;
    setCurrentView: (view: AppView) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // Mapping path to view
    const getViewFromPath = (path: string): AppView => {
        // BrowserRouter manages basename (/enterprise), so pathname is already relative to it
        const cleanPath = path === '/' ? '' : path.replace(/^\/|\/$/g, '');

        // Tab-based mapping (for legacy /?tab=...)
        const tab = searchParams.get('tab');
        if (tab) return tab as AppView;

        const pathMap: Record<string, AppView> = {
            '': 'LANDING',
            'landing': 'LANDING',
            'demo': 'LANDING',
            'dashboard': 'DASHBOARD',
            'dashboard/summary': 'DASHBOARD_SUMMARY',
            'pos': 'POS',
            'pos/orders': 'POS_ORDERS',
            'pos/returns': 'POS_RETURNS',
            'pos/shifts': 'SHIFT_MANAGEMENT',
            'sales': 'SALES',
            'sales/register': 'SALES_REGISTER',
            'sales/new': 'SALES_INVOICE',
            'sales/estimates': 'ESTIMATE',
            'sales/orders': 'SALES_ORDER',
            'sales/challans': 'DELIVERY_CHALLAN',
            'sales/returns': 'SALES_RETURN',
            'sales/payments': 'PAYMENT_IN',
            'sales/credits': 'CUSTOMER_CREDITS',
            'sales/dues': 'OUTSTANDING_DUES',
            'purchase': 'PURCHASE',
            'purchase/register': 'PURCHASE_REGISTER',
            'suppliers': 'SUPPLIER_LIST',
            'purchase/new': 'PURCHASE_ENTRY',
            'purchase/orders': 'PURCHASE_ORDER',
            'purchase/grn': 'GOODS_RECEIVED',
            'purchase/bills': 'PURCHASE_BILLS',
            'purchase/history': 'PURCHASE_HISTORY',
            'purchase/returns': 'PURCHASE_RETURN',
            'purchase/debit-notes': 'DEBIT_NOTES',
            'purchase/payments': 'SUPPLIER_PAYMENTS',
            'purchase/payment-out': 'PURCHASE_PAYMENT_OUT',
            'purchase/payables': 'OUTSTANDING_PAYABLES',
            'purchase/upload': 'PURCHASE_UPLOAD',
            'purchase/rate-revisions': 'RATE_REVISIONS',
            'purchase/cheques-vault': 'CHEQUES_VAULT',
            'purchase/inflow-outflow': 'VENDOR_INFLOW_OUTFLOW',
            'inventory': 'INVENTORY',
            'inventory/items': 'INVENTORY_ITEMS',
            'inventory/categories': 'ITEM_CATEGORIES',
            'inventory/batch-expiry': 'BATCH_EXPIRY',
            'inventory/barcodes': 'BARCODE_GENERATOR',
            'inventory/import': 'BULK_IMPORT',
            'inventory/reprint': 'REPRINT_QUEUE',
            'inventory/export': 'DATA_EXPORT',
            'finance': 'FINANCE',
            'finance/cash': 'CASH_ACCOUNTS',
            'cashbank/accounts': 'BANK_ACCOUNTS',
            'finance/petty-cash': 'PETTY_CASH',
            'finance/transfers': 'FUND_TRANSFERS',
            'finance/reconciliation': 'BANK_RECONCILIATION',
            'finance/summary': 'BANK_SUMMARY',
            'finance/loans': 'LOAN_ACCOUNTS',
            'finance/goals': 'FINANCIAL_GOALS',
            'finance/bank-statement': 'BANK_STATEMENT',
            'finance/sms-tracker': 'SMS_TRACKER',
            'finance/gst': 'GST_RECONCILIATION',
            'finance/journal': 'JOURNAL_ENTRIES',
            'expenses': 'EXPENSES',
            'expenses/tracker': 'EXPENSES',
            'expenses/categories': 'EXPENSE_CATEGORIES',
            'expenses/recurring': 'RECURRING_EXPENSES',
            'expenses/reports': 'EXPENSE_REPORTS',
            'finance/budget-tracker': 'BUDGET_TRACKER',
            'customers': 'CUSTOMER_LIST',
            'customers/ledger': 'CUSTOMER_LEDGER',
            'staff': 'HR',
            'people/employees/labor': 'STAFF_MANAGER',
            'people/payroll': 'PAYROLL',
            'people/employees/allowances': 'ALLOWANCE_MANAGER',
            'people/payroll/attendance': 'ATTENDANCE_SUMMARY',
            'people/attendance': 'ATTENDANCE_BOARD',
            'settings': 'SETTINGS',
            'settings/sync': 'SYNC_SHARE',
            'settings/restore': 'RESTORE',
            'settings/tenants': 'TENANT_MANAGEMENT',
            'settings/architect': 'TENANT_ARCHITECT',
            'settings/audit': 'AUDIT_LOGS',
            'settings/super-admin': 'SUPER_ADMIN_CONSOLE',
            'growth': 'GROW',
        };

        return pathMap[cleanPath] || 'LANDING';
    };

    const [currentView, setCurrentViewInternal] = useState<AppView>(() => getViewFromPath(pathname));

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
        setCurrentViewInternal(getViewFromPath(pathname));
    }, [pathname, searchParams]);

    const setCurrentView = (view: AppView) => {
        const viewToPath: Partial<Record<AppView, string>> = {
            'LANDING': '/',
            'DASHBOARD': '/dashboard',
            'DASHBOARD_OVERVIEW': '/dashboard',
            'DASHBOARD_SUMMARY': '/dashboard/summary',
            'POS': '/pos',
            'POS_ORDERS': '/pos/orders',
            'POS_RETURNS': '/pos/returns',
            'SHIFT_MANAGEMENT': '/pos/shifts',
            'SALES': '/sales',
            'SALES_REGISTER': '/sales/register',
            'SALES_INVOICE': '/sales/new',
            'ESTIMATE': '/sales/estimates',
            'SALES_ORDER': '/sales/orders',
            'DELIVERY_CHALLAN': '/sales/challans',
            'SALES_RETURN': '/sales/returns',
            'PAYMENT_IN': '/sales/payments',
            'CUSTOMER_CREDITS': '/sales/credits',
            'OUTSTANDING_DUES': '/sales/dues',
            'PURCHASE': '/purchase',
            'PURCHASE_REGISTER': '/purchase/register',
            'VENDORS': '/suppliers',
            'PURCHASE_ENTRY': '/purchase/new',
            'PURCHASE_ORDER': '/purchase/orders',
            'GOODS_RECEIVED': '/purchase/grn',
            'PURCHASE_BILLS': '/purchase/bills',
            'PURCHASE_HISTORY': '/purchase/history',
            'PURCHASE_RETURN': '/purchase/returns',
            'DEBIT_NOTES': '/purchase/debit-notes',
            'SUPPLIER_PAYMENTS': '/purchase/payments',
            'PURCHASE_PAYMENT_OUT': '/purchase/payment-out',
            'OUTSTANDING_PAYABLES': '/purchase/payables',
            'PURCHASE_UPLOAD': '/purchase/upload',
            'RATE_REVISIONS': '/purchase/rate-revisions',
            'CHEQUES_VAULT': '/purchase/cheques-vault',
            'VENDOR_INFLOW_OUTFLOW': '/purchase/inflow-outflow',
            'INVENTORY': '/inventory',
            'INVENTORY_ITEMS': '/inventory/items',
            'ITEM_CATEGORIES': '/inventory/categories',
            'BATCH_EXPIRY': '/inventory/batch-expiry',
            'BARCODE_GENERATOR': '/inventory/barcodes',
            'BULK_IMPORT': '/inventory/import',
            'REPRINT_QUEUE': '/inventory/reprint',
            'DATA_EXPORT': '/inventory/export',
            'FINANCE': '/finance',
            'CASH_ACCOUNTS': '/finance/cash',
            'BANK_ACCOUNTS': '/cashbank/accounts',
            'PETTY_CASH': '/finance/petty-cash',
            'FUND_TRANSFERS': '/finance/transfers',
            'BANK_RECONCILIATION': '/finance/reconciliation',
            'BANK_SUMMARY': '/finance/summary',
            'LOAN_ACCOUNTS': '/finance/loans',
            'FINANCIAL_GOALS': '/finance/goals',
            'BANK_STATEMENT': '/finance/bank-statement',
            'SMS_TRACKER': '/finance/sms-tracker',
            'GST_RECONCILIATION': '/finance/gst',
            'JOURNAL_ENTRIES': '/finance/journal',
            'EXPENSES': '/expenses',
            'EXPENSE_CATEGORIES': '/expenses/categories',
            'RECURRING_EXPENSES': '/expenses/recurring',
            'EXPENSE_REPORTS': '/expenses/reports',
            'BUDGET_TRACKER': '/finance/budget-tracker',
            'CUSTOMER_LIST': '/customers',
            'CUSTOMER_LEDGER': '/customers/ledger',
            'SUPPLIER_LIST': '/suppliers',
            'SUPPLIER_LEDGER': '/suppliers/ledger',
            'STAFF_MANAGER': '/people/employees/labor',
            'PAYROLL': '/people/payroll',
            'ALLOWANCE_MANAGER': '/people/employees/allowances',
            'ATTENDANCE_SUMMARY': '/people/payroll/attendance',
            'ATTENDANCE_BOARD': '/people/attendance',
            'SETTINGS': '/settings',
            'SYNC_SHARE': '/settings/sync',
            'RESTORE': '/settings/restore',
            'TENANT_MANAGEMENT': '/settings/tenants',
            'TENANT_ARCHITECT': '/settings/architect',
            'AUDIT_LOGS': '/settings/audit',
            'SUPER_ADMIN_CONSOLE': '/settings/super-admin',
            'GROW': '/growth'
        };

        const path = viewToPath[view];
        if (path) {
            const normalize = (p: string) => p.replace(/\/+$/, '') || '/';
            // BrowserRouter handles the /enterprise basename automatically
            const targetPath = normalize(path);
            const currentPath = normalize(pathname);
            
            if (targetPath !== currentPath) {
                navigate(path);
            }
        } else {
            setCurrentViewInternal(view);
        }
    };

    return (
        <NavigationContext.Provider value={{ currentView, setCurrentView }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
