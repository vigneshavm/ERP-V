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
import { AppView, ModuleType } from "../types/common";


export interface MenuItem {
    id: AppView;
    label: string;
    icon?: React.ElementType;
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
        path: '/dashboard',
        module: 'DASHBOARD',
        children: [
            { id: 'DASHBOARD_OVERVIEW', label: 'Overview', path: '/dashboard', icon: LayoutDashboard, module: 'DASHBOARD' },
            { id: 'DASHBOARD_SNAPSHOT', label: 'Business Snapshot', path: '/analytics/reports/snapshot', icon: PieChart, module: 'DASHBOARD' },
            { id: 'PROFIT_PULSE', label: 'Profit Pulse AI', path: '/analytics/reports/profit', icon: Zap, module: 'DASHBOARD' },
            { id: 'DASHBOARD_SUMMARY', label: 'Today\'s Summary', path: '/dashboard', icon: FileText, module: 'DASHBOARD' }
        ]
    },
    {
        id: 'SALES',
        label: 'Sales',
        icon: DollarSign,
        path: '/item/sales',
        module: 'POS',
        children: [
            { id: 'SALES_REGISTER', label: 'Sales Invoices', path: '/item/sales/invoices', icon: List, module: 'POS' },
            { id: 'SALES_INVOICE', label: 'New Invoice', path: '/item/sales/invoices', icon: FileText, module: 'POS' },
            { id: 'ESTIMATE', label: 'Estimates', path: '/item/sales/estimates', icon: FileText, module: 'POS' },
            { id: 'SALES_ORDER', label: 'Sales Orders', path: '/item/sales/orders', icon: ShoppingCart, module: 'POS' },
            { id: 'DELIVERY_CHALLAN', label: 'Delivery Challans', path: '/item/sales/delivery-challans', icon: Truck, module: 'POS' },
            { id: 'SALES_RETURN', label: 'Sales Returns', path: '/item/sales/returns', icon: ArrowRight, module: 'POS' },
            { id: 'PAYMENT_IN', label: 'Payments Received', path: '/item/sales/payments', icon: CreditCard, module: 'POS' },
            // { id: 'CUSTOMER_CREDITS', label: 'Customer Credits', path: '/people/customers/with-dues', icon: Users, module: 'POS' },
            // { id: 'OUTSTANDING_DUES', label: 'Outstanding Dues', path: '/financial/due-adjustments', icon: AlertTriangle, module: 'POS' }
        ]
    },
    {
        id: 'PURCHASE',
        label: 'Purchases',
        icon: ArrowDownCircle,
        path: '/item/purchase',
        module: 'PURCHASE',
        children: [
            { id: 'PURCHASE_REGISTER', label: 'Purchase Invoices', path: '/item/purchase/invoices', icon: List, module: 'PURCHASE' },
            { id: 'PURCHASE_ENTRY', label: 'New Purchase', path: '/item/purchase/entry', icon: FileText, module: 'PURCHASE' },
            { id: 'PURCHASE_ORDER', label: 'Purchase Orders', path: '/item/purchase/orders', icon: ShoppingCart, module: 'PURCHASE' },
            { id: 'GOODS_RECEIVED', label: 'Goods Received', path: '/item/purchase/received', icon: Box, module: 'PURCHASE' },
            { id: 'DEBIT_NOTES', label: 'Returns / Debit Notes', path: '/item/purchase/returns', icon: FileText, module: 'PURCHASE' },
            { id: 'SUPPLIER_PAYMENTS', label: 'Supplier Payments', path: '/item/purchase/payment-out', icon: CreditCard, module: 'PURCHASE' },
            { id: 'OUTSTANDING_PAYABLES', label: 'Outstanding Payables', path: '/item/purchase/payables', icon: AlertTriangle, module: 'PURCHASE' }
        ]
    },
    {
        id: 'CUSTOMERS',
        label: 'Customers',
        icon: Users,
        path: '/people/customers',
        module: 'CUSTOMERS',
        children: [
            { id: 'CUSTOMER_LIST', label: 'Customer List', path: '/people/customers', icon: List, module: 'CUSTOMERS' },
            { id: 'CUSTOMER_LEDGER', label: 'Customer Ledger', path: '/people/customers', icon: FileText, module: 'CUSTOMERS' },
            // { id: 'CUSTOMER_STATEMENTS', label: 'Customer Statements', path: '/people/customers', icon: FileSpreadsheet, module: 'CUSTOMERS' },
            // { id: 'CUSTOMER_GROUPS', label: 'Customer Groups', path: '/people/customers', icon: Users, module: 'CUSTOMERS' },
            // { id: 'LOYALTY_POINTS', label: 'Loyalty Points', path: '/people/customers', icon: Zap, module: 'CUSTOMERS' }
        ]
    },
    {
        id: 'SUPPLIERS',
        label: 'Suppliers',
        icon: Truck,
        path: '/people/suppliers',
        module: 'SUPPLIERS',
        children: [
            { id: 'SUPPLIER_LIST', label: 'Supplier List', path: '/people/suppliers', icon: List, module: 'SUPPLIERS' },
            { id: 'SUPPLIER_LEDGER', label: 'Supplier Ledger', path: '/people/suppliers/ledger', icon: FileText, module: 'SUPPLIERS' },
            { id: 'SUPPLIER_STATEMENTS', label: 'Supplier Statements', path: '/people/suppliers/statements', icon: FileSpreadsheet, module: 'SUPPLIERS' },
            { id: 'SUPPLIER_GROUPS', label: 'Supplier Groups', path: '/people/suppliers/groups', icon: Users, module: 'SUPPLIERS' }
        ]
    },
    {
        id: 'INVENTORY',
        label: 'Inventory',
        icon: Package,
        path: '/item/inventory',
        module: 'INVENTORY',
        children: [
            { id: 'INVENTORY_ITEMS', label: 'Items', path: '/item/inventory', icon: Box, module: 'INVENTORY' },
            // { id: 'ITEM_CATEGORIES', label: 'Item Categories', path: '/item/inventory', icon: Layers, module: 'INVENTORY' },
            // { id: 'STOCK_SUMMARY', label: 'Stock Summary', path: '/item/inventory', icon: FileText, module: 'INVENTORY' },
            // { id: 'STOCK_MOVEMENT', label: 'Stock Movement', path: '/item/inventory', icon: ArrowRight, module: 'INVENTORY' },
            // { id: 'LOW_STOCK_ALERTS', label: 'Low Stock Alerts', path: '/item/inventory', icon: AlertTriangle, module: 'INVENTORY' },
            // { id: 'UNITS_HSN', label: 'Units & HSN', path: '/item/inventory', icon: Archive, module: 'INVENTORY' },
            // { id: 'WAREHOUSES', label: 'Warehouses', path: '/item/inventory', icon: Building, module: 'INVENTORY' },
            { id: 'BATCH_EXPIRY', label: 'Aged Stock', path: '/item/inventory/aged-stock', icon: Calendar, module: 'INVENTORY' },
            { id: 'BATCH_EXPIRY', label: 'Batch Price Update', path: '/item/inventory/batch-price-update', icon: DollarSign, module: 'INVENTORY' },
            { id: 'BARCODE_GENERATOR', label: 'Reprint Queue', path: '/item/inventory/reprint-queue', icon: Printer, module: 'INVENTORY' }
        ]
    },
    {
        id: 'FINANCE',
        label: 'Cash & Bank',
        icon: Landmark,
        path: '/financial/cashbank',
        module: 'FINANCE',
        children: [
            { id: 'CASH_ACCOUNTS', label: 'Cash In Hand', path: '/financial/cashbank/cash-in-hand', icon: CreditCard, module: 'FINANCE' },
            { id: 'BANK_ACCOUNTS', label: 'Bank Accounts', path: '/financial/cashbank/bank-accounts', icon: Building, module: 'FINANCE' },
            { id: 'PETTY_CASH', label: 'Petty Cash', path: '/financial/cashbank/petty-cash', icon: CreditCard, module: 'FINANCE' },
            { id: 'FUND_TRANSFERS', label: 'Fund Transfers', path: '/financial/cashbank/fund-transfer', icon: ArrowRight, module: 'FINANCE' },
            { id: 'BANK_RECONCILIATION', label: 'Bank Reconciliation', path: '/financial/cashbank/reconciliation', icon: FileText, module: 'FINANCE' },
            { id: 'FINANCE', label: 'Bank Summary', path: '/financial/cashbank/bank-summary', icon: BarChart, module: 'FINANCE' },
            { id: 'FINANCE', label: 'Transactions', path: '/financial/cashbank/transactions', icon: List, module: 'FINANCE' }
        ]
    },
    {
        id: 'POS',
        label: 'POS',
        icon: Printer,
        path: '/item/pos/billing',
        module: 'POS',
        children: [
            { id: 'POS', label: 'POS Billing', path: '/item/pos/billing', icon: ShoppingCart, module: 'POS' },
            { id: 'POS_ORDERS', label: 'POS Orders', path: '/item/pos/orders', icon: List, module: 'POS' },
            { id: 'POS_RETURNS', label: 'POS Returns', path: '/item/pos/returns', icon: ArrowRight, module: 'POS' },
            { id: 'SHIFT_MANAGEMENT', label: 'Shift Management', path: '/item/pos/shifts', icon: Calendar, module: 'POS' },
            // { id: 'CASH_DRAWER', label: 'Cash Drawer', path: '/item/pos/billing', icon: Box, module: 'POS' }
        ]
    },
    {
        id: 'EXPENSES',
        label: 'Expenses',
        icon: Receipt,
        path: '/financial/expenses',
        module: 'EXPENSES',
        children: [
            { id: 'EXPENSES', label: 'Expense Manager', path: '/financial/expenses', icon: FileText, module: 'EXPENSES' },
            { id: 'EXPENSE_CATEGORIES', label: 'Expense Categories', path: '/financial/expenses/categories', icon: Layers, module: 'EXPENSES' },
            { id: 'RECURRING_EXPENSES', label: 'Recurring Expenses', path: '/financial/expenses/recurring', icon: RefreshCw, module: 'EXPENSES' },
            { id: 'EXPENSE_REPORTS', label: 'Expense Reports', path: '/financial/expenses/reports', icon: PieChart, module: 'EXPENSES' },
            { id: 'EXPENSES', label: 'Insights', path: '/financial/expenses/insights', icon: Zap, module: 'EXPENSES' }
        ]
    },
    {
        id: 'REPORTS',
        label: 'Analytics',
        icon: BarChart,
        path: '/analytics/reports',
        module: 'REPORTS',
        children: [
            { id: 'REPORTS', label: 'Dashboard', path: '/analytics/reports', icon: BarChart, module: 'REPORTS' },
            { id: 'REPORT_SALES', label: 'Sales Reports', path: '/analytics/reports', icon: FileText, module: 'REPORTS' },
            { id: 'DASHBOARD_SNAPSHOT', label: 'Business Snapshot', path: '/analytics/reports/snapshot', icon: PieChart, module: 'REPORTS' },
            { id: 'PROFIT_PULSE', label: 'Profit Pulse', path: '/analytics/reports/profit', icon: Zap, module: 'REPORTS' },
            // { id: 'REPORT_PURCHASE', label: 'Purchase Reports', path: '/analytics/reports/purchase', icon: FileText, module: 'REPORTS' },
            // { id: 'REPORT_INVENTORY', label: 'Inventory Reports', path: '/analytics/reports', icon: Package, module: 'REPORTS' },
            // { id: 'REPORT_CUSTOMER', label: 'Customer Reports', path: '/analytics/reports', icon: Users, module: 'REPORTS' },
            // { id: 'REPORT_SUPPLIER', label: 'Supplier Reports', path: '/analytics/reports', icon: Truck, module: 'REPORTS' },
            // { id: 'REPORT_TAX', label: 'Tax Reports', path: '/analytics/reports', icon: FileText, module: 'REPORTS' },
            // { id: 'REPORT_FINANCIAL', label: 'Financial Reports', path: '/analytics/reports', icon: Landmark, module: 'REPORTS' },
            { id: 'GROW_GOOGLE', label: 'Google Business', path: '/analytics/marketing/google-business', icon: Globe, module: 'GROW' }
        ]
    },
    {
        id: 'UTILITIES',
        label: 'Utilities',
        icon: Wrench,
        path: '/system/utilities',
        module: 'INVENTORY',
        children: [
            { id: 'BARCODE_GENERATOR', label: 'Barcode Generator', path: '/system/utilities/barcode', icon: Printer, module: 'INVENTORY' },
            // { id: 'LABEL_PRINTING', label: 'Label Printing', path: '/system/utilities/label-printing', icon: Printer, module: 'INVENTORY' },
            { id: 'BULK_IMPORT', label: 'Bulk Import', path: '/system/utilities/import-items', icon: Upload, module: 'INVENTORY' },
            { id: 'DATA_EXPORT', label: 'Bulk Export', path: '/system/utilities/export', icon: Download, module: 'INVENTORY' },
            // { id: 'NUMBER_SERIES', label: 'Number Series', path: '/system/utilities/number-series', icon: List, module: 'INVENTORY' },
            // { id: 'AUDIT_LOGS', label: 'Audit Logs', path: '/system/utilities/audit-logs', icon: FileText, module: 'INVENTORY' }
        ]
    },
    {
        id: 'SETTINGS',
        label: 'Settings',
        icon: Settings,
        path: '/system/settings/general',
        module: 'DASHBOARD',
        children: [
            { id: 'BUSINESS_PROFILE', label: 'General / Profile', path: '/system/settings/general', icon: Briefcase, module: 'DASHBOARD' },
            { id: 'THEMES_BRANDING', label: 'Branding', path: '/system/settings/branding', icon: Palette, module: 'DASHBOARD' },
            { id: 'BRANCH_SETTINGS', label: 'Branch Settings', path: '/system/settings/branches', icon: Building, module: 'MULTI_BRANCH' },
            { id: 'FINANCIAL_YEAR', label: 'Finance Settings', path: '/system/settings/finance', icon: Calendar, module: 'FINANCE' },
            { id: 'USERS_ROLES', label: 'Security', path: '/system/settings/security', icon: UserCheck, module: 'DASHBOARD' },
            { id: 'INTEGRATIONS', label: 'Integrations', path: '/system/settings/integrations', icon: Zap, module: 'DASHBOARD' },
            { id: 'SETTINGS', label: 'Modules', path: '/system/settings/modules', icon: Layers, module: 'DASHBOARD' },
            { id: 'SETTINGS', label: 'Personalization', path: '/system/settings/personalization', icon: Palette, module: 'DASHBOARD' },
            { id: 'SETTINGS', label: 'Subscription', path: '/system/settings/subscription', icon: CreditCard, module: 'DASHBOARD' },
            // { id: 'BACKUP_RESTORE', label: 'Backup & Restore', path: '/system/sync', icon: Save, module: 'DASHBOARD' }
        ]
    },
    {
        id: 'GROW_SYNC',
        label: 'Sync & Data',
        icon: RefreshCw,
        path: '/system/sync',
        module: 'GROW',
        children: [
            { id: 'GROW_SYNC_DEVICE', label: 'Sync Status', path: '/system/sync', icon: RefreshCw, module: 'GROW' },
            { id: 'GROW_BACKUP', label: 'Backup', path: '/system/sync/backup', icon: Save, module: 'GROW' },
            { id: 'GROW_RESTORE_DATA', label: 'Restore', path: '/system/sync/restore', icon: Save, module: 'GROW' },
            { id: 'GROW_DATA_EXPORT', label: 'Data Management', path: '/system/data', icon: Database, module: 'GROW' }
        ]
    },
    // --- GROW PLATFORM ---
    // --- GROW PLATFORM ---
    {
        id: 'GROW_DASHBOARD',
        label: 'Grow Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_OVERVIEW', label: 'Dashboard Overview', path: '/dashboard', icon: BarChart, module: 'GROW' },
            { id: 'GROW_HUB', label: 'Growth Hub (Tools)', path: '/analytics/marketing/tools', icon: LayoutGrid, module: 'GROW' },
            // { id: 'GROW_PERFORMANCE', label: 'Online Performance', path: '/analytics/marketing/performance', icon: PieChart, module: 'GROW' },
            // { id: 'GROW_MARKETING_METRICS', label: 'Marketing Metrics', path: '/analytics/marketing/metrics', icon: Megaphone, module: 'GROW' }
        ]
    },
    {
        id: 'GROW_STORE',
        label: 'Online Store',
        icon: Store,
        path: '/analytics/marketing/online-shop',
        isGrow: true,
        module: 'ECOMMERCE',
        children: [
            { id: 'GROW_STORE_SETUP', label: 'Store Setup', path: '/analytics/marketing/online-shop', icon: Settings, module: 'ECOMMERCE' },
            // { id: 'GROW_PRODUCT_SYNC', label: 'Product Sync', path: '/analytics/marketing/online-shop', icon: RefreshCw, module: 'ECOMMERCE' },
            // { id: 'GROW_STORE_ORDERS', label: 'Orders', path: '/analytics/marketing/online-shop', icon: ShoppingCart, module: 'ECOMMERCE' },
            // { id: 'GROW_STORE_CUSTOMERS', label: 'Customers', path: '/analytics/marketing/online-shop', icon: Users, module: 'ECOMMERCE' },
            // { id: 'GROW_STORE_PAYMENTS', label: 'Payments', path: '/analytics/marketing/online-shop', icon: CreditCard, module: 'ECOMMERCE' },
            // { id: 'GROW_STORE_THEMES', label: 'Themes', path: '/analytics/marketing/online-shop', icon: Palette, module: 'ECOMMERCE' },
            // { id: 'GROW_STORE_DOMAIN', label: 'Domain', path: '/analytics/marketing/online-shop', icon: Globe, module: 'ECOMMERCE' },
            // { id: 'GROW_STORE_SHIPPING', label: 'Shipping', path: '/analytics/marketing/online-shop', icon: Truck, module: 'ECOMMERCE' }
        ]
    },
    {
        id: 'GROW_MARKETING',
        label: 'Marketing',
        icon: Megaphone,
        path: '/analytics/marketing',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_MARKETING_WHATSAPP', label: 'WhatsApp Marketing', path: '/analytics/marketing/whatsapp', icon: MessageCircle, module: 'GROW' },
            { id: 'GROW_MARKETING_SOCIAL', label: 'Social Media', path: '/analytics/marketing/meta/callback', icon: Globe, module: 'GROW' }, // Placeholder
            { id: 'GROW_MARKETING_CAMPAIGNS', label: 'Campaigns', path: '/analytics/marketing/tools', icon: Rocket, module: 'GROW' },
            // { id: 'GROW_MARKETING_TEMPLATES', label: 'Templates', path: '/analytics/marketing', icon: Layers, module: 'GROW' },
            // { id: 'GROW_MARKETING_EMAIL', label: 'Email Marketing', path: '/analytics/marketing', icon: MessageCircle, module: 'GROW' },
            // { id: 'GROW_MARKETING_COUPONS', label: 'Coupons', path: '/analytics/marketing', icon: Zap, module: 'GROW' },
            // { id: 'GROW_MARKETING_OFFERS', label: 'Offers', path: '/analytics/marketing', icon: Zap, module: 'GROW' }
        ]
    },
    {
        id: 'GROW_GOOGLE',
        label: 'Google Business',
        icon: Globe,
        path: '/analytics/marketing/google-business',
        isGrow: true,
        module: 'GROW',
        children: [
            { id: 'GROW_GOOGLE_PROFILE', label: 'Profile Manager', path: '/analytics/marketing/google-business', icon: UserCheck, module: 'GROW' },
            // { id: 'GROW_GOOGLE_REVIEWS', label: 'Reviews', path: '/analytics/marketing/google-business', icon: MessageCircle, module: 'GROW' },
            // { id: 'GROW_GOOGLE_POSTS', label: 'Posts', path: '/analytics/marketing/google-business', icon: FileText, module: 'GROW' },
            // { id: 'GROW_GOOGLE_INSIGHTS', label: 'Insights', path: '/analytics/marketing/google-business', icon: BarChart, module: 'GROW' },
            // { id: 'GROW_GOOGLE_PHOTOS', label: 'Photos', path: '/analytics/marketing/google-business', icon: ArrowDownCircle, module: 'GROW' }
        ]
    },
];
