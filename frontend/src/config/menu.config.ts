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
    Lock
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
        children: [
            { id: 'DASHBOARD_OVERVIEW', label: 'Overview', icon: LayoutDashboard, module: 'DASHBOARD' },
            { id: 'DASHBOARD_SNAPSHOT', label: 'Business Snapshot', icon: PieChart, module: 'DASHBOARD' },
            { id: 'DASHBOARD_SUMMARY', label: 'Today\'s Summary', icon: ClipboardList, module: 'DASHBOARD' },
            { id: 'PROFIT_PULSE', label: 'Profit Pulse', icon: BarChart, module: 'DASHBOARD' },
        ]
    },
    {
        id: 'POS',
        label: 'POS',
        icon: ShoppingCart,
        module: 'POS',
        children: [
            { id: 'POS', label: 'Billing Terminal', icon: Printer, module: 'POS' },
            { id: 'POS_ORDERS', label: 'Order History', icon: List, module: 'POS' },
            { id: 'POS_RETURNS', label: 'Returns', icon: RotateCcw, module: 'POS' }, // Using RotateCcw if imported, or ArrowDownCircle/similar
            { id: 'SHIFT_MANAGEMENT', label: 'Shift Management', icon: Clock, module: 'POS' }, // Clock if imported
        ]
    },
    {
        id: 'SALES',
        label: 'Sales',
        icon: ShoppingBag,
        module: 'POS', // Or SALES if defined
        children: [
            { id: 'SALES_REGISTER', label: 'Sales Register', icon: FileText, module: 'POS' },
            { id: 'SALES_INVOICE', label: 'Create Invoice', icon: Plus, module: 'POS' }, // Plus if imported
            { id: 'ESTIMATE', label: 'Estimates / Quotes', icon: FileText, module: 'POS' },
            { id: 'SALES_ORDER', label: 'Sales Orders', icon: ClipboardList, module: 'POS' },
            { id: 'DELIVERY_CHALLAN', label: 'Delivery Challans', icon: Truck, module: 'POS' },
            { id: 'SALES_RETURN', label: 'Sales Returns', icon: ArrowDownCircle, module: 'POS' },
            { id: 'PAYMENT_IN', label: 'Payments In', icon: ArrowRight, module: 'POS' },
            { id: 'CUSTOMER_CREDITS', label: 'Customer Credits', icon: CreditCard, module: 'POS' },
            { id: 'OUTSTANDING_DUES', label: 'Outstanding Dues', icon: AlertTriangle, module: 'POS' }, // AlertTriangle
        ]
    },
    {
        id: 'PURCHASE',
        label: 'Purchase',
        icon: Truck,
        module: 'PURCHASE',
        children: [
            { id: 'PURCHASE_REGISTER', label: 'Purchase Register', icon: FileText, module: 'PURCHASE' },
            { id: 'PURCHASE_ENTRY', label: 'New Purchase', icon: Plus, module: 'PURCHASE' },
            { id: 'PURCHASE_ORDER', label: 'Purchase Orders', icon: ClipboardList, module: 'PURCHASE' },
            { id: 'GOODS_RECEIVED', label: 'Goods Received (GRN)', icon: Package, module: 'PURCHASE' },
            { id: 'DEBIT_NOTES', label: 'Debit Notes', icon: FileText, module: 'PURCHASE' },
            { id: 'SUPPLIER_PAYMENTS', label: 'Supplier Payments', icon: ArrowRight, module: 'PURCHASE' },
            { id: 'OUTSTANDING_PAYABLES', label: 'Outstanding Payables', icon: AlertTriangle, module: 'PURCHASE' },
        ]
    },
    {
        id: 'INVENTORY',
        label: 'Inventory',
        icon: Archive,
        module: 'INVENTORY',
        children: [
            { id: 'INVENTORY_ITEMS', label: 'Item Manager', icon: Package, module: 'INVENTORY' },
            { id: 'ITEM_CATEGORIES', label: 'Categories', icon: Layers, module: 'INVENTORY' },
            { id: 'BATCH_EXPIRY', label: 'Batch & Expiry', icon: Calendar, module: 'INVENTORY' },
            { id: 'BARCODE_GENERATOR', label: 'Barcode Creator', icon: Barcode, module: 'INVENTORY' }, // Barcode
            { id: 'BULK_IMPORT', label: 'Bulk Import', icon: Upload, module: 'INVENTORY' },
            { id: 'DATA_EXPORT', label: 'Data Export', icon: Download, module: 'INVENTORY' },
        ]
    },
    {
        id: 'FINANCE',
        label: 'Financials',
        icon: Landmark,
        module: 'FINANCE',
        children: [
            { id: 'CASH_ACCOUNTS', label: 'Cash In Hand', icon: DollarSign, module: 'FINANCE' },
            { id: 'BANK_ACCOUNTS', label: 'Bank Accounts', icon: Landmark, module: 'FINANCE' },
            { id: 'PETTY_CASH', label: 'Petty Cash', icon: List, module: 'FINANCE' },
            { id: 'FUND_TRANSFERS', label: 'Fund Transfers', icon: ArrowRight, module: 'FINANCE' },
            { id: 'BANK_RECONCILIATION', label: 'Reconciliation', icon: RefreshCw, module: 'FINANCE' },
            { id: 'BANK_SUMMARY', label: 'Bank Summary', icon: FileText, module: 'FINANCE' },
        ]
    },
    {
        id: 'EXPENSES',
        label: 'Expenses',
        icon: Receipt,
        module: 'EXPENSES',
        children: [
            { id: 'EXPENSES', label: 'Expense Tracker', icon: Receipt, module: 'EXPENSES' },
            { id: 'EXPENSE_CATEGORIES', label: 'Categories', icon: Layers, module: 'EXPENSES' },
            { id: 'RECURRING_EXPENSES', label: 'Recurring', icon: Repeat, module: 'EXPENSES' },
            { id: 'EXPENSE_REPORTS', label: 'Expense Reports', icon: PieChart, module: 'EXPENSES' },
        ]
    },
    {
        id: 'CUSTOMERS',
        label: 'People: Customers',
        icon: Users,
        module: 'CUSTOMERS',
        children: [
            { id: 'CUSTOMER_LIST', label: 'Customer List', icon: Users, module: 'CUSTOMERS' },
            { id: 'CUSTOMER_LEDGER', label: 'Customer Ledger', icon: FileText, module: 'CUSTOMERS' },
        ]
    },
    {
        id: 'SUPPLIERS',
        label: 'People: Suppliers',
        icon: Truck,
        module: 'SUPPLIERS',
        children: [
            { id: 'SUPPLIER_LIST', label: 'Supplier List', icon: Truck, module: 'SUPPLIERS' },
            { id: 'SUPPLIER_LEDGER', label: 'Supplier Ledger', icon: FileText, module: 'SUPPLIERS' },
        ]
    },
    {
        id: 'HR',
        label: 'People: Staff',
        icon: Briefcase,
        module: 'HR',
        children: [
            { id: 'STAFF_MANAGER', label: 'Staff Directory', icon: Users, module: 'HR' },
            { id: 'LABOR', label: 'Labor Management', icon: Wrench, module: 'HR' },
            { id: 'PAYROLL', label: 'Payroll', icon: DollarSign, module: 'HR' },
            { id: 'ATTENDANCE', label: 'Attendance', icon: Clock, module: 'HR' },
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
        module: 'MULTI_BRANCH', // Or Global
        children: [
            { id: 'SETTINGS', label: 'General Settings', icon: Settings, module: 'MULTI_BRANCH' },
            { id: 'SYNC_SHARE', label: 'Sync & Share', icon: RefreshCw, module: 'MULTI_BRANCH' },
            { id: 'RESTORE', label: 'Restore Data', icon: Upload, module: 'MULTI_BRANCH' },
            { id: 'TENANT_MANAGEMENT', label: 'Tenant Management', icon: Building, module: 'MULTI_BRANCH' },
            { id: 'TENANT_ARCHITECT', label: 'Tenant Architect', icon: Wrench, module: 'MULTI_BRANCH' },
            { id: 'SUPER_ADMIN_CONSOLE', label: 'Super Admin Console', icon: Shield, module: 'MULTI_BRANCH' },
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
