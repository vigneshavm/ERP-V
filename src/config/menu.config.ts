import {
    LayoutDashboard,
    Zap,
    DollarSign,
    FileText,
    ShoppingCart,
    List,
    Users,
    CreditCard,
    ArrowRight,
    ArrowDownCircle,
    Archive,
    Package,
    Landmark,
    Receipt,
    BarChart,
    Settings,
    Wrench,
    Printer,
    Upload,
    Download,
    FileSpreadsheet,
    Rocket,
    Store,
    Megaphone,
    Globe,
    MessageCircle,
    RefreshCw,
    Database,
    PieChart,
    UserCheck,
    Truck,
    Box,
    AlertTriangle,
    Layers,
    Calendar,
    Briefcase,
    Building,
    Key,
    Save,
    Palette,
    LayoutGrid,
    Shield
} from 'lucide-react';
import { AppView, ModuleType } from '../types/common';

export interface MenuItem {
    id: AppView;
    label: string;
    icon?: any;
    path: string;
    module: ModuleType; // Canonical Module Key
    children?: MenuItem[];
    isGrow?: boolean; // To distinguish Grow Platform items visually if needed
}

export const MENU_ITEMS: MenuItem[] = [
    // --- MAIN ERP ---
    {
        id: 'DASHBOARD',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
        module: 'DASHBOARD',
        children: [
            { id: 'DASHBOARD_OVERVIEW', label: 'Overview', path: '/', icon: LayoutDashboard, module: 'DASHBOARD' },
            { id: 'DASHBOARD_SNAPSHOT', label: 'Business Snapshot', path: '/', icon: PieChart, module: 'DASHBOARD' },
            { id: 'PROFIT_PULSE', label: 'Profit Pulse AI', path: '/', icon: Zap, module: 'DASHBOARD' },
            { id: 'DASHBOARD_SUMMARY', label: 'Today\'s Summary', path: '/', icon: FileText, module: 'DASHBOARD' }
        ]
    },
    {
        id: 'SALES',
        label: 'Sales',
        icon: DollarSign,
        path: '/',
        module: 'POS',
        children: [
            { id: 'SALES_REGISTER', label: 'Sales Register', path: '/', icon: List, module: 'POS' },
            { id: 'SALES_INVOICE', label: 'Sales Invoices', path: '/', icon: FileText, module: 'POS' },
            { id: 'ESTIMATE', label: 'Estimates', path: '/', icon: FileText, module: 'POS' },
            { id: 'SALES_ORDER', label: 'Sales Orders', path: '/', icon: ShoppingCart, module: 'POS' },
            { id: 'DELIVERY_CHALLAN', label: 'Delivery Challans', path: '/', icon: Truck, module: 'POS' },
            { id: 'SALES_RETURN', label: 'Sales Returns', path: '/', icon: ArrowRight, module: 'POS' },
            { id: 'PAYMENT_IN', label: 'Payments Received', path: '/', icon: CreditCard, module: 'POS' },
            { id: 'CUSTOMER_CREDITS', label: 'Customer Credits', path: '/', icon: Users, module: 'POS' },
            { id: 'OUTSTANDING_DUES', label: 'Outstanding Dues', path: '/', icon: AlertTriangle, module: 'POS' }
        ]
    },
    {
        id: 'PURCHASE',
        label: 'Purchases',
        icon: ArrowDownCircle,
        path: '/',
        module: 'PURCHASE',
        children: [
            { id: 'PURCHASE_REGISTER', label: 'Purchase Register', path: '/', icon: List, module: 'PURCHASE' },
            { id: 'PURCHASE_ENTRY', label: 'Purchase Entries', path: '/', icon: FileText, module: 'PURCHASE' },
            { id: 'PURCHASE_ORDER', label: 'Purchase Orders', path: '/', icon: ShoppingCart, module: 'PURCHASE' },
            { id: 'GOODS_RECEIVED', label: 'Goods Received', path: '/', icon: Box, module: 'PURCHASE' },
            { id: 'DEBIT_NOTES', label: 'Debit Notes', path: '/', icon: FileText, module: 'PURCHASE' },
            { id: 'SUPPLIER_PAYMENTS', label: 'Supplier Payments', path: '/', icon: CreditCard, module: 'PURCHASE' },
            { id: 'OUTSTANDING_PAYABLES', label: 'Outstanding Payables', path: '/', icon: AlertTriangle, module: 'PURCHASE' }
        ]
    },
    {
        id: 'CUSTOMERS',
        label: 'Customers',
        icon: Users,
        path: '/',
        module: 'CUSTOMERS',
        children: [
            { id: 'CUSTOMER_LIST', label: 'Customer List', path: '/', icon: List, module: 'CUSTOMERS' },
            { id: 'CUSTOMER_LEDGER', label: 'Customer Ledger', path: '/', icon: FileText, module: 'CUSTOMERS' },
            { id: 'CUSTOMER_STATEMENTS', label: 'Customer Statements', path: '/', icon: FileSpreadsheet, module: 'CUSTOMERS' },
            { id: 'CUSTOMER_GROUPS', label: 'Customer Groups', path: '/', icon: Users, module: 'CUSTOMERS' },
            { id: 'LOYALTY_POINTS', label: 'Loyalty Points', path: '/', icon: Zap, module: 'CUSTOMERS' }
        ]
    },
    {
        id: 'SUPPLIERS',
        label: 'Suppliers',
        icon: Truck,
        path: '/',
        module: 'SUPPLIERS',
        children: [
            { id: 'SUPPLIER_LIST', label: 'Supplier List', path: '/', icon: List, module: 'SUPPLIERS' },
            { id: 'SUPPLIER_LEDGER', label: 'Supplier Ledger', path: '/', icon: FileText, module: 'SUPPLIERS' },
            { id: 'SUPPLIER_STATEMENTS', label: 'Supplier Statements', path: '/', icon: FileSpreadsheet, module: 'SUPPLIERS' },
            { id: 'SUPPLIER_GROUPS', label: 'Supplier Groups', path: '/', icon: Users, module: 'SUPPLIERS' }
        ]
    },
    {
        id: 'INVENTORY',
        label: 'Inventory',
        icon: Package,
        path: '/',
        module: 'INVENTORY',
        children: [
            { id: 'INVENTORY_ITEMS', label: 'Items', path: '/', icon: Box, module: 'INVENTORY' },
            { id: 'ITEM_CATEGORIES', label: 'Item Categories', path: '/', icon: Layers, module: 'INVENTORY' },
            { id: 'STOCK_SUMMARY', label: 'Stock Summary', path: '/', icon: FileText, module: 'INVENTORY' },
            { id: 'STOCK_MOVEMENT', label: 'Stock Movement', path: '/', icon: ArrowRight, module: 'INVENTORY' },
            { id: 'LOW_STOCK_ALERTS', label: 'Low Stock Alerts', path: '/', icon: AlertTriangle, module: 'INVENTORY' },
            { id: 'UNITS_HSN', label: 'Units & HSN', path: '/', icon: Archive, module: 'INVENTORY' },
            { id: 'WAREHOUSES', label: 'Warehouses', path: '/', icon: Building, module: 'INVENTORY' },
            { id: 'BATCH_EXPIRY', label: 'Batch & Expiry', path: '/', icon: Calendar, module: 'INVENTORY' }
        ]
    },
    {
        id: 'FINANCE',
        label: 'Cash & Bank',
        icon: Landmark,
        path: '/',
        module: 'FINANCE',
        children: [
            { id: 'CASH_ACCOUNTS', label: 'Cash Accounts', path: '/', icon: CreditCard, module: 'FINANCE' },
            { id: 'BANK_ACCOUNTS', label: 'Bank Accounts', path: '/', icon: Building, module: 'FINANCE' },
            { id: 'PETTY_CASH', label: 'Petty Cash', path: '/', icon: CreditCard, module: 'FINANCE' },
            { id: 'FUND_TRANSFERS', label: 'Fund Transfers', path: '/', icon: ArrowRight, module: 'FINANCE' },
            { id: 'BANK_RECONCILIATION', label: 'Bank Reconciliation', path: '/', icon: FileText, module: 'FINANCE' }
        ]
    },
    {
        id: 'POS',
        label: 'POS',
        icon: Printer,
        path: '/',
        module: 'POS',
        children: [
            { id: 'POS', label: 'POS Billing', path: '/', icon: ShoppingCart, module: 'POS' },
            { id: 'POS_ORDERS', label: 'POS Orders', path: '/', icon: List, module: 'POS' },
            { id: 'POS_RETURNS', label: 'POS Returns', path: '/', icon: ArrowRight, module: 'POS' },
            { id: 'SHIFT_MANAGEMENT', label: 'Shift Management', path: '/', icon: Calendar, module: 'POS' },
            { id: 'CASH_DRAWER', label: 'Cash Drawer', path: '/', icon: Box, module: 'POS' }
        ]
    },
    {
        id: 'EXPENSES',
        label: 'Expenses',
        icon: Receipt,
        path: '/',
        module: 'EXPENSES',
        children: [
            { id: 'EXPENSES', label: 'Expense Entries', path: '/', icon: FileText, module: 'EXPENSES' },
            { id: 'EXPENSE_CATEGORIES', label: 'Expense Categories', path: '/', icon: Layers, module: 'EXPENSES' },
            { id: 'RECURRING_EXPENSES', label: 'Recurring Expenses', path: '/', icon: RefreshCw, module: 'EXPENSES' },
            { id: 'EXPENSE_REPORTS', label: 'Expense Reports', path: '/', icon: PieChart, module: 'EXPENSES' }
        ]
    },
    {
        id: 'REPORTS',
        label: 'Reports',
        icon: BarChart,
        path: '/',
        module: 'REPORTS',
        children: [
            { id: 'REPORT_SALES', label: 'Sales Reports', path: '/', icon: FileText, module: 'REPORTS' },
            { id: 'REPORT_PURCHASE', label: 'Purchase Reports', path: '/', icon: FileText, module: 'REPORTS' },
            { id: 'REPORT_INVENTORY', label: 'Inventory Reports', path: '/', icon: Package, module: 'REPORTS' },
            { id: 'REPORT_CUSTOMER', label: 'Customer Reports', path: '/', icon: Users, module: 'REPORTS' },
            { id: 'REPORT_SUPPLIER', label: 'Supplier Reports', path: '/', icon: Truck, module: 'REPORTS' },
            { id: 'REPORT_TAX', label: 'Tax Reports', path: '/', icon: FileText, module: 'REPORTS' },
            { id: 'REPORT_FINANCIAL', label: 'Financial Reports', path: '/', icon: Landmark, module: 'REPORTS' },
            { id: 'DAY_BOOK', label: 'Day Book', path: '/', icon: Calendar, module: 'REPORTS' },
            { id: 'TRIAL_BALANCE', label: 'Trial Balance', path: '/', icon: FileSpreadsheet, module: 'REPORTS' },
            { id: 'PROFIT_LOSS', label: 'Profit & Loss', path: '/', icon: PieChart, module: 'REPORTS' },
            { id: 'BALANCE_SHEET', label: 'Balance Sheet', path: '/', icon: FileText, module: 'REPORTS' },
            { id: 'CASH_FLOW', label: 'Cash Flow', path: '/', icon: ArrowRight, module: 'REPORTS' }
        ]
    },
    {
        id: 'UTILITIES',
        label: 'Utilities',
        icon: Wrench,
        path: '/',
        module: 'INVENTORY',
        children: [
            { id: 'BARCODE_GENERATOR', label: 'Barcode Generator', path: '/', icon: Printer, module: 'INVENTORY' },
            { id: 'LABEL_PRINTING', label: 'Label Printing', path: '/', icon: Printer, module: 'INVENTORY' },
            { id: 'BULK_IMPORT', label: 'Bulk Import', path: '/', icon: Upload, module: 'INVENTORY' },
            { id: 'DATA_EXPORT', label: 'Bulk Export', path: '/', icon: Download, module: 'INVENTORY' },
            { id: 'NUMBER_SERIES', label: 'Number Series', path: '/', icon: List, module: 'INVENTORY' },
            { id: 'AUDIT_LOGS', label: 'Audit Logs', path: '/', icon: FileText, module: 'INVENTORY' }
        ]
    },
    {
        id: 'SETTINGS',
        label: 'Settings',
        icon: Settings,
        path: '/',
        module: 'DASHBOARD',
        children: [
            { id: 'BUSINESS_PROFILE', label: 'Business Profile', path: '/', icon: Briefcase, module: 'DASHBOARD' },
            { id: 'TAX_CONFIGURATION', label: 'Tax Configuration', path: '/', icon: FileText, module: 'FINANCE' },
            { id: 'INVOICE_SETTINGS', label: 'Invoice Settings', path: '/', icon: FileText, module: 'POS' },
            { id: 'USERS_ROLES', label: 'Users & Roles', path: '/', icon: UserCheck, module: 'DASHBOARD' },
            { id: 'BRANCH_SETTINGS', label: 'Branch Settings', path: '/', icon: Building, module: 'MULTI_BRANCH' },
            { id: 'FINANCIAL_YEAR', label: 'Financial Year', path: '/', icon: Calendar, module: 'FINANCE' },
            { id: 'INTEGRATIONS', label: 'Integrations', path: '/', icon: Zap, module: 'DASHBOARD' },
            { id: 'BACKUP_RESTORE', label: 'Backup & Restore', path: '/', icon: Save, module: 'DASHBOARD' },
            { id: 'THEMES_BRANDING', label: 'Themes & Branding', path: '/', icon: Palette, module: 'DASHBOARD' }
        ]
    },
    // --- GROW PLATFORM ---
    // --- GROW PLATFORM ---
    {
        id: 'GROW_DASHBOARD',
        label: 'Grow Dashboard',
        icon: LayoutDashboard,
        path: '/',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_OVERVIEW', label: 'Dashboard Overview', path: '/', icon: BarChart, module: 'GROW' },
            { id: 'GROW_HUB', label: 'Growth Hub (Tools)', path: '/', icon: LayoutGrid, module: 'GROW' },
            { id: 'GROW_PERFORMANCE', label: 'Online Performance', path: '/', icon: PieChart, module: 'GROW' },
            { id: 'GROW_MARKETING_METRICS', label: 'Marketing Metrics', path: '/', icon: Megaphone, module: 'GROW' }
        ]
    },
    {
        id: 'GROW_STORE',
        label: 'Online Store',
        icon: Store,
        path: '/',
        isGrow: true,
        module: 'ECOMMERCE',
        children: [
            { id: 'GROW_STORE_SETUP', label: 'Store Setup', path: '/', icon: Settings, module: 'ECOMMERCE' },
            { id: 'GROW_PRODUCT_SYNC', label: 'Product Sync', path: '/', icon: RefreshCw, module: 'ECOMMERCE' },
            { id: 'GROW_STORE_ORDERS', label: 'Orders', path: '/', icon: ShoppingCart, module: 'ECOMMERCE' },
            { id: 'GROW_STORE_CUSTOMERS', label: 'Customers', path: '/', icon: Users, module: 'ECOMMERCE' },
            { id: 'GROW_STORE_PAYMENTS', label: 'Payments', path: '/', icon: CreditCard, module: 'ECOMMERCE' },
            { id: 'GROW_STORE_THEMES', label: 'Themes', path: '/', icon: Palette, module: 'ECOMMERCE' },
            { id: 'GROW_STORE_DOMAIN', label: 'Domain', path: '/', icon: Globe, module: 'ECOMMERCE' },
            { id: 'GROW_STORE_SHIPPING', label: 'Shipping', path: '/', icon: Truck, module: 'ECOMMERCE' }
        ]
    },
    {
        id: 'GROW_MARKETING',
        label: 'Marketing',
        icon: Megaphone,
        path: '/',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_MARKETING_CAMPAIGNS', label: 'Campaigns', path: '/', icon: Rocket, module: 'GROW' },
            { id: 'GROW_MARKETING_TEMPLATES', label: 'Templates', path: '/', icon: Layers, module: 'GROW' },
            { id: 'GROW_MARKETING_EMAIL', label: 'Email Marketing', path: '/', icon: MessageCircle, module: 'GROW' },
            { id: 'GROW_MARKETING_WHATSAPP', label: 'WhatsApp Marketing', path: '/', icon: MessageCircle, module: 'GROW' },
            { id: 'GROW_MARKETING_SOCIAL', label: 'Social Media', path: '/', icon: Globe, module: 'GROW' },
            { id: 'GROW_MARKETING_COUPONS', label: 'Coupons', path: '/', icon: Zap, module: 'GROW' },
            { id: 'GROW_MARKETING_OFFERS', label: 'Offers', path: '/', icon: Zap, module: 'GROW' }
        ]
    },
    {
        id: 'GROW_GOOGLE',
        label: 'Google Business',
        icon: Globe,
        path: '/',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_GOOGLE_PROFILE', label: 'Profile Manager', path: '/', icon: UserCheck, module: 'GROW' },
            { id: 'GROW_GOOGLE_REVIEWS', label: 'Reviews', path: '/', icon: MessageCircle, module: 'GROW' },
            { id: 'GROW_GOOGLE_POSTS', label: 'Posts', path: '/', icon: FileText, module: 'GROW' },
            { id: 'GROW_GOOGLE_INSIGHTS', label: 'Insights', path: '/', icon: BarChart, module: 'GROW' },
            { id: 'GROW_GOOGLE_PHOTOS', label: 'Photos', path: '/', icon: ArrowDownCircle, module: 'GROW' }
        ]
    },
    {
        id: 'GROW_ENGAGEMENT',
        label: 'Customer Engagement',
        icon: MessageCircle,
        path: '/',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_ENGAGEMENT_SMS', label: 'SMS', path: '/', icon: MessageCircle, module: 'GROW' },
            { id: 'GROW_ENGAGEMENT_WHATSAPP', label: 'WhatsApp', path: '/', icon: MessageCircle, module: 'GROW' },
            { id: 'GROW_ENGAGEMENT_EMAIL', label: 'Email', path: '/', icon: MessageCircle, module: 'GROW' },
            { id: 'GROW_ENGAGEMENT_LOYALTY', label: 'Loyalty Programs', path: '/', icon: Zap, module: 'GROW' },
            { id: 'GROW_ENGAGEMENT_FEEDBACK', label: 'Feedback', path: '/', icon: MessageCircle, module: 'GROW' }
        ]
    },
    {
        id: 'GROW_SYNC',
        label: 'Sync & Backup',
        icon: RefreshCw,
        path: '/',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_SYNC_DEVICE', label: 'Device Sync', path: '/', icon: RefreshCw, module: 'GROW' },
            { id: 'GROW_SYNC_CLOUD', label: 'Cloud Sync', path: '/', icon: RefreshCw, module: 'GROW' },
            { id: 'GROW_BACKUP', label: 'Backup', path: '/', icon: Save, module: 'GROW' },
            { id: 'GROW_RESTORE_DATA', label: 'Restore', path: '/', icon: Save, module: 'GROW' },
            { id: 'GROW_SYNC_LOGS', label: 'Sync Logs', path: '/', icon: List, module: 'GROW' }
        ]
    },
    {
        id: 'GROW_REPORTS',
        label: 'Growth Reports',
        icon: BarChart,
        path: '/',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_REPORT_SALES', label: 'Store Sales', path: '/', icon: BarChart, module: 'GROW' },
            { id: 'GROW_REPORT_ROI', label: 'Marketing ROI', path: '/', icon: PieChart, module: 'GROW' },
            { id: 'GROW_REPORT_CUSTOMER', label: 'Customer Growth', path: '/', icon: Users, module: 'GROW' },
            { id: 'GROW_REPORT_TRAFFIC', label: 'Traffic', path: '/', icon: ArrowRight, module: 'GROW' },
            { id: 'GROW_REPORT_CONVERSION', label: 'Conversion Reports', path: '/', icon: Zap, module: 'GROW' }
        ]
    },
    // --- GROWTH INFRASTRUCTURE ---
    {
        id: 'GROW_DATA',
        label: 'Growth Utils',
        icon: Key,
        path: '/',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_DATA_IMPORT', label: 'Bulk Import', path: '/', icon: Upload, module: 'GROW' },
            { id: 'GROW_DATA_EXPORT', label: 'Bulk Export', path: '/', icon: Download, module: 'GROW' },
            { id: 'GROW_DATA_HEALTH', label: 'Data Health AI', path: '/', icon: Zap, module: 'GROW' }
        ]
    }
];
