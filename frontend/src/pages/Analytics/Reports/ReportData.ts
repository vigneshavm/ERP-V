import {
    FileText,
    BarChart3,
    TrendingUp,
    Users,
    Wallet,
    Scale,
    LineChart,
    Layers,
    Database,
    History,
    BookOpen,
    CreditCard,
    ClipboardList,
    PieChart,
    Building2,
    ShieldCheck,
    Briefcase,
    Globe,
    Zap
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface ReportItem {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    slug: string;
    roles?: string[];
}

export interface ReportCategory {
    id: string;
    title: string;
    reports: ReportItem[];
}

export const REPORT_CATALOG: ReportCategory[] = [
    {
        id: 'transactions',
        title: 'Transaction Reports',
        reports: [
            { id: 'sales', name: 'Sales Report', description: 'Detailed log of all sales transactions', icon: BarChart3, slug: 'sales' },
            { id: 'purchase', name: 'Purchase Report', description: 'Overview of all procurement activities', icon: TrendingUp, slug: 'purchase' },
            { id: 'daybook', name: 'Day Book', description: 'Daily transaction summary and audit trail', icon: BookOpen, slug: 'daybook' },
            { id: 'all-transactions', name: 'All Transactions', description: 'Consolidated view of every monetary movement', icon: Database, slug: 'all-transactions' },
            { id: 'profit-loss', name: 'Profit & Loss', description: 'Statement of revenues, costs, and expenses', icon: LineChart, slug: 'profit-loss' },
            { id: 'bill-wise-profit', name: 'Bill-Wise Profit', description: 'Profitability analysis at the invoice level', icon: Zap, slug: 'bill-wise-profit' },
            { id: 'cash-flow', name: 'Cash Flow', description: 'Monitoring of cash inflows and outflows', icon: Wallet, slug: 'cash-flow' },
            { id: 'trial-balance', name: 'Trial Balance', description: 'Worksheet listing all ledger balances', icon: Scale, slug: 'trial-balance' },
            { id: 'balance-sheet', name: 'Balance Sheet', description: 'Snapshot of assets, liabilities, and equity', icon: Building2, slug: 'balance-sheet' },
        ]
    },
    {
        id: 'parties',
        title: 'Party Reports',
        reports: [
            { id: 'party-statement', name: 'Party Statement', description: 'Detailed account statement for any entity', icon: History, slug: 'party-statement' },
            { id: 'party-wise-pl', name: 'Party-Wise Profit & Loss', description: 'Profit tracking specific to each business partner', icon: PieChart, slug: 'party-wise-pl' },
            { id: 'all-parties', name: 'All Parties', description: 'Comprehensive registry of vendors and customers', icon: Users, slug: 'all-parties' },
            { id: 'party-report-item', name: 'Party Report by Item', description: 'Breakdown of transactions with parties per item', icon: Layers, slug: 'party-report-item' },
            { id: 'sales-party', name: 'Sales by Party', description: 'Sales performance segmented by customer', icon: BarChart3, slug: 'sales-party' },
            { id: 'purchase-party', name: 'Purchase by Party', description: 'Procurement breakdown by supplier', icon: TrendingUp, slug: 'purchase-party' },
            { id: 'sales-party-group', name: 'Sales by Party Group', description: 'Sales analysis by customer categories', icon: Users, slug: 'sales-party-group' },
            { id: 'purchase-party-group', name: 'Purchase by Party Group', description: 'Purchase analysis by vendor categories', icon: Building2, slug: 'purchase-party-group' },
        ]
    },
    {
        id: 'inventory',
        title: 'Inventory Reports',
        reports: [
            { id: 'stock-status', name: 'Stock Status', description: 'Current stock levels and valuation', icon: Layers, slug: 'inventory' },
            { id: 'low-stock', name: 'Low Stock Alert', description: 'Items below reorder point', icon: Zap, slug: 'low-stock' },
            { id: 'dead-stock', name: 'Dead Stock Report', description: 'Non-moving items analysis', icon: Database, slug: 'dead-stock' },
        ]
    },
    {
        id: 'gst',
        title: 'GST Reports',
        reports: [
            { id: 'gstr1', name: 'GSTR-1', description: 'Returns for outward supplies (Sales)', icon: ClipboardList, slug: 'gstr1' },
            { id: 'gstr2', name: 'GSTR-2', description: 'Returns for inward supplies (Purchases)', icon: ClipboardList, slug: 'gstr2' },
            { id: 'gstr3b', name: 'GSTR-3B', description: 'Monthly self-declaration summary', icon: ShieldCheck, slug: 'gstr3b' },
            { id: 'gstr9', name: 'GSTR-9', description: 'Annual GST return summary', icon: Globe, slug: 'gstr9' },
        ]
    }
];
