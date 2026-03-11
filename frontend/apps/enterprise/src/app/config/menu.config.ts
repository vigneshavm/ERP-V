import {
    LayoutDashboard,
    ShoppingCart,
    ShoppingBag,
    Archive,
    Users,
    Truck,
    Landmark,
    Receipt,
    BarChart,
    Settings,
    FileText,
    PieChart,
    Package,
    ArrowRight,
    Target,
    ArrowDownCircle,
    UserCircle,
    ClipboardList,
    DollarSign,
    Briefcase,
    Shield,
    Database,
    Globe,
    Zap,
    MessageCircle,
    RefreshCw,
    Repeat,
    List,
    Printer,
    Upload,
    Download,
    FileSpreadsheet,
    Wrench,
    Grid,
    Rocket,
    Store,
    Megaphone,
    Layers,
    Calendar,
    Building,
    Key,
    Lock,
    TrendingUp,
    CreditCard
} from 'lucide-react';
import { AppView, ModuleType } from "@repo/shared";

export interface MenuItem {
    id: AppView;
    label: string;
    icon?: any;
    path?: string; // Optional, mostly for compatibility
    module: ModuleType;
    children?: MenuItem[];
    isGrow?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
    // --- MAIN ERP ---
    {
        id: 'DASHBOARD',
        label: 'Dashboard',
        icon: LayoutDashboard,
        module: 'DASHBOARD',
        path: '/',
        children: [
            { id: 'DASHBOARD_OVERVIEW', label: 'Overview', icon: LayoutDashboard, module: 'DASHBOARD', path: '/' },
            { id: 'DASHBOARD_SUMMARY', label: 'Summary', icon: ClipboardList, module: 'DASHBOARD', path: '/dashboard/summary' },
        ]
    },
    {
        id: 'POS',
        label: 'Billing',
        icon: ShoppingCart,
        module: 'POS',
        path: '/pos',
        children: [
            { id: 'POS', label: 'Terminal', icon: Printer, module: 'POS', path: '/pos' },
            { id: 'POS_ORDERS', label: 'Orders', icon: List, module: 'POS', path: '/pos/orders' },
            { id: 'POS_RETURNS', label: 'Returns', icon: RotateCcw, module: 'POS', path: '/pos/returns' },
            { id: 'SHIFT_MANAGEMENT', label: 'Shifts', icon: Clock, module: 'POS', path: '/pos/shifts' },
        ]
    },
    {
        id: 'SALES',
        label: 'Sales',
        icon: ShoppingBag,
        module: 'POS',
        path: '/sales',
        children: [
            { id: 'SALES_REGISTER', label: 'Register', icon: FileText, module: 'POS', path: '/sales/register' },
            { id: 'SALES_INVOICE', label: 'Invoice', icon: Plus, module: 'POS', path: '/sales/new' },
            { id: 'ESTIMATE', label: 'Estimates', icon: FileText, module: 'POS', path: '/sales/estimates' },
            { id: 'SALES_ORDER', label: 'Orders', icon: ClipboardList, module: 'POS', path: '/sales/orders' },
            { id: 'DELIVERY_CHALLAN', label: 'Challans', icon: Truck, module: 'POS', path: '/sales/challans' },
            { id: 'SALES_RETURN', label: 'Returns', icon: ArrowDownCircle, module: 'POS', path: '/sales/returns' },
            { id: 'PAYMENT_IN', label: 'Receipts', icon: ArrowRight, module: 'POS', path: '/sales/payments' },
            { id: 'CUSTOMER_CREDITS', label: 'Credits', icon: CreditCard, module: 'POS', path: '/sales/credits' },
            { id: 'OUTSTANDING_DUES', label: 'Dues', icon: AlertTriangle, module: 'POS', path: '/sales/dues' },
        ]
    },
    {
        id: 'PURCHASE',
        label: 'Purchase',
        icon: Truck,
        module: 'PURCHASE',
        path: '/purchase',
        children: [
            { id: 'PURCHASE_REGISTER', label: 'Register', icon: FileText, module: 'PURCHASE', path: '/purchase/register' },
            { id: 'VENDORS', label: 'Vendors', icon: Users, module: 'PURCHASE', path: '/suppliers' },
            { id: 'PURCHASE_ENTRY', label: 'New Entry', icon: Plus, module: 'PURCHASE', path: '/purchase/new' },
            { id: 'PURCHASE_ORDER', label: 'Orders', icon: ClipboardList, module: 'PURCHASE', path: '/purchase/orders' },
            { id: 'PURCHASE_ORDER_LIST', label: 'Order List', icon: List, module: 'PURCHASE', path: '/purchase/orders/list' },
            { id: 'PURCHASE_ORDER_FORM', label: 'New Order', icon: Plus, module: 'PURCHASE', path: '/purchase/orders/new' },
            { id: 'GOODS_RECEIVED', label: 'GRN', icon: Package, module: 'PURCHASE', path: '/purchase/grn' },
            { id: 'PURCHASE_BILLS', label: 'Bills', icon: Receipt, module: 'PURCHASE', path: '/purchase/bills' },
            { id: 'PURCHASE_HISTORY', label: 'History', icon: Clock, module: 'PURCHASE', path: '/purchase/history' },
            { id: 'PURCHASE_RETURN', label: 'Returns', icon: RotateCcw, module: 'PURCHASE', path: '/purchase/returns' },
            { id: 'DEBIT_NOTES', label: 'Debit Notes', icon: FileText, module: 'PURCHASE', path: '/purchase/debit-notes' },
            { id: 'SUPPLIER_PAYMENTS', label: 'Payments', icon: ArrowRight, module: 'PURCHASE', path: '/purchase/payments' },
            { id: 'PURCHASE_PAYMENT_OUT', label: 'Payment Out', icon: ArrowRight, module: 'PURCHASE', path: '/purchase/payment-out' },
            { id: 'OUTSTANDING_PAYABLES', label: 'Payables', icon: AlertTriangle, module: 'PURCHASE', path: '/purchase/payables' },
            { id: 'PURCHASE_UPLOAD', label: 'Upload', icon: Upload, module: 'PURCHASE', path: '/purchase/upload' },
            { id: 'RATE_REVISIONS', label: 'Rates', icon: TrendingUp, module: 'PURCHASE', path: '/purchase/rate-revisions' },
            { id: 'CHEQUES_VAULT', label: 'PDC Vault', icon: Shield, module: 'PURCHASE', path: '/purchase/cheques-vault' },
            { id: 'VENDOR_INFLOW_OUTFLOW', label: 'Cashflow', icon: TrendingUp, module: 'PURCHASE', path: '/purchase/inflow-outflow' },
        ]
    },
    {
        id: 'INVENTORY',
        label: 'Inventory',
        icon: Archive,
        module: 'INVENTORY',
        path: '/inventory',
        children: [
            { id: 'INVENTORY_ITEMS', label: 'Items', icon: Package, module: 'INVENTORY', path: '/inventory/items' },
            { id: 'ITEM_CATEGORIES', label: 'Categories', icon: Layers, module: 'INVENTORY', path: '/inventory/categories' },
            { id: 'BATCH_EXPIRY', label: 'Batches', icon: Calendar, module: 'INVENTORY', path: '/inventory/batch-expiry' },
            { id: 'BARCODE_GENERATOR', label: 'Barcodes', icon: Barcode, module: 'INVENTORY', path: '/inventory/barcodes' },
            { id: 'BULK_IMPORT', label: 'Import', icon: Upload, module: 'INVENTORY', path: '/inventory/import' },
            { id: 'REPRINT_QUEUE', label: 'Reprint', icon: Printer, module: 'INVENTORY', path: '/inventory/reprint' },
            { id: 'DATA_EXPORT', label: 'Export', icon: Download, module: 'INVENTORY', path: '/inventory/export' },
        ]
    },
    {
        id: 'FINANCE',
        label: 'Finance',
        icon: Landmark,
        module: 'FINANCE',
        path: '/finance',
        children: [
            { id: 'CASH_ACCOUNTS', label: 'Cash', icon: DollarSign, module: 'FINANCE', path: '/finance/cash' },
            { id: 'BANK_ACCOUNTS', label: 'Bank', icon: Landmark, module: 'FINANCE', path: '/cashbank/accounts' },
            { id: 'PETTY_CASH', label: 'Petty Cash', icon: List, module: 'FINANCE', path: '/finance/petty-cash' },
            { id: 'FUND_TRANSFERS', label: 'Transfers', icon: ArrowRight, module: 'FINANCE', path: '/finance/transfers' },
            { id: 'BANK_RECONCILIATION', label: 'Reconciliation', icon: RefreshCw, module: 'FINANCE', path: '/finance/reconciliation' },
            { id: 'BANK_SUMMARY', label: 'Summary', icon: FileText, module: 'FINANCE', path: '/finance/summary' },
            { id: 'LOAN_ACCOUNTS', label: 'Loans', icon: CreditCard, module: 'FINANCE', path: '/finance/loans' },
            { id: 'FINANCIAL_GOALS', label: 'Goals', icon: Target, module: 'FINANCE', path: '/finance/goals' },
            { id: 'BANK_STATEMENT', label: 'Statements', icon: Upload, module: 'FINANCE', path: '/finance/bank-statement' },
            { id: 'SMS_TRACKER', label: 'SMS Tracker', icon: MessageCircle, module: 'FINANCE', path: '/finance/sms-tracker' },
            { id: 'GST_RECONCILIATION', label: 'GST', icon: FileText, module: 'FINANCE', path: '/finance/gst' },
            { id: 'JOURNAL_ENTRIES', label: 'Journal', icon: FileText, module: 'FINANCE', path: '/finance/journal' },
        ]
    },
    {
        id: 'EXPENSES',
        label: 'Expenses',
        icon: Receipt,
        module: 'EXPENSES',
        path: '/expenses',
        children: [
            { id: 'EXPENSES', label: 'Tracker', icon: Receipt, module: 'EXPENSES', path: '/expenses/tracker' },
            { id: 'EXPENSE_CATEGORIES', label: 'Categories', icon: Layers, module: 'EXPENSES', path: '/expenses/categories' },
            { id: 'RECURRING_EXPENSES', label: 'Recurring', icon: Repeat, module: 'EXPENSES', path: '/expenses/recurring' },
            { id: 'EXPENSE_REPORTS', label: 'Reports', icon: PieChart, module: 'EXPENSES', path: '/expenses/reports' },
            { id: 'BUDGET_TRACKER', label: 'Budget Tracker', icon: Target, module: 'EXPENSES', path: '/finance/budget-tracker' },
        ]
    },
    {
        id: 'CUSTOMERS',
        label: 'Customers',
        icon: Users,
        module: 'CUSTOMERS',
        path: '/customers',
        children: [
            { id: 'CUSTOMER_LIST', label: 'Directory', icon: Users, module: 'CUSTOMERS', path: '/customers' },
            { id: 'CUSTOMER_LEDGER', label: 'Ledger', icon: FileText, module: 'CUSTOMERS', path: '/customers/ledger' },
        ]
    },
    {
        id: 'SUPPLIERS',
        label: 'Suppliers',
        icon: Truck,
        module: 'SUPPLIERS',
        path: '/suppliers',
        children: [
            { id: 'SUPPLIER_LIST', label: 'Directory', icon: Truck, module: 'SUPPLIERS', path: '/suppliers' },
            { id: 'SUPPLIER_LEDGER', label: 'Ledger', icon: FileText, module: 'SUPPLIERS', path: '/suppliers/ledger' },
        ]
    },
    {
        id: 'HR',
        label: 'Staff',
        icon: Briefcase,
        module: 'HR',
        path: '/staff',
        children: [
            { id: 'STAFF_MANAGER', label: 'Staff Management', icon: Users, module: 'HR', path: '/people/employees/labor' },
            { id: 'PAYROLL', label: 'Payroll', icon: DollarSign, module: 'HR', path: '/people/payroll' },
            { id: 'ALLOWANCE_MANAGER', label: 'Allowances', icon: List, module: 'HR', path: '/people/employees/allowances' },
            { id: 'ATTENDANCE_SUMMARY', label: 'Attendance', icon: Clock, module: 'HR', path: '/people/payroll/attendance' },
            { id: 'ATTENDANCE_BOARD', label: 'Daily Board', icon: ClipboardList, module: 'HR', path: '/people/attendance' },
        ]
    },
    {
        id: 'STOREFRONT',
        label: 'Storefront',
        icon: Globe,
        module: 'ECOMMERCE',
        children: [
            { id: 'STOREFRONT', label: 'Store', icon: Store, module: 'ECOMMERCE' },
        ]
    },
    {
        id: 'REPORTS',
        label: 'Insights',
        icon: PieChart,
        module: 'REPORTS',
        children: [
            { id: 'REPORTS', label: 'Reports', icon: PieChart, module: 'REPORTS' },
            { id: 'REPORT_SALES', label: 'Sales', icon: BarChart, module: 'REPORTS' },
        ]
    },
    {
        id: 'SETTINGS',
        label: 'System',
        icon: Settings,
        module: 'DASHBOARD',
        path: '/settings',
        children: [
            { id: 'SETTINGS', label: 'General', icon: Settings, module: 'DASHBOARD', path: '/settings' },
            { id: 'SYNC_SHARE', label: 'Sync', icon: RefreshCw, module: 'DASHBOARD', path: '/settings/sync' },
            { id: 'RESTORE', label: 'Restore', icon: Upload, module: 'DASHBOARD', path: '/settings/restore' },
            { id: 'TENANT_MANAGEMENT', label: 'Tenants', icon: Building, module: 'MULTI_BRANCH', path: '/settings/tenants' },
            { id: 'TENANT_ARCHITECT', label: 'Architect', icon: Wrench, module: 'MULTI_BRANCH', path: '/settings/architect' },
            { id: 'AUDIT_LOGS', label: 'Audit', icon: Shield, module: 'DASHBOARD', path: '/settings/audit' },
            { id: 'SUPER_ADMIN_CONSOLE', label: 'Admin', icon: Shield, module: 'DASHBOARD', path: '/settings/super-admin' },
        ]
    },

    // --- GROWTH PLATFORM ---
    {
        id: 'GROW',
        label: 'Growth Platform',
        icon: Rocket,
        module: 'GROW',
        isGrow: true,
        children: [
            { id: 'GROW', label: 'Dashboard', icon: Rocket, module: 'GROW', isGrow: true },
            { id: 'GROW_GOOGLE', label: 'Google', icon: Globe, module: 'GROW', isGrow: true },
            { id: 'GROW_MARKETING', label: 'Marketing', icon: Megaphone, module: 'GROW', isGrow: true },
            { id: 'GROW_ENGAGEMENT', label: 'Engagement', icon: MessageCircle, module: 'GROW', isGrow: true },
            { id: 'GROW_SYNC', label: 'Sync', icon: RefreshCw, module: 'GROW', isGrow: true },
            { id: 'GROW_DATA', label: 'Data', icon: Database, module: 'GROW', isGrow: true },
        ]
    }
];

// Helper Imports (to avoid errors if Lucide exports differ)
import { Clock, Plus, RotateCcw, AlertTriangle, Barcode } from 'lucide-react';

