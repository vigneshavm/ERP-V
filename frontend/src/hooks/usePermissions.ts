import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { AppView, ModuleType } from "../types/common";
import { DbRoleCode } from "../types/tenant";

// Mapping views to their required modules for routing and guards
// Values must be from ModuleType canonical keys
const VIEW_TO_MODULE: Partial<Record<AppView, ModuleType>> = {
    // DASHBOARD
    'DASHBOARD': 'DASHBOARD',
    'DASHBOARD_OVERVIEW': 'DASHBOARD',
    'DASHBOARD_SNAPSHOT': 'DASHBOARD',
    'DASHBOARD_SUMMARY': 'DASHBOARD',
    'PROFIT_PULSE': 'DASHBOARD',
    'UTILITIES': 'DASHBOARD',
    'SETTINGS': 'DASHBOARD',

    // POS (Sales & POS)
    'POS': 'POS',
    'POS_ORDERS': 'POS',
    'POS_RETURNS': 'POS',
    'SHIFT_MANAGEMENT': 'POS',
    'CASH_DRAWER': 'POS',
    'SALES_INVOICE': 'POS',
    'SALES_REGISTER': 'POS',
    'ESTIMATE': 'POS',
    'SALES_ORDER': 'POS',
    'DELIVERY_CHALLAN': 'POS',
    'SALES_RETURN': 'POS',
    'PAYMENT_IN': 'POS',
    'CUSTOMER_CREDITS': 'POS',
    'OUTSTANDING_DUES': 'POS',
    'MRP_PENDING_INVOICES': 'POS',
    'SALES': 'POS',

    // INVENTORY
    'INVENTORY': 'INVENTORY',
    'INVENTORY_ITEMS': 'INVENTORY',
    'ITEM_CATEGORIES': 'INVENTORY',
    'STOCK_SUMMARY': 'INVENTORY',
    'STOCK_MOVEMENT': 'INVENTORY',
    'LOW_STOCK_ALERTS': 'INVENTORY',
    'STOCK_WRITEOFF': 'INVENTORY',
    'STOCK_TRANSFER': 'INVENTORY',
    'UNITS_HSN': 'INVENTORY',
    'WAREHOUSES': 'INVENTORY',
    'BATCH_EXPIRY': 'INVENTORY',
    'AGED_STOCK': 'INVENTORY',
    'BARCODE_GENERATOR': 'INVENTORY',
    'LABEL_PRINTING': 'INVENTORY',
    'BULK_IMPORT': 'INVENTORY',
    'DATA_EXPORT': 'INVENTORY',

    // CUSTOMERS
    'CUSTOMERS': 'CUSTOMERS',
    'CUSTOMER_LIST': 'CUSTOMERS',
    'CUSTOMER_LEDGER': 'CUSTOMERS',
    'CUSTOMER_STATEMENTS': 'CUSTOMERS',
    'CUSTOMER_GROUPS': 'CUSTOMERS',
    'LOYALTY_POINTS': 'CUSTOMERS',

    // SUPPLIERS
    'SUPPLIERS': 'SUPPLIERS',
    'SUPPLIER_LIST': 'SUPPLIERS',
    'SUPPLIER_LEDGER': 'SUPPLIERS',
    'SUPPLIER_STATEMENTS': 'SUPPLIERS',
    'SUPPLIER_GROUPS': 'SUPPLIERS',
    'AGENTS': 'SUPPLIERS',

    // PURCHASE
    'PURCHASE': 'PURCHASE',
    'PURCHASE_REGISTER': 'PURCHASE',
    'PURCHASE_ENTRY': 'PURCHASE',
    'PURCHASE_ORDER': 'PURCHASE',
    'PURCHASE_ORDER_LIST': 'PURCHASE',
    'PURCHASE_ORDER_FORM': 'PURCHASE',
    'PURCHASE_ORDER_DETAILS': 'PURCHASE',
    'GOODS_RECEIVED': 'PURCHASE',
    'GRN_TRANSFER': 'PURCHASE',
    'GRN_FORM': 'PURCHASE',
    'PURCHASE_BILLS': 'PURCHASE',
    'BILL_FORM': 'PURCHASE',
    'PURCHASE_PAYMENT_OUT': 'PURCHASE',
    'PURCHASE_HISTORY': 'PURCHASE',
    'PURCHASE_RETURN': 'PURCHASE',
    'PURCHASE_RETURNS': 'PURCHASE',
    'PURCHASE_RETURN_FORM': 'PURCHASE',
    'PURCHASE_UPLOAD': 'PURCHASE',
    'DEBIT_NOTES': 'PURCHASE',
    'SUPPLIER_PAYMENTS': 'PURCHASE',
    'OUTSTANDING_PAYABLES': 'PURCHASE',
    'VENDOR_INFLOW_OUTFLOW': 'PURCHASE',
    'SUPPLIER_AGEING': 'PURCHASE',
    'RATE_REVISIONS': 'PURCHASE',
    'CHEQUES_VAULT': 'PURCHASE',

    // FINANCE
    'FINANCE': 'FINANCE',
    'CASH_ACCOUNTS': 'FINANCE',
    'BANK_ACCOUNTS': 'FINANCE',
    'PETTY_CASH': 'FINANCE',
    'FUND_TRANSFERS': 'FINANCE',
    'BANK_RECONCILIATION': 'FINANCE',
    'BANK_STATEMENT': 'FINANCE',
    'LOAN_ACCOUNTS': 'FINANCE',
    'BANK_SUMMARY': 'FINANCE',
    'FINANCIAL_GOALS': 'FINANCE',
    'SMS_TRACKER': 'FINANCE',
    'GST_RECONCILIATION': 'FINANCE',
    'JOURNAL_ENTRIES': 'FINANCE',
    'EMI_PLANS': 'FINANCE',
    'CARD_TERMINALS': 'FINANCE',

    // EXPENSES
    'EXPENSES': 'EXPENSES',
    'EXPENSE_CATEGORIES': 'EXPENSES',
    'RECURRING_EXPENSES': 'EXPENSES',
    'EXPENSE_REPORTS': 'EXPENSES',
    'BUDGET_TRACKER': 'EXPENSES',

    // REPORTS
    'REPORTS': 'REPORTS',
    'REPORT_SALES': 'REPORTS',
    'REPORT_PURCHASE': 'REPORTS',
    'REPORT_INVENTORY': 'REPORTS',
    'REPORT_CUSTOMER': 'REPORTS',
    'REPORT_SUPPLIER': 'REPORTS',
    'REPORT_TAX': 'REPORTS',
    'REPORT_FINANCIAL': 'REPORTS',
    'DAY_BOOK': 'REPORTS',
    'TRIAL_BALANCE': 'REPORTS',
    'PROFIT_LOSS': 'REPORTS',
    'BALANCE_SHEET': 'REPORTS',
    'CASH_FLOW': 'REPORTS',

    // HR
    'HR': 'HR',
    'LABOR': 'HR',
    'STAFF_MANAGER': 'HR',
    'PAYROLL': 'HR',
    'ATTENDANCE_SUMMARY': 'HR',
    'ATTENDANCE_BOARD': 'HR',
    'ALLOWANCE_MANAGER': 'HR',
    'COMMISSION_MANAGEMENT': 'HR',

    // POS Additional
    'DUE_ADJUSTMENT': 'POS',

    // ECOMMERCE
    'GROW_STORE': 'ECOMMERCE',
    'GROW_STORE_SETUP': 'ECOMMERCE',
    'GROW_PRODUCT_SYNC': 'ECOMMERCE',
    'GROW_STORE_ORDERS': 'ECOMMERCE',
    'GROW_STORE_CUSTOMERS': 'ECOMMERCE',
    'GROW_STORE_PAYMENTS': 'ECOMMERCE',
    'GROW_STORE_THEMES': 'ECOMMERCE',
    'GROW_STORE_DOMAIN': 'ECOMMERCE',
    'GROW_STORE_SHIPPING': 'ECOMMERCE',

    // MULTI_BRANCH
    'BRANCH_SETTINGS': 'MULTI_BRANCH',

    // GROW (General Analytics & Sync)
    'GROW': 'GROW',
    'GROW_DASHBOARD': 'GROW',
    'GROW_OVERVIEW': 'GROW',
    'GROW_PERFORMANCE': 'GROW',
    'GROW_MARKETING_METRICS': 'GROW',
    'GROW_DATA': 'GROW',
    'GROW_MARKETING_CAMPAIGNS': 'GROW',
    'GROW_MARKETING_TEMPLATES': 'GROW',
    'GROW_MARKETING_EMAIL': 'GROW',
    'GROW_ENGAGEMENT_EMAIL': 'GROW',
    'GROW_MARKETING_WHATSAPP': 'GROW',
    'GROW_ENGAGEMENT_WHATSAPP': 'GROW',
    'GROW_MARKETING_SOCIAL': 'GROW',
    'GROW_MARKETING_COUPONS': 'GROW',
    'GROW_MARKETING_OFFERS': 'GROW',
    'GROW_REPORTS': 'GROW',
    'GROW_REPORT_ROI': 'GROW',
    'GROW_REPORT_TRAFFIC': 'GROW',
    'GROW_REPORT_CONVERSION': 'GROW',
    'GROW_SUPER_ADMIN_CONSOLE': 'GROW',
    'GROW_TENANT_CONFIG': 'GROW',

    // WHOLESALE/RETAIL (WR) BILLING -- sales-side screens ride the POS module gate (same as
    // SALES_INVOICE), purchase-side rides PURCHASE (same as PURCHASE_ENTRY), reports ride REPORTS.
    'WR_COUNTER': 'POS',
    'WR_SALES_ENTRY': 'POS',
    'WR_SALES_BILL_VIEW': 'POS',
    'WR_PURCHASE_ENTRY': 'PURCHASE',
    'WR_PURCHASE_BILL_VIEW': 'PURCHASE',
    'WR_SALES_REPORT': 'REPORTS',
    'WR_STOCK_REPORT': 'REPORTS'
};

export const usePermissions = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { rolePermissions } = useSelector((state: RootState) => state.settings);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const checkModuleAccess = (module: ModuleType): boolean => {
        if (!user) return false;

        // 1. Resolve Tenant ID (Handle both String and Object)
        // Backend returns user.tenantId as populated object, but frontend types might expect string.
        const userTenantId = (user.tenantId as any)?._id || user.tenantId;

        // 2. Try to find in loaded tenants list
        let tenant = tenants.find(t => t.id === userTenantId);

        // 3. Critical Fallback: Use the user.tenantId object directly if it contains module data
        // This fixes the issue where 'tenants' list is empty (e.g. for Co-Owners)
        if (!tenant && typeof user.tenantId === 'object' && (user.tenantId as any)?.modules) {
            tenant = user.tenantId as any;
        }

        // 4. Last Resort: Default to first available tenant (Dev/Single-Tenant mode)
        if (!tenant && tenants.length > 0) {
            tenant = tenants[0];
        }

        if (!tenant) {
            return false;
        }

        // Core modules that are always available if they are logged in
        if (['DASHBOARD', 'FINANCE', 'POS', 'PURCHASE', 'INVENTORY', 'EXPENSES', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'HR'].includes(module)) return true;

        const hasModule = (tenant.modules || []).includes(module);
        return hasModule;
    };

    const checkAccess = (view: AppView): boolean => {
        if (!user) return false;


        if (view === 'GROW_SUPER_ADMIN_CONSOLE' && user.systemRole !== 'SuperAdmin') return false;

        // 1. SuperAdmin Bypass for core infrastructure
        if (user.systemRole === 'SuperAdmin') {
            const infraViews: AppView[] = ['GROW_SUPER_ADMIN_CONSOLE', 'GROW_TENANT_CONFIG', 'GROW_DASHBOARD', 'DASHBOARD'];
            if (infraViews.includes(view)) return true;
        }

        // 2. Check Role-based Permissions (Staff Role)
        // API returns 'role', but types might expect 'systemRole'. Fallback to 'role'.
        let roleCodeRaw = (user.systemRole || user.role || 'staff').toLowerCase();

        // Handle Co-Owner hyphen mismatch
        if (roleCodeRaw === 'coowner') {
            roleCodeRaw = 'co-owner';
        }

        // Manual Override for specific user request
        if (user.email === 'avmvignesh0207@gmail.com') {
            roleCodeRaw = 'owner';
        }

        const effectiveRoleCode = roleCodeRaw as DbRoleCode;
        const allowedViews = rolePermissions[effectiveRoleCode] || [];

        if (!allowedViews.includes(view)) return false;

        // 2. Check Module-based Permissions (Tenant Plan)
        const requiredModule = VIEW_TO_MODULE[view];
        if (requiredModule && !checkModuleAccess(requiredModule)) {
            return false;
        }

        return true;
    };

    return { checkAccess, checkModuleAccess, user };
};
