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
    ArrowDownCircle,
    UserCircle,
    ClipboardList,
    DollarSign,
    CreditCard,
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
    TrendingUp
} from 'lucide-react';
import { AppView, ModuleType } from '../types/common';

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
            { id: 'DASHBOARD_SNAPSHOT', label: 'Business Snapshot', icon: PieChart, module: 'DASHBOARD', path: '/dashboard/snapshot' },
            { id: 'DASHBOARD_SUMMARY', label: 'Today\'s Summary', icon: ClipboardList, module: 'DASHBOARD', path: '/dashboard/summary' },
            { id: 'PROFIT_PULSE', label: 'Profit Pulse', icon: BarChart, module: 'DASHBOARD', path: '/dashboard/profit-pulse' },
        ]
    },
    {
        id: 'POS',
        label: 'POS',
        icon: ShoppingCart,
        module: 'POS',
        path: '/pos',
        children: [
            { id: 'POS', label: 'Billing Terminal', icon: Printer, module: 'POS', path: '/pos' },
            { id: 'POS_ORDERS', label: 'Order History', icon: List, module: 'POS', path: '/pos/orders' },
            { id: 'POS_RETURNS', label: 'Returns', icon: RotateCcw, module: 'POS', path: '/pos/returns' },
            { id: 'SHIFT_MANAGEMENT', label: 'Shift Management', icon: Clock, module: 'POS', path: '/pos/shifts' },
        ]
    },
    {
        id: 'SALES',
        label: 'Sales',
        icon: ShoppingBag,
        module: 'POS',
        path: '/sales',
        children: [
            { id: 'SALES_REGISTER', label: 'Sales Register', icon: FileText, module: 'POS', path: '/sales/register' },
            { id: 'SALES_INVOICE', label: 'Create Invoice', icon: Plus, module: 'POS', path: '/sales/new' },
            { id: 'ESTIMATE', label: 'Estimates / Quotes', icon: FileText, module: 'POS', path: '/sales/estimates' },
            { id: 'SALES_ORDER', label: 'Sales Orders', icon: ClipboardList, module: 'POS', path: '/sales/orders' },
            { id: 'DELIVERY_CHALLAN', label: 'Delivery Challans', icon: Truck, module: 'POS', path: '/sales/challans' },
            { id: 'SALES_RETURN', label: 'Sales Returns', icon: ArrowDownCircle, module: 'POS', path: '/sales/returns' },
            { id: 'PAYMENT_IN', label: 'Payments In', icon: ArrowRight, module: 'POS', path: '/sales/payments' },
            { id: 'CUSTOMER_CREDITS', label: 'Customer Credits', icon: CreditCard, module: 'POS', path: '/sales/credits' },
            { id: 'OUTSTANDING_DUES', label: 'Outstanding Dues', icon: AlertTriangle, module: 'POS', path: '/sales/dues' },
        ]
    },
    {
        id: 'PURCHASE',
        label: 'Purchase',
        icon: Truck,
        module: 'PURCHASE',
        path: '/purchase',
        children: [
            { id: 'PURCHASE_REGISTER', label: 'Purchase Register', icon: FileText, module: 'PURCHASE', path: '/purchase/register' },
            { id: 'VENDORS', label: 'Vendors', icon: Users, module: 'PURCHASE', path: '/suppliers' },
            { id: 'PURCHASE_ENTRY', label: 'New Purchase', icon: Plus, module: 'PURCHASE', path: '/purchase/new' },
            { id: 'PURCHASE_ORDER', label: 'Purchase Orders', icon: ClipboardList, module: 'PURCHASE', path: '/purchase/orders' },
            { id: 'PURCHASE_ORDER_LIST', label: 'Order List', icon: List, module: 'PURCHASE', path: '/purchase/orders/list' },
            { id: 'PURCHASE_ORDER_FORM', label: 'Create Order', icon: Plus, module: 'PURCHASE', path: '/purchase/orders/new' },
            { id: 'GOODS_RECEIVED', label: 'Goods Received (GRN)', icon: Package, module: 'PURCHASE', path: '/purchase/grn' },
            { id: 'PURCHASE_BILLS', label: 'Bills', icon: Receipt, module: 'PURCHASE', path: '/purchase/bills' },
            { id: 'PURCHASE_HISTORY', label: 'Purchase History', icon: Clock, module: 'PURCHASE', path: '/purchase/history' },
            { id: 'PURCHASE_RETURN', label: 'Purchase Returns', icon: RotateCcw, module: 'PURCHASE', path: '/purchase/returns' },
            { id: 'DEBIT_NOTES', label: 'Debit Notes', icon: FileText, module: 'PURCHASE', path: '/purchase/debit-notes' },
            { id: 'SUPPLIER_PAYMENTS', label: 'Supplier Payments', icon: ArrowRight, module: 'PURCHASE', path: '/purchase/payments' },
            { id: 'PURCHASE_PAYMENT_OUT', label: 'Payment Out', icon: ArrowRight, module: 'PURCHASE', path: '/purchase/payment-out' },
            { id: 'OUTSTANDING_PAYABLES', label: 'Outstanding Payables', icon: AlertTriangle, module: 'PURCHASE', path: '/purchase/payables' },
            { id: 'PURCHASE_UPLOAD', label: 'Upload Purchase', icon: Upload, module: 'PURCHASE', path: '/purchase/upload' },
            { id: 'RATE_REVISIONS', label: 'Rate Revisions', icon: TrendingUp, module: 'PURCHASE', path: '/purchase/rate-revisions' },
            { id: 'CHEQUES_VAULT', label: 'PDC Vault', icon: Shield, module: 'PURCHASE', path: '/purchase/cheques-vault' },
        ]
    },
    {
        id: 'INVENTORY',
        label: 'Inventory',
        icon: Archive,
        module: 'INVENTORY',
        path: '/inventory',
        children: [
            { id: 'INVENTORY_ITEMS', label: 'Item Manager', icon: Package, module: 'INVENTORY', path: '/inventory/items' },
            { id: 'ITEM_CATEGORIES', label: 'Categories', icon: Layers, module: 'INVENTORY', path: '/inventory/categories' },
            { id: 'BATCH_EXPIRY', label: 'Batch & Expiry', icon: Calendar, module: 'INVENTORY', path: '/inventory/batch-expiry' },
            { id: 'BARCODE_GENERATOR', label: 'Barcode Creator', icon: Barcode, module: 'INVENTORY', path: '/inventory/barcodes' },
            { id: 'BULK_IMPORT', label: 'Bulk Import', icon: Upload, module: 'INVENTORY', path: '/inventory/import' },
            { id: 'DATA_EXPORT', label: 'Data Export', icon: Download, module: 'INVENTORY', path: '/inventory/export' },
        ]
    },
    {
        id: 'FINANCE',
        label: 'Financials',
        icon: Landmark,
        module: 'FINANCE',
        path: '/finance',
        children: [
            { id: 'CASH_ACCOUNTS', label: 'Cash In Hand', icon: DollarSign, module: 'FINANCE', path: '/finance/cash' },
            { id: 'BANK_ACCOUNTS', label: 'Bank Accounts', icon: Landmark, module: 'FINANCE', path: '/finance/bank' },
            { id: 'PETTY_CASH', label: 'Petty Cash', icon: List, module: 'FINANCE', path: '/finance/petty-cash' },
            { id: 'FUND_TRANSFERS', label: 'Fund Transfers', icon: ArrowRight, module: 'FINANCE', path: '/finance/transfers' },
            { id: 'BANK_RECONCILIATION', label: 'Reconciliation', icon: RefreshCw, module: 'FINANCE', path: '/finance/reconciliation' },
            { id: 'BANK_SUMMARY', label: 'Bank Summary', icon: FileText, module: 'FINANCE', path: '/finance/summary' },
        ]
    },
    {
        id: 'EXPENSES',
        label: 'Expenses',
        icon: Receipt,
        module: 'EXPENSES',
        path: '/expenses',
        children: [
            { id: 'EXPENSES', label: 'Expense Tracker', icon: Receipt, module: 'EXPENSES', path: '/expenses/tracker' },
            { id: 'EXPENSE_CATEGORIES', label: 'Categories', icon: Layers, module: 'EXPENSES', path: '/expenses/categories' },
            { id: 'RECURRING_EXPENSES', label: 'Recurring', icon: Repeat, module: 'EXPENSES', path: '/expenses/recurring' },
            { id: 'EXPENSE_REPORTS', label: 'Expense Reports', icon: PieChart, module: 'EXPENSES', path: '/expenses/reports' },
        ]
    },
    {
        id: 'CUSTOMERS',
        label: 'People: Customers',
        icon: Users,
        module: 'CUSTOMERS',
        path: '/customers',
        children: [
            { id: 'CUSTOMER_LIST', label: 'Customer List', icon: Users, module: 'CUSTOMERS', path: '/customers' },
            { id: 'CUSTOMER_LEDGER', label: 'Customer Ledger', icon: FileText, module: 'CUSTOMERS', path: '/customers/ledger' },
        ]
    },
    {
        id: 'SUPPLIERS',
        label: 'People: Suppliers',
        icon: Truck,
        module: 'SUPPLIERS',
        path: '/suppliers',
        children: [
            { id: 'SUPPLIER_LIST', label: 'Supplier List', icon: Truck, module: 'SUPPLIERS', path: '/suppliers' },
            { id: 'SUPPLIER_LEDGER', label: 'Supplier Ledger', icon: FileText, module: 'SUPPLIERS', path: '/suppliers/ledger' },
        ]
    },
    {
        id: 'HR',
        label: 'People: Staff',
        icon: Briefcase,
        module: 'HR',
        path: '/staff',
        children: [
            { id: 'STAFF_MANAGER', label: 'Staff Directory', icon: Users, module: 'HR', path: '/staff/directory' },
            { id: 'LABOR', label: 'Labor Management', icon: Wrench, module: 'HR', path: '/staff/labor' },
            { id: 'PAYROLL', label: 'Payroll', icon: DollarSign, module: 'HR', path: '/staff/payroll' },
            { id: 'ATTENDANCE', label: 'Attendance', icon: Clock, module: 'HR', path: '/staff/attendance' },
        ]
    },
    {
        id: 'STOREFRONT',
        label: 'Online Store',
        icon: Globe,
        module: 'ECOMMERCE',
        children: [
            { id: 'STOREFRONT', label: 'Store Management', icon: Store, module: 'ECOMMERCE' },
        ]
    },
    {
        id: 'REPORTS',
        label: 'Reports & Analytics',
        icon: PieChart,
        module: 'REPORTS',
        children: [
            { id: 'REPORTS', label: 'Report Center', icon: PieChart, module: 'REPORTS' },
            { id: 'REPORT_SALES', label: 'Sales Reports', icon: BarChart, module: 'REPORTS' },
        ]
    },
    {
        id: 'SETTINGS',
        label: 'System',
        icon: Settings,
        module: 'MULTI_BRANCH',
        path: '/settings',
        children: [
            { id: 'SETTINGS', label: 'General Settings', icon: Settings, module: 'MULTI_BRANCH', path: '/settings' },
            { id: 'SYNC_SHARE', label: 'Sync & Share', icon: RefreshCw, module: 'MULTI_BRANCH', path: '/settings/sync' },
            { id: 'RESTORE', label: 'Restore Data', icon: Upload, module: 'MULTI_BRANCH', path: '/settings/restore' },
            { id: 'TENANT_MANAGEMENT', label: 'Tenant Management', icon: Building, module: 'MULTI_BRANCH', path: '/settings/tenants' },
            { id: 'TENANT_ARCHITECT', label: 'Tenant Architect', icon: Wrench, module: 'MULTI_BRANCH', path: '/settings/architect' },
            { id: 'SUPER_ADMIN_CONSOLE', label: 'Super Admin Console', icon: Shield, module: 'MULTI_BRANCH', path: '/settings/super-admin' },
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
            { id: 'GROW', label: 'Growth Dashboard', icon: Rocket, module: 'GROW', isGrow: true },
            { id: 'GROW_GOOGLE', label: 'Google Business', icon: Globe, module: 'GROW', isGrow: true },
            { id: 'GROW_MARKETING', label: 'Marketing Tools', icon: Megaphone, module: 'GROW', isGrow: true },
            { id: 'GROW_ENGAGEMENT', label: 'Customer Engagement', icon: MessageCircle, module: 'GROW', isGrow: true },
            { id: 'GROW_SYNC', label: 'Sync Center', icon: RefreshCw, module: 'GROW', isGrow: true },
            { id: 'GROW_DATA', label: 'Data Management', icon: Database, module: 'GROW', isGrow: true },
        ]
    }
];

// Helper Imports (to avoid errors if Lucide exports differ)
import { Clock, Plus, RotateCcw, AlertTriangle, Barcode } from 'lucide-react';
