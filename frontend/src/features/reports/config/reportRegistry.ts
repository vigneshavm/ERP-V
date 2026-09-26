import {
    BarChart3, TrendingUp, Users, Wallet, Scale, LineChart, Layers, Database, History, BookOpen,
    ClipboardList, PieChart, Building2, ShieldCheck, Globe, Zap, Clock, Calendar, Store, Tag, Shirt,
    MapPin, LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppView } from '@/types/common';
import type { ReportType } from './reportViews';

/**
 * Single source of truth for which reports exist and how they behave.
 *
 * Replaces ReportData.ts (REPORT_CATALOG) and the LIVE_REPORT_TYPES / STOCK_REPORT_TYPES /
 * getMappedReportType / viewMode switch that lived in features/reports/index.tsx.
 *
 * ModuleRegistry.ts (Modules) lazy-loads the Reports module; this file says what is inside it.
 */

// ---------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------

export type ReportCategoryId = 'transactions' | 'parties' | 'inventory' | 'gst' | 'analytics';

/**
 * Where the report's figures come from, for the audit footer.
 * - 'item-data-source': follows the backend's ITEM_DATA_SOURCE flag (Textilesoft SQL when =sql,
 *   ERP MongoDB otherwise). The shell resolves the actual source at runtime.
 * - 'combined': Textilesoft SQL + ERP MongoDB (e.g. sales, where some counters bill in the ERP POS).
 * - null: not decided yet (report not built).
 */
export type ReportDataSource = 'textilesoft-sql' | 'erp-mongo' | 'combined' | 'item-data-source';

/**
 * Explicit build state. Deliberately NOT derived from dataSource: a report can have a source and
 * still be unreconciled.
 * - live: real data, reconciled.
 * - validation: real data wired, figures still being reconciled (or partly placeholder).
 * - coming-soon: not built. Must never render sample numbers.
 */
export type ReportImplementationStatus = 'live' | 'validation' | 'coming-soon';

export interface ReportDefinition {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    category: ReportCategoryId;
    /** Which BusinessReportsHub view renders this report; null when nothing renders it yet. */
    hubView: ReportType | null;
    /** Global viewModes (sidebar / quick links) that open this report directly. */
    viewModes?: readonly AppView[];
    dataSource: ReportDataSource | null;
    implementationStatus: ReportImplementationStatus;
    /** Finance-restricted: only Owner/Manager see it in the catalog. */
    restricted?: boolean;
}

export interface ReportCategory {
    id: ReportCategoryId;
    title: string;
}

// ---------------------------------------------------------------------------------------------
// Categories (catalog tab order)
// ---------------------------------------------------------------------------------------------

export const REPORT_CATEGORIES: readonly ReportCategory[] = [
    { id: 'transactions', title: 'Transaction Reports' },
    { id: 'parties', title: 'Party Reports' },
    { id: 'inventory', title: 'Inventory Reports' },
    { id: 'gst', title: 'GST Reports' },
    { id: 'analytics', title: 'Detailed Analytics' },
];

// ---------------------------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------------------------

/**
 * Keyed by report id so duplicates are impossible. Key order within a category is catalog order.
 * `satisfies` checks every entry against ReportDefinition while keeping the literal id keys.
 */
export const reportRegistry = {
    // --- Transactions ---
    'sales': {
        id: 'sales', title: 'Sales Report', description: 'Detailed log of all sales transactions',
        icon: BarChart3, category: 'transactions', hubView: 'REPORT_SALES', viewModes: ['REPORT_SALES'],
        // Shop SQL bills + ERP POS invoices via /api/reports/finance/sales; 'validation' until reconciled against Textilesoft.
        dataSource: 'combined', implementationStatus: 'validation',
    },
    'expense-analysis': {
        id: 'expense-analysis', title: 'Expense Analysis', description: 'Expenses by category, budget and payment method, with checks',
        icon: Wallet, category: 'transactions', hubView: 'REPORT_EXPENSE_ANALYSIS',
        // ERP expenses of every user in the shop. Checks: see backend expenseMath.ts.
        dataSource: 'erp-mongo', implementationStatus: 'validation', restricted: true,
    },
    'returns-audit': {
        id: 'returns-audit', title: 'Returns & Refund Audit', description: 'Every sales return with refund method, cashier and risk flags',
        icon: ShieldCheck, category: 'transactions', hubView: 'REPORT_RETURNS_AUDIT',
        // ERP returns only (the shop database records no sales returns). Flags: see backend returnAudit.ts.
        dataSource: 'erp-mongo', implementationStatus: 'validation',
    },
    'purchase': {
        id: 'purchase', title: 'Purchase Report', description: 'Overview of all procurement activities',
        icon: TrendingUp, category: 'transactions', hubView: 'REPORT_PURCHASE', viewModes: ['REPORT_PURCHASE'],
        dataSource: null, implementationStatus: 'coming-soon',
    },
    'daybook': {
        id: 'daybook', title: 'Day Book', description: 'Every transaction of one day, with money in and out by cash and bank',
        icon: BookOpen, category: 'transactions', hubView: 'DAY_BOOK', viewModes: ['DAY_BOOK'],
        dataSource: 'combined', implementationStatus: 'validation',
    },
    'all-transactions': {
        id: 'all-transactions', title: 'All Transactions', description: 'Every money movement over a period, filterable by type and payment mode',
        icon: Database, category: 'transactions', hubView: 'REPORT_ALL_TRANSACTIONS', viewModes: ['REPORT_FINANCIAL'],
        dataSource: 'combined', implementationStatus: 'validation',
    },
    'profit-loss': {
        id: 'profit-loss', title: 'Profit & Loss', description: 'Net sales, cost of goods sold, expenses and net profit',
        icon: LineChart, category: 'transactions', hubView: 'PROFIT_LOSS', viewModes: ['PROFIT_LOSS'],
        dataSource: 'combined', implementationStatus: 'validation', restricted: true,
    },
    'bill-wise-profit': {
        id: 'bill-wise-profit', title: 'Bill-Wise Profit', description: 'Profit and margin on every bill at lot purchase cost',
        icon: Zap, category: 'transactions', hubView: 'REPORT_BILL_PROFIT',
        dataSource: 'combined', implementationStatus: 'validation', restricted: true,
    },
    'cash-flow': {
        id: 'cash-flow', title: 'Cash Flow', description: 'Money in and out by category, cash vs bank, day by day',
        icon: Wallet, category: 'transactions', hubView: 'REPORT_CASH_FLOW', viewModes: ['CASH_FLOW'],
        dataSource: 'combined', implementationStatus: 'validation',
    },
    'trial-balance': {
        id: 'trial-balance', title: 'Trial Balance', description: 'Worksheet listing all ledger balances',
        icon: Scale, category: 'transactions', hubView: 'TRIAL_BALANCE', viewModes: ['TRIAL_BALANCE'],
        dataSource: null, implementationStatus: 'coming-soon', restricted: true,
    },
    'balance-sheet': {
        id: 'balance-sheet', title: 'Balance Sheet', description: 'Snapshot of assets, liabilities, and equity',
        icon: Building2, category: 'transactions', hubView: 'BALANCE_SHEET', viewModes: ['BALANCE_SHEET'],
        dataSource: null, implementationStatus: 'coming-soon', restricted: true,
    },

    // --- Parties (shop database only: the API answers 501 unless ITEM_DATA_SOURCE=sql) ---
    'party-statement': {
        id: 'party-statement', title: 'Party Statement', description: 'Detailed account statement for any entity',
        icon: History, category: 'parties', hubView: 'REPORT_PARTY_STATEMENT',
        dataSource: 'textilesoft-sql', implementationStatus: 'live',
    },
    'party-wise-pl': {
        id: 'party-wise-pl', title: 'Party-Wise Profit & Loss', description: 'Profit tracking specific to each business partner',
        icon: PieChart, category: 'parties', hubView: 'REPORT_PARTY_PNL',
        dataSource: 'textilesoft-sql', implementationStatus: 'live',
    },
    'all-parties': {
        id: 'all-parties', title: 'All Parties', description: 'Comprehensive registry of vendors and customers',
        icon: Users, category: 'parties', hubView: 'REPORT_ALL_PARTIES',
        dataSource: 'textilesoft-sql', implementationStatus: 'live',
    },
    'party-report-item': {
        id: 'party-report-item', title: 'Party Report by Item', description: 'Breakdown of transactions with parties per item',
        icon: Layers, category: 'parties', hubView: 'REPORT_PARTY_ITEMS',
        dataSource: 'textilesoft-sql', implementationStatus: 'live',
    },
    'sales-party': {
        id: 'sales-party', title: 'Sales by Party', description: 'Sales performance segmented by customer',
        icon: BarChart3, category: 'parties', hubView: 'REPORT_SALES_BY_PARTY', viewModes: ['REPORT_CUSTOMER'],
        dataSource: 'textilesoft-sql', implementationStatus: 'live',
    },
    'purchase-party': {
        id: 'purchase-party', title: 'Purchase by Party', description: 'Procurement breakdown by supplier',
        icon: TrendingUp, category: 'parties', hubView: 'REPORT_PURCHASE_BY_PARTY', viewModes: ['REPORT_SUPPLIER'],
        dataSource: 'textilesoft-sql', implementationStatus: 'live',
    },
    'sales-party-group': {
        id: 'sales-party-group', title: 'Sales by Party Group', description: 'Sales analysis by customer categories',
        icon: Users, category: 'parties', hubView: 'REPORT_SALES_BY_PARTY_GROUP',
        dataSource: 'textilesoft-sql', implementationStatus: 'live',
    },
    'purchase-party-group': {
        id: 'purchase-party-group', title: 'Purchase by Party Group', description: 'Purchase analysis by vendor categories',
        icon: Building2, category: 'parties', hubView: 'REPORT_PURCHASE_BY_PARTY_GROUP',
        dataSource: 'textilesoft-sql', implementationStatus: 'live',
    },

    // --- Inventory ---
    'inventory': {
        id: 'inventory', title: 'Stock Status', description: 'Current stock levels and valuation',
        icon: Layers, category: 'inventory', hubView: 'REPORT_STOCK_STATUS', viewModes: ['REPORT_INVENTORY'],
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'low-stock': {
        id: 'low-stock', title: 'Low Stock Alert', description: 'Items below reorder point',
        icon: Zap, category: 'inventory', hubView: 'REPORT_LOW_STOCK',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'dead-stock': {
        id: 'dead-stock', title: 'Dead Stock Report', description: 'Non-moving items analysis',
        icon: Database, category: 'inventory', hubView: 'REPORT_DEAD_STOCK',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'city-wise-stock': {
        id: 'city-wise-stock', title: 'City-Wise Stock Report', description: 'Current stock position sliced by store city',
        icon: MapPin, category: 'inventory', hubView: 'REPORT_CITY_WISE_STOCK',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'rack-wise-stock': {
        id: 'rack-wise-stock', title: 'Floor/Rack-Wise Stock Report', description: 'Current stock position sliced by shelf/rack location',
        icon: LayoutGrid, category: 'inventory', hubView: 'REPORT_RACK_WISE_STOCK',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },

    // --- GST: shop bills and GRNs plus ERP invoices and supplier bills (GstReturnService). 'validation' until
    // `npm run check:gst` has been compared with Textilesoft's own GST report and the returns already filed.
    'gstr1': {
        id: 'gstr1', title: 'GSTR-1', description: 'Outward supplies: rate-wise, HSN summary and documents issued',
        icon: ClipboardList, category: 'gst', hubView: 'REPORT_GSTR1',
        dataSource: 'combined', implementationStatus: 'validation',
    },
    'purchase-gst-register': {
        id: 'purchase-gst-register', title: 'Purchase GST Register', description: 'Purchases with GST and claimable ITC, to match against GSTR-2B',
        icon: ClipboardList, category: 'gst', hubView: 'REPORT_PURCHASE_GST_REGISTER',
        dataSource: 'combined', implementationStatus: 'validation',
    },
    'gstr3b': {
        id: 'gstr3b', title: 'GSTR-3B', description: 'Monthly summary: output tax, ITC and tax payable',
        icon: ShieldCheck, category: 'gst', hubView: 'REPORT_GSTR3B', viewModes: ['REPORT_TAX'],
        dataSource: 'combined', implementationStatus: 'validation',
    },
    'gstr9': {
        id: 'gstr9', title: 'GSTR-9', description: 'Annual GST summary by month, rate and HSN',
        icon: Globe, category: 'gst', hubView: 'REPORT_GSTR9',
        dataSource: 'combined', implementationStatus: 'validation', restricted: true,
    },

    // --- Detailed analytics ---
    'brand-wise-sales': {
        id: 'brand-wise-sales', title: 'Brand-Wise Sales', description: 'Sales performance by brand',
        icon: Tag, category: 'analytics', hubView: 'REPORT_BRAND_WISE',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'category-wise-sales': {
        id: 'category-wise-sales', title: 'Category-Wise Sales', description: 'Sales distribution across categories',
        icon: PieChart, category: 'analytics', hubView: 'REPORT_CATEGORY_WISE',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'counter-wise-sales': {
        id: 'counter-wise-sales', title: 'Billing Counter-Wise Sales', description: 'Performance metric per billing counter (POS till)',
        icon: Store, category: 'analytics', hubView: 'REPORT_COUNTER_WISE',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'sales-counter-wise-sales': {
        id: 'sales-counter-wise-sales', title: 'Sales Counter-Wise Sales', description: 'Product sales grouped by sales-floor counter (not the billing till)',
        icon: Users, category: 'analytics', hubView: 'REPORT_SALES_COUNTER_WISE',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'hourly-billing': {
        id: 'hourly-billing', title: 'Hourly Billing Analysis', description: 'Peak hour analysis and load trends',
        icon: Clock, category: 'analytics', hubView: 'REPORT_HOURLY_BILLING',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'daily-sales': {
        id: 'daily-sales', title: 'Daily Sales Report', description: 'Day-by-day sales totals and payment split over a date range',
        icon: Calendar, category: 'analytics', hubView: 'REPORT_DAILY_SALES',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
    'product-wise-sales': {
        id: 'product-wise-sales', title: 'Product-Wise Sales', description: 'Sales performance by product type (Shirt, T-Shirt, Saree, etc.)',
        icon: Shirt, category: 'analytics', hubView: 'REPORT_PRODUCT_WISE',
        dataSource: 'item-data-source', implementationStatus: 'live',
    },
} satisfies Record<string, ReportDefinition>;

export type ReportId = keyof typeof reportRegistry;

const ALL_REPORTS: readonly ReportDefinition[] = Object.values(reportRegistry);

// ---------------------------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------------------------

export const getReport = (id: string): ReportDefinition | null =>
    (reportRegistry as Record<string, ReportDefinition>)[id] ?? null;

export const getReportsByCategory = (category: ReportCategoryId): ReportDefinition[] =>
    ALL_REPORTS.filter((r) => r.category === category);

const reportByAppView = new Map<AppView, ReportDefinition>();
for (const report of ALL_REPORTS) {
    for (const mode of report.viewModes ?? []) {
        if (reportByAppView.has(mode)) {
            throw new Error(`reportRegistry: viewMode ${mode} is claimed by more than one report`);
        }
        reportByAppView.set(mode, report);
    }
}

/** The report a global viewMode opens directly, or null (e.g. 'REPORTS' → catalog). */
export const getReportByAppView = (mode: AppView): ReportDefinition | null =>
    reportByAppView.get(mode) ?? null;
