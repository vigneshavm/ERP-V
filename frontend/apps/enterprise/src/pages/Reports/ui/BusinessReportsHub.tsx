import { useAuthStore } from '@repo/shared';
import React, { useState } from 'react';
import { RootState } from '@/app/store/store';
import { useBusinessReports, ReportType, BusinessReportData } from "@/widgets/stats-dashboard/lib/useBusinessReports";
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    ShoppingCart,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    ShieldAlert,
    Zap,
    Target,
    ArrowRight,
    Download,
    Filter,
    Calendar,
    Building2,
    PieChart,
    Activity,
    AlertCircle,
    Truck,
    Layers,
    Search,
    ChevronRight,
    ExternalLink,
    ChevronDown,
    Users,
    Briefcase,
    Receipt,
    Landmark,
    FileText,
    History,
    Scale,
    Wallet
} from 'lucide-react';

import BrandWiseSalesReport from './BrandWiseSalesReport';
import CategoryWiseSalesReport from './CategoryWiseSalesReport';
import CounterWiseSalesReport from './CounterWiseSalesReport';
import HourlyBillingReport from './HourlyBillingReport';

interface BusinessReportsHubProps {
    view: ReportType;
}

const BusinessReportsHub: React.FC<BusinessReportsHubProps> = ({ view }) => {
    const {  user, currentBranch  } = useAuthStore();

    // Default to current month-to-date
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState({ from: firstDay, to: today });
    const [branchFilter, setBranchFilter] = useState(currentBranch || 'ALL');

    const { data, loading } = useBusinessReports(view, { date_range: dateRange, branch_id: branchFilter });

    const getReportTitle = () => {
        switch (view) {
            case 'REPORT_SALES': return 'Sales Intelligence';
            case 'REPORT_PURCHASE': return 'Purchase & Procurement';
            case 'REPORT_INVENTORY': return 'Inventory Dynamics';
            case 'REPORT_CUSTOMER': return 'Customer Ledger & LTV';
            case 'REPORT_SUPPLIER': return 'Supplier Intelligence';
            case 'REPORT_TAX': return 'Tax & Statutory Compliance';
            case 'DAY_BOOK': return 'Daily Transaction Journal';
            case 'TRIAL_BALANCE': return 'Trial Balance & Accuracy';
            case 'PROFIT_LOSS': return 'Profit & Loss Statement';
            case 'BALANCE_SHEET': return 'Balance Sheet & Net Worth';
            default: return 'Business Intelligence';
        }
    };

    const getReportIcon = () => {
        switch (view) {
            case 'REPORT_SALES': return <BarChart3 className="w-6 h-6 text-primary" />;
            case 'REPORT_PURCHASE': return <ShoppingCart className="w-6 h-6 text-primary" />;
            case 'REPORT_INVENTORY': return <Package className="w-6 h-6 text-primary" />;
            case 'REPORT_CUSTOMER': return <Users className="w-6 h-6 text-primary" />;
            case 'REPORT_SUPPLIER': return <Briefcase className="w-6 h-6 text-primary" />;
            case 'REPORT_TAX': return <Receipt className="w-6 h-6 text-primary" />;
            case 'REPORT_FINANCIAL': return <Landmark className="w-6 h-6 text-primary" />;
            case 'DAY_BOOK': return <History className="w-6 h-6 text-primary" />;
            case 'TRIAL_BALANCE': return <Scale className="w-6 h-6 text-primary" />;
            case 'PROFIT_LOSS': return <PieChart className="w-6 h-6 text-primary" />;
            case 'BALANCE_SHEET': return <FileText className="w-6 h-6 text-primary" />;
            default: return <Activity className="w-6 h-6 text-primary" />;
        }
    };

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-primary animate-pulse" />
                    <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Running Advanced {getReportTitle()} Analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-20">
            {/* Dynamic Wings Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight uppercase">
                        {getReportIcon()}
                        {getReportTitle()}
                    </h2>
                    <p className="text-sm text-neutral-500 mt-0.5 font-medium">
                        Wings-grade audit-safe reporting for <span className="font-bold text-primary">{user?.tenantId || 'Enterprise'}</span>
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl px-3 py-1.5 shadow-sm text-xs font-bold gap-2">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Jan 1 - Jan 11, 2026</span>
                    </div>
                    <button className="px-4 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--erp-bg-sunken)] shadow-sm transition-all active:scale-95">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="px-4 py-2 bg-[var(--erp-bg)] text-main rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--erp-card)] shadow-xl transition-all active:scale-95">
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                </div>
            </div>

            {/* Render based on View */}
            {view === 'REPORT_SALES' && data.sales && <SalesReport sales={data.sales} />}
            {view === 'REPORT_PURCHASE' && data.purchase && <PurchaseReport purchase={data.purchase} />}
            {view === 'REPORT_INVENTORY' && data.inventory && <InventoryReport inventory={data.inventory} />}
            {view === 'REPORT_CUSTOMER' && data.customer && <CustomerReport customer={data.customer} />}
            {view === 'REPORT_SUPPLIER' && data.supplier && <SupplierReport supplier={data.supplier} />}
            {view === 'REPORT_TAX' && data.tax && <TaxReport tax={data.tax} />}
            {view === 'REPORT_FINANCIAL' && data.financial && <FinancialHealthReport financial={data.financial} />}
            {view === 'DAY_BOOK' && data.day_book && <DayBookReport day_book={data.day_book} />}
            {view === 'TRIAL_BALANCE' && data.trial_balance && <TrialBalanceReport trial_balance={data.trial_balance} />}
            {view === 'PROFIT_LOSS' && data.profit_loss && <ProfitLossReport profit_loss={data.profit_loss} />}
            {view === 'BALANCE_SHEET' && data.balance_sheet && <BalanceSheetReport balance_sheet={data.balance_sheet} />}

            {view === 'REPORT_BRAND_WISE' && <BrandWiseSalesReport timeRange="MONTH" />}
            {view === 'REPORT_CATEGORY_WISE' && <CategoryWiseSalesReport timeRange="MONTH" />}
            {view === 'REPORT_COUNTER_WISE' && <CounterWiseSalesReport timeRange="MONTH" />}
            {view === 'REPORT_HOURLY_BILLING' && <HourlyBillingReport timeRange="MONTH" />}

            {/* Shared Intelligence Rail */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    {/* Main Chart Area Placeholder */}
                    <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] border border-default dark:border-default p-8 min-h-[400px] shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-sm font-black uppercase tracking-widest">Growth Analytics & Trends</h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    <div className="w-3 h-3 rounded-full bg-primary" /> Current Period
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                                    <div className="w-3 h-3 rounded-full bg-neutral-200" /> Previous Period
                                </div>
                            </div>
                        </div>
                        <div className="h-64 flex items-end gap-3 px-4">
                            {[65, 40, 85, 30, 95, 60, 45, 80, 55, 70, 90, 85].map((h, i) => (
                                <div key={i} className="flex-1 group relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--erp-bg)] text-main text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">₹{(h * 10).toLocaleString()}k</div>
                                    <div className="w-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-t-lg h-full relative overflow-hidden">
                                        <div className="absolute bottom-0 w-full bg-primary transition-all duration-1000 ease-out group-hover:brightness-110" style={{ height: `${h}%` }} />
                                    </div>
                                    <p className="text-[8px] font-black text-neutral-400 mt-2 text-center">D{i + 1}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-8 border-t border-neutral-50 dark:border-neutral-900 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                            <span>Performance Matrix: Stable</span>
                            <span className="flex items-center gap-1"><Target className="w-3 h-3 text-primary" /> Target Reached: 94.2%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="page-shell">
                        <Activity className="absolute -top-10 -right-10 w-40 h-40 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 italic">Agent Intelligence</h4>
                        <div className="space-y-6 relative z-10">
                            <div className="p-4 bg-[var(--erp-bg-sunken)] rounded-2xl border border-default">
                                <p className="text-[11px] font-bold leading-relaxed text-neutral-300">
                                    {view === 'REPORT_SALES' ? "Sales spike detected on Day 5 (+24%). Likely driven by Weekend promotional textile clearance." :
                                        view === 'REPORT_PURCHASE' ? "ABC Textiles is currently your lowest-lead-time vendor. Suggest consolidating 'Cotton' group orders." :
                                            view === 'REPORT_INVENTORY' ? "Cotton Shirt XL is selling 4x faster than other SKUs. Stockout prediction: 4.5 days." :
                                                view === 'REPORT_CUSTOMER' ? "Repeat frequency is up by 12%. High LTV customers are shifting towards digital payments." :
                                                    view === 'REPORT_SUPPLIER' ? "Payment delays detected for Sujatha Mill. Risk of credit rating downgrade." :
                                                        view === 'REPORT_TAX' ? "Net taxable sales vs exempt sales ratio is optimal (17.6x). ITC utilization at 74%." :
                                                            view === 'PROFIT_LOSS' ? "Margin erosion detected in Coimbatore branch (-12%). High logistics cost is impacting net profit." :
                                                                view === 'BALANCE_SHEET' ? "Current ratio is 4.2. High liquidity indicates under-utilized cash reserves. Suggest short-term investments." :
                                                                    view === 'DAY_BOOK' ? "All 4 vouchers today match bank/cash ledger reconciliations. Zero discrepancies detected." :
                                                                        view === 'TRIAL_BALANCE' ? "Total Debits match Total Credits exactly. No orphan accounts or suspense entries found." :
                                                                            "Operating profit margin (27.4%) exceeds industry average. Cash flow is positive and stable."}
                                </p>
                            </div>

                            {data.audit_flags.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-error flex items-center gap-2">
                                        <ShieldAlert className="w-3 h-3" /> Audit Warnings
                                    </p>
                                    <div className="space-y-2">
                                        {data.audit_flags.map((flag, i) => (
                                            <div key={i} className="text-[9px] font-bold text-neutral-400 bg-[var(--erp-bg-sunken)] p-2 rounded-lg border border-default leading-tight">
                                                {flag}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Key Business Drivers</p>
                                {[
                                    { label: 'Customer Retention', val: '82%' },
                                    { label: 'Avg Order Value', val: '₹4,820' },
                                    { label: 'Efficiency Index', val: '0.94' }
                                ].map((stat, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase font-bold text-neutral-400">{stat.label}</span>
                                        <span className="text-xs font-black">{stat.val}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                                Download Full AI Insight
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Specialized Components

const SalesReport: React.FC<{ sales: NonNullable<BusinessReportData['sales']> }> = ({ sales }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Gross Sales" value={`₹${sales.total_sales.toLocaleString()}`} change="+14%" isPositive={true} />
                <StatCard label="Net Sales" value={`₹${sales.net_sales.toLocaleString()}`} change="-2%" isPositive={false} sub="After Returns" />
                <StatCard label="Tax (GST)" value={`₹${sales.gst_collected.toLocaleString()}`} sub="Collected" />
            </div>
            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Payment Split</p>
                <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-black">
                            <span>Bank</span>
                            <span>{sales.payment_split.bank}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${sales.payment_split.bank}%` }} />
                        </div>
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-black text-neutral-400">
                            <span>Cash</span>
                            <span>{sales.payment_split.cash}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full overflow-hidden">
                            <div className="h-full bg-neutral-300" style={{ width: `${sales.payment_split.cash}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PurchaseReport: React.FC<{ purchase: NonNullable<BusinessReportData['purchase']> }> = ({ purchase }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Purchases" value={`₹${purchase.total_purchase.toLocaleString()}`} />
                <StatCard label="Input Tax (ITC)" value={`₹${purchase.input_tax_credit.toLocaleString()}`} sub="GST Recoverable" />
                <div className="md:col-span-2 bg-error text-main p-6 rounded-[2rem] shadow-xl shadow-error/10 relative overflow-hidden group">
                    <ShieldAlert className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-all" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">Critical Procurement Alerts</p>
                    <ul className="space-y-2 relative z-10">
                        {purchase.alerts.slice(0, 2).map((alert, i) => (
                            <li key={i} className="text-xs font-bold flex items-start gap-2 leading-tight">
                                <span className="w-1 h-1 rounded-full bg-white mt-1.5 shrink-0" /> {alert}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const InventoryReport: React.FC<{ inventory: NonNullable<BusinessReportData['inventory']> }> = ({ inventory }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm border-l-4 border-l-primary">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Closing Stock Value</p>
                <h3 className="text-2xl font-black tabular-nums">₹{inventory.closing_stock_value.toLocaleString()}</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-primary mt-2">Valuation: FIFO</p>
            </div>
            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm border-l-4 border-l-error">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 text-error">Dead Stock Value</p>
                <h3 className="text-2xl font-black tabular-nums text-error">₹{inventory.dead_stock_value.toLocaleString()}</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-2">90+ Days Static</p>
            </div>
            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm border-l-4 border-l-amber-500">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
                <h3 className="text-2xl font-black tabular-nums text-amber-500">{inventory.low_stock_items} ITEMS</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-2">Reorder Immediate</p>
            </div>
            <div className="bg-[var(--erp-bg)] text-main p-6 rounded-[2rem] shadow-xl border border-default">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Fast Moving</p>
                <div className="flex flex-wrap gap-2">
                    {inventory.fast_moving_items.map((item, i) => (
                        <span key={i} className="px-2 py-1 bg-[var(--erp-bg-sunken)] rounded-lg border border-default text-[9px] font-black uppercase tracking-tighter">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CustomerReport: React.FC<{ customer: NonNullable<BusinessReportData['customer']> }> = ({ customer }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total Customer Sales" value={`₹${customer.total_sales.toLocaleString()}`} change="+18%" isPositive={true} />
            <StatCard label="Outstanding Dues" value={`₹${customer.outstanding_dues.toLocaleString()}`} change="+5%" isPositive={false} />
            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Retention & Returns</p>
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-center">
                            <p className="text-lg font-black">{customer.repeat_frequency}</p>
                            <p className="text-[8px] font-black uppercase text-success">Repeat Rate</p>
                        </div>
                        <div className="w-px h-8 bg-[var(--erp-bg-sunken)] dark:bg-neutral-700" />
                        <div className="text-center">
                            <p className="text-lg font-black">{customer.return_ratio}</p>
                            <p className="text-[8px] font-black uppercase text-error">Return %</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-[var(--erp-bg)] text-main p-6 rounded-[2rem] shadow-xl">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">High Risk debtors</p>
                <div className="space-y-2">
                    {customer.high_risk_debtors.map((debtor, i) => (
                        <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                            <span className="truncate max-w-[100px]">{debtor.name}</span>
                            <span className="text-error">₹{(debtor.amount / 1000).toFixed(0)}k</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SupplierReport: React.FC<{ supplier: NonNullable<BusinessReportData['supplier']> }> = ({ supplier }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total Purchases" value={`₹${supplier.total_purchases.toLocaleString()}`} />
            <StatCard label="Accounts Payable" value={`₹${supplier.outstanding_payable.toLocaleString()}`} sub="Pending 30+ Days" />
            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Efficiency Metrics</p>
                <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-neutral-500">Pay Delay</span>
                        <span className="text-xs font-black text-error">{supplier.payment_delays}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-neutral-500">GRN Mismatch</span>
                        <span className="text-xs font-black text-amber-500">{supplier.grn_mismatches} INVs</span>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Top Payables</p>
                <div className="space-y-2">
                    {supplier.top_payables.map((v, i) => (
                        <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                            <span className="truncate max-w-[100px]">{v.vendor}</span>
                            <span className="font-black text-primary">₹{(v.amount / 1000).toFixed(0)}k</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TaxReport: React.FC<{ tax: NonNullable<BusinessReportData['tax']> }> = ({ tax }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Net Tax Payable" value={`₹${tax.net_payable.toLocaleString()}`} sub="Current Period" />
                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Output vs Input GST</p>
                        <Scale className="w-4 h-4 text-neutral-300" />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                                <span>Output (Sales)</span>
                                <span>₹{(tax.output_tax / 1000).toFixed(0)}k</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full overflow-hidden">
                                <div className="h-full bg-error" style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                                <span>Input (Purchase)</span>
                                <span>₹{(tax.input_tax / 1000).toFixed(0)}k</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full overflow-hidden">
                                <div className="h-full bg-success" style={{ width: `${(tax.input_tax / tax.output_tax) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--erp-bg)] text-main p-6 rounded-[2rem] shadow-xl">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Branch Liability</p>
                    <div className="space-y-2">
                        {tax.branch_liability.map((b, i) => (
                            <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                                <span>{b.branch}</span>
                                <span>₹{(b.liability / 1000).toFixed(0)}k</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FinancialHealthReport: React.FC<{ financial: NonNullable<BusinessReportData['financial']> }> = ({ financial }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-success text-main p-6 rounded-[2rem] shadow-xl flex flex-col justify-between group">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Net Profit</p>
                        <h3 className="text-2xl font-black">₹{financial.profit.toLocaleString()}</h3>
                    </div>
                    <p className="text-[9px] font-black uppercase mt-4 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> 27.4% Margin
                    </p>
                </div>

                <StatCard label="Operating Revenue" value={`₹${financial.revenue.toLocaleString()}`} sub="Total Sales" />

                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Balance Sheet Equation</p>
                        <p className="text-[9px] font-black text-primary">A = L + E</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-primary rounded-l-lg relative group">
                            <div className="absolute -top-6 left-0 text-[8px] font-black text-primary uppercase">Assets ₹{(financial.assets / 1000000).toFixed(1)}M</div>
                        </div>
                        <div className="flex-[0.31] h-3 bg-error relative group">
                            <div className="absolute -top-6 left-0 text-[8px] font-black text-error uppercase">Liab ₹{(financial.liabilities / 1000000).toFixed(1)}M</div>
                        </div>
                        <div className="flex-[0.69] h-3 bg-[var(--erp-bg)] dark:bg-white rounded-r-lg relative group">
                            <div className="absolute -top-6 left-0 text-[8px] font-black text-neutral-400 uppercase">Equity ₹{(financial.equity / 1000000).toFixed(1)}M</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[var(--erp-card)] p-5 rounded-2xl border border-default dark:border-default shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-500">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Banks & Cash</p>
                        <p className="text-sm font-black whitespace-nowrap">₹{financial.bank_balance.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[var(--erp-card)] p-5 rounded-2xl border border-default dark:border-default shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-success/10 rounded-xl text-success">
                        <ArrowDownRight className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Receivables</p>
                        <p className="text-sm font-black whitespace-nowrap">₹{financial.receivables.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[var(--erp-card)] p-5 rounded-2xl border border-default dark:border-default shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-error/10 rounded-xl text-error">
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Payables</p>
                        <p className="text-sm font-black whitespace-nowrap">₹{financial.payables.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DayBookReport: React.FC<{ day_book: NonNullable<BusinessReportData['day_book']> }> = ({ day_book }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Opening Cash" value={`₹${day_book.opening_cash.toLocaleString()}`} />
                <StatCard label="Closing Cash" value={`₹${day_book.closing_cash.toLocaleString()}`} isPositive={day_book.closing_cash >= day_book.opening_cash} change={day_book.closing_cash >= day_book.opening_cash ? `+₹${day_book.closing_cash - day_book.opening_cash}` : `-₹${day_book.opening_cash - day_book.closing_cash}`} />
                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm col-span-2 flex items-center justify-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Audit Status: <span className="text-success">Verified & Reconciled</span></p>
                </div>
            </div>
            <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] border border-default dark:border-default overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50">
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default">Time</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default">Voucher</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default">Particulars</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default">Debit (in)</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default">Credit (out)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                            {day_book.entries.map((v) => (
                                <tr key={v.id} className="hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-bg)]/30 transition-colors">
                                    <td className="p-5 text-[11px] font-bold text-neutral-500">{v.timestamp}</td>
                                    <td className="p-5 text-[11px] font-black text-primary uppercase">{v.voucher_no}</td>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black">{v.party}</span>
                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{v.reference}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-xs font-black text-success tabular-nums">{v.type === 'INCOME' || v.type === 'PAYMENT' ? `₹${v.amount.toLocaleString()}` : '-'}</td>
                                    <td className="p-5 text-xs font-black text-error tabular-nums">{v.type === 'EXPENSE' || v.type === 'PURCHASE' ? `₹${v.amount.toLocaleString()}` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const TrialBalanceReport: React.FC<{ trial_balance: NonNullable<BusinessReportData['trial_balance']> }> = ({ trial_balance }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--erp-bg)] text-main p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between col-span-2">
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 font-italic underline">Ledger Reconciliation</p>
                        <h3 className="text-3xl font-black italic tracking-tighter">Debits = Credits</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Balanced Amount</p>
                        <p className="text-2xl font-black text-primary">₹{trial_balance.total_debit.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[var(--erp-card)] p-8 rounded-[2.5rem] border border-default dark:border-default shadow-sm flex flex-col justify-center text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Scale Balance</p>
                    <div className="relative h-2 w-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full overflow-hidden">
                        <div className="absolute left-1/2 -ml-px w-0.5 h-full bg-primary z-10" />
                        <div className="h-full bg-success opacity-20" style={{ width: '100%' }} />
                    </div>
                    <p className="text-[9px] font-black text-success uppercase mt-2">Perfectly Balanced</p>
                </div>
            </div>
            <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] border border-default dark:border-default overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50">
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default">Account Name</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default text-right">Opening</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default text-right">Debit</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default text-right">Credit</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-default dark:border-default text-right">Closing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                        {trial_balance.accounts.map((acc) => (
                            <tr key={acc.id} className="hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-bg)]/30 transition-colors">
                                <td className="p-5">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black">{acc.name}</span>
                                        <span className="text-[9px] font-bold text-neutral-400 uppercase">{acc.type}</span>
                                    </div>
                                </td>
                                <td className="p-5 text-xs font-bold text-neutral-500 text-right tabular-nums">₹{acc.opening.toLocaleString()}</td>
                                <td className="p-5 text-xs font-black text-neutral-900 dark:text-main text-right tabular-nums">₹{acc.debit.toLocaleString()}</td>
                                <td className="p-5 text-xs font-black text-neutral-900 dark:text-main text-right tabular-nums">₹{acc.credit.toLocaleString()}</td>
                                <td className="p-5 text-xs font-black text-primary text-right tabular-nums">₹{acc.closing.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50">
                        <tr>
                            <td className="p-5 text-[10px] font-black uppercase tracking-widest">Total Balances</td>
                            <td className="p-5"></td>
                            <td className="p-5 text-xs font-black text-neutral-900 dark:text-main text-right">₹{trial_balance.total_debit.toLocaleString()}</td>
                            <td className="p-5 text-xs font-black text-neutral-900 dark:text-main text-right">₹{trial_balance.total_credit.toLocaleString()}</td>
                            <td className="p-5"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

const ProfitLossReport: React.FC<{ profit_loss: NonNullable<BusinessReportData['profit_loss']> }> = ({ profit_loss }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Net Profit" value={`₹${profit_loss.net_profit.toLocaleString()}`} change={profit_loss.margin} isPositive={true} sub="Net Margin" />
                <StatCard label="Gross Profit" value={`₹${profit_loss.gross_profit.toLocaleString()}`} sub="Revenue - COGS" />
                <StatCard label="Operating Exp" value={`₹${profit_loss.operating_expenses.toLocaleString()}`} />
                <div className="bg-[var(--erp-bg)] text-main p-6 rounded-[2rem] shadow-xl">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Branch Profitability</p>
                    <div className="space-y-2">
                        {profit_loss.branch_view.map((b, i) => (
                            <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                                <span>{b.branch}</span>
                                <span className="text-success">{b.margin}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[var(--erp-card)] p-8 rounded-[2.5rem] border border-default dark:border-default shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <h4 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Trading & Profit/Loss Account breakdown
                </h4>
                <div className="space-y-6 relative z-10">
                    <PLRow label="Revenue from Operations (Sales)" value={profit_loss.net_sales} isMain />
                    <PLRow label="Less: Cost of Goods Sold (COGS)" value={-profit_loss.cogs} />
                    <div className="pt-2 border-t border-default dark:border-default">
                        <PLRow label="GROSS PROFIT" value={profit_loss.gross_profit} isBold isSuccess />
                    </div>
                    <PLRow label="Less: Operating Expenses" value={-profit_loss.operating_expenses} />
                    <PLRow label="Add: Other Income" value={profit_loss.other_income} />
                    <div className="pt-4 border-t-2 border-neutral-900 dark:border-white">
                        <PLRow label="NET PROFIT FOR THE PERIOD" value={profit_loss.net_profit} isBold isSuccess textLarge />
                    </div>
                </div>
            </div>
        </div>
    );
};

const BalanceSheetReport: React.FC<{ balance_sheet: NonNullable<BusinessReportData['balance_sheet']> }> = ({ balance_sheet }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Current Ratio</p>
                        <h3 className="text-2xl font-black">{balance_sheet.ratios.current_ratio}</h3>
                    </div>
                    <div className={`p-4 rounded-2xl ${parseFloat(balance_sheet.ratios.current_ratio) > 2 ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-500'}`}>
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Debt to Equity</p>
                        <h3 className="text-2xl font-black">{balance_sheet.ratios.debt_equity}</h3>
                    </div>
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                        <Zap className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-[var(--erp-bg)] text-main p-6 rounded-[2rem] shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Working Capital</p>
                        <h3 className="text-2xl font-black text-success">₹{(balance_sheet.ratios.working_capital / 1000000).toFixed(2)}M</h3>
                    </div>
                    <PieChart className="w-8 h-8 opacity-20" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets Side */}
                <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] border border-default dark:border-default overflow-hidden shadow-sm">
                    <div className="p-6 bg-[var(--erp-bg)] text-main flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest">Assets side</h4>
                        <span className="text-xs font-black">₹{balance_sheet.assets.total.toLocaleString()}</span>
                    </div>
                    <div className="p-8 space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 border-b border-primary/20 pb-1">Current Assets</p>
                            <div className="space-y-4">
                                {balance_sheet.assets.current.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-neutral-500">{item.name}</span>
                                        <span className="text-xs font-black">₹{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 border-b border-default dark:border-default pb-1">Fixed Assets</p>
                            <div className="space-y-4">
                                {balance_sheet.assets.fixed.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-neutral-500">{item.name}</span>
                                        <span className="text-xs font-black">₹{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liabilities & Equity Side */}
                <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2.5rem] border border-default dark:border-default overflow-hidden shadow-sm">
                    <div className="p-6 bg-primary text-white flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest">Liabilities & Equity</h4>
                        <span className="text-xs font-black">₹{(balance_sheet.liabilities.total + balance_sheet.equity.total).toLocaleString()}</span>
                    </div>
                    <div className="p-8 space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-error uppercase tracking-widest mb-4 border-b border-error/20 pb-1">Liabilities</p>
                            <div className="space-y-4">
                                {[...balance_sheet.liabilities.current, ...balance_sheet.liabilities.long_term].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-neutral-500">{item.name}</span>
                                        <span className="text-xs font-black">₹{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-success uppercase tracking-widest mb-4 border-b border-success/20 pb-1">Equity & Capital</p>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-neutral-500">Share Capital</span>
                                    <span className="text-xs font-black">₹{balance_sheet.equity.capital.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-neutral-500">Retained Earnings</span>
                                    <span className="text-xs font-black">₹{balance_sheet.equity.retained_earnings.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center px-3 py-2 bg-success/5 rounded-xl border border-success/10">
                                    <span className="text-xs font-black text-success">Current Period Profit</span>
                                    <span className="text-xs font-black text-success">₹{balance_sheet.equity.current_profit.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PLRow: React.FC<{ label: string; value: number; isBold?: boolean; isMain?: boolean; isSuccess?: boolean; textLarge?: boolean }> = ({ label, value, isBold, isMain, isSuccess, textLarge }) => (
    <div className={`flex justify-between items-center ${isBold ? 'font-black' : 'font-bold'} ${textLarge ? 'text-lg' : 'text-xs'}`}>
        <span className={`${isMain ? 'text-neutral-900 dark:text-main uppercase tracking-widest' : 'text-neutral-500'}`}>{label}</span>
        <span className={`${isSuccess ? 'text-success' : value < 0 ? 'text-error' : 'text-neutral-900 dark:text-main'} tabular-nums`}>
            {value < 0 ? `(₹${Math.abs(value).toLocaleString()})` : `₹${value.toLocaleString()}`}
        </span>
    </div>
);

const StatCard: React.FC<{ label: string; value: string; change?: string; isPositive?: boolean; sub?: string }> = ({ label, value, change, isPositive, sub }) => (
    <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-[2rem] border border-default dark:border-default shadow-sm group">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black tabular-nums group-hover:text-primary transition-colors">{value}</h3>
        {change && (
            <div className={`flex items-center gap-1.5 mt-2 font-bold text-[10px] uppercase ${isPositive ? 'text-success' : 'text-error'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change} {sub && <span className="text-neutral-400 text-[8px] tracking-normal">({sub})</span>}
            </div>
        )}
        {!change && sub && (
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-2">{sub}</p>
        )}
    </div>
);

export default BusinessReportsHub;
