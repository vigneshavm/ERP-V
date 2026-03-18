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
        const segments = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
        
        const pathMap: Record<string, AppView> = {
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
            'sales/invoice/create': 'SALES_INVOICE',
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
            'suppliers/add': 'VENDORS',
            'suppliers/inflow': 'VENDOR_INFLOW_OUTFLOW',
            'suppliers/groups': 'SUPPLIERS',
            'suppliers/statements': 'SUPPLIER_STATEMENTS',
            'suppliers/ledger': 'SUPPLIER_LEDGER',
            'purchase/new': 'PURCHASE_ENTRY',
            'purchase/orders': 'PURCHASE_ORDER',
            'purchase/grn': 'GOODS_RECEIVED',
            'purchase/grn/new': 'GOODS_RECEIVED',
            'purchase/bills': 'PURCHASE_BILLS',
            'purchase/bills/new': 'PURCHASE_BILLS',
            'purchase/history': 'PURCHASE_HISTORY',
            'purchase/returns': 'PURCHASE_RETURN',
            'purchase/debit-notes': 'DEBIT_NOTES',
            'purchase/payments': 'SUPPLIER_PAYMENTS',
            'purchase/payment-out': 'PURCHASE_PAYMENT_OUT',
            'purchase/payables': 'OUTSTANDING_PAYABLES',
            'purchase/snapshot': 'PAYABLE_SNAPSHOT',
            'purchase/ageing-analysis': 'SUPPLIER_AGEING',
            'purchase/rate-revisions': 'RATE_REVISIONS',
            'purchase/cheques-vault': 'CHEQUES_VAULT',
            'purchase/inflow-outflow': 'VENDOR_INFLOW_OUTFLOW',
            'inventory': 'INVENTORY_ITEMS',
            'inventory/items': 'INVENTORY_ITEMS',
            'inventory/categories': 'ITEM_CATEGORIES',
            'inventory/barcodes': 'BARCODE_GENERATOR',
            'inventory/import': 'BULK_IMPORT',
            'inventory/reprint': 'REPRINT_QUEUE',
            'inventory/export': 'DATA_EXPORT',
            'finance': 'FINANCE',
            'cashbank/cash-in-hand': 'CASH_ACCOUNTS',
            'cashbank/accounts': 'BANK_ACCOUNTS',
            'cashbank/transfers': 'FUND_TRANSFERS',
            'cashbank/reconciliation': 'BANK_RECONCILIATION',
            'cashbank/position': 'BANK_SUMMARY',
            'cashbank/petty-cash': 'PETTY_CASH',
            'finance/journal': 'JOURNAL_ENTRIES',
            'finance/journal/new': 'JOURNAL_ENTRIES',
            'finance/bank-statement': 'BANK_STATEMENT',
            'finance/sms-tracker': 'SMS_TRACKER',
            'finance/budget-tracker': 'BUDGET_TRACKER',
            'finance/agents': 'FINANCE_AGENTS',
            'finance/goals': 'FINANCIAL_GOALS',
            'finance/gst': 'GST_RECONCILIATION',
            'expenses': 'EXPENSES',
            'expenses/tracker': 'EXPENSES',
            'expenses/categories': 'EXPENSE_CATEGORIES',
            'expenses/recurring': 'RECURRING_EXPENSES',
            'expenses/reports': 'EXPENSE_REPORTS',
            'customers': 'CUSTOMER_LIST',
            'customers/ledger': 'CUSTOMER_LEDGER',
            'people': 'HR',
            'people/employees': 'HR',
            'people/employees/leaves': 'LEAVE_MANAGEMENT',
            'people/employees/labor': 'STAFF_MANAGER',
            'people/payroll': 'PAYROLL',
            'people/employees/allowances': 'ALLOWANCE_MANAGER',
            'people/payroll/attendance': 'ATTENDANCE_SUMMARY',
            'people/payroll/structure': 'SALARY_STRUCTURE_MANAGER',
            'people/payroll/run': 'PAYROLL_RUNS',
            'people/attendance': 'ATTENDANCE_BOARD',
            'settings': 'SETTINGS',
            'settings/tenants': 'TENANT_MANAGEMENT',
            'settings/architect': 'TENANT_ARCHITECT',
            'growth': 'GROW',
        };

        // Prefix matching strategy: try the full path, then try stripping segments from the right
        for (let i = segments.length; i > 0; i--) {
            const currentPath = segments.slice(0, i).join('/');
            if (pathMap[currentPath]) return pathMap[currentPath];
        }

        // Fallback to tab param
        const tab = searchParams.get('tab');
        if (tab) return tab as AppView;

        return 'LANDING';
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
