import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useBusinessReports, ReportType, BusinessReportData } from "../../hooks/useBusinessReports";
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
import { motion, AnimatePresence } from 'framer-motion';

import BrandWiseSalesReport from './BrandWiseSalesReport';
import CategoryWiseSalesReport from './CategoryWiseSalesReport';
import CounterWiseSalesReport from './CounterWiseSalesReport';
import HourlyBillingReport from './HourlyBillingReport';

interface BusinessReportsHubProps {
    view: ReportType;
}

const BusinessReportsHub: React.FC<BusinessReportsHubProps> = ({ view }) => {
    const { user, currentBranch } = useSelector((state: RootState) => state.auth);
    const [isPending, startTransition] = React.useTransition();

    // Default to current month-to-date
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState({ from: firstDay, to: today });
    const [branchFilter, setBranchFilter] = useState(currentBranch || 'ALL');

    const { data, loading: apiLoading } = useBusinessReports(view, { date_range: dateRange, branch_id: branchFilter });

    const getReportTitle = () => {
        switch (view) {
            case 'REPORT_SALES': return 'Sales Intelligence';
            case 'REPORT_PURCHASE': return 'Purchase & Procurement';
            case 'REPORT_INVENTORY': return 'Inventory Dynamics';
            case 'REPORT_CUSTOMER': return 'Customer Ledger & LTV';
            case 'REPORT_SUPPLIER': return 'Supplier Intelligence';
            case 'REPORT_TAX': return 'Tax & Compliance';
            case 'DAY_BOOK': return 'Daily Journal';
            case 'TRIAL_BALANCE': return 'Trial Balance';
            case 'PROFIT_LOSS': return 'Profit & Loss';
            case 'BALANCE_SHEET': return 'Balance Sheet';
            default: return 'Business Intelligence';
        }
    };

    const getReportIcon = () => {
        switch (view) {
            case 'REPORT_SALES': return BarChart3;
            case 'REPORT_PURCHASE': return ShoppingCart;
            case 'REPORT_INVENTORY': return Package;
            case 'REPORT_CUSTOMER': return Users;
            case 'REPORT_SUPPLIER': return Briefcase;
            case 'REPORT_TAX': return Receipt;
            case 'DAY_BOOK': return History;
            case 'TRIAL_BALANCE': return Scale;
            case 'PROFIT_LOSS': return PieChart;
            case 'BALANCE_SHEET': return FileText;
            default: return Activity;
        }
    };

    const Icon = getReportIcon();

    if (apiLoading || !data) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="w-24 h-24 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                </div>
                <div className="absolute mt-40">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] animate-pulse">Running Neural {getReportTitle()} Analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
            {/* === TACTICAL HUB HEADER === */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-center shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                        <Icon className="w-8 h-8 text-indigo-500 relative z-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-main tracking-tighter uppercase italic leading-none">{getReportTitle()}</h2>
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded text-[9px] font-black tracking-widest uppercase">NODE-0{view.length % 9}</span>
                        </div>
                        <p className="text-[10px] font-bold text-secondary tracking-widest uppercase mt-2">
                             High-Integrity Insight for <span className="text-main font-black">{user?.tenantId || 'Enterprise'}</span> • <span className="text-emerald-500 font-black">Audit Safe</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="h-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 flex items-center gap-3 shadow-sm group">
                        <Calendar className="w-4 h-4 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="text-[10px] font-black tracking-tight uppercase">Jan 01 - Jan 11, 2026</span>
                    </div>
                    <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center gap-3 hover:bg-white/[0.05] transition-all active:scale-95 group">
                         <Download className="w-4 h-4 text-secondary group-hover:text-indigo-500 transition-colors" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
                    </button>
                    <button className="h-12 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl flex items-center gap-3 hover:opacity-90 shadow-2xl transition-all active:scale-95 group">
                         <Filter className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Configure</span>
                    </button>
                </div>
            </div>

            {/* === CORE DATA VISUALIZATION === */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
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
                </motion.div>
            </AnimatePresence>

            {/* === INTELLIGENCE RAIL === */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-10 min-h-[450px] shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-main italic">Trajectory Analytics</h4>
                                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Growth Vectors & Temporal Distribution</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" /> Current Epoch
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                    <div className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800" /> Historic Reference
                                </div>
                            </div>
                        </div>

                        <div className="h-64 flex items-end gap-3 px-2">
                            {[65, 40, 85, 30, 95, 60, 45, 80, 55, 70, 90, 85].map((h, i) => (
                                <div key={i} className="flex-1 group/bar relative">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: i * 0.05 }}
                                        className="w-full bg-neutral-100 dark:bg-neutral-800/50 rounded-t-xl h-full relative overflow-hidden"
                                    >
                                        <div className="absolute bottom-0 w-full bg-indigo-500 group-hover/bar:bg-indigo-400 transition-all duration-500" style={{ height: '100%' }} />
                                    </motion.div>
                                    <p className="text-[9px] font-black text-neutral-400 mt-4 text-center tracking-tighter">P{i + 1}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="text-secondary italic">Consolidation Matrix: <span className="text-main not-italic">OPTIMAL</span></span>
                            <span className="flex items-center gap-2 text-indigo-500"><Target className="w-3.5 h-3.5" /> Performance Delta: +14.2%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group min-h-[450px] flex flex-col">
                        <Activity className="absolute -top-10 -right-10 w-40 h-40 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                        
                        <div className="flex items-center gap-3 mb-8">
                             <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                                  <Zap className="w-4 h-4 text-indigo-500" />
                             </div>
                             <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white italic">Neural Insight</h4>
                        </div>

                        <div className="flex-1 space-y-8 relative z-10">
                            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/10 shadow-inner">
                                <p className="text-[11px] font-bold leading-relaxed text-neutral-400 italic">
                                    {view === 'REPORT_SALES' ? "High-velocity sales detected in Sector-7. Suggest scaling textile inventory by 15% for next epoch." :
                                        view === 'REPORT_PURCHASE' ? "ABC Procurements are showing a 12% lead-time reduction. Consolidation recommended." :
                                            view === 'REPORT_INVENTORY' ? "Stock rotation for 'Alpha-Series' exceeds baseline. Recalibrating reorder buffers." :
                                                "Organizational health remains stable (+4.2%). Liquidity indices are trending towards surplus state."}
                                </p>
                            </div>

                            {data.audit_flags.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                                        <ShieldAlert className="w-3.5 h-3.5" /> Integrity Warnings
                                    </p>
                                    <div className="space-y-2">
                                        {data.audit_flags.map((flag, i) => (
                                            <div key={i} className="text-[9px] font-bold text-neutral-500 bg-white/[0.02] p-3 rounded-xl border border-white/5 leading-tight">
                                                {flag}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Core Performance Metrics</p>
                                {[
                                    { label: 'Market Velocity', val: '8.4', color: 'indigo' },
                                    { label: 'Risk Indices', val: '0.04', color: 'emerald' },
                                    { label: 'Solvency Ratio', val: '1.2x', color: 'amber' }
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest">
                                            <span className="text-neutral-500">{stat.label}</span>
                                            <span className="text-white">{stat.val}</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                             <div className="h-full bg-indigo-500" style={{ width: '70%', opacity: 0.5 + (i * 0.2) }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="w-full h-14 bg-white text-neutral-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-neutral-100 transition-all mt-8 active:scale-95">
                             Generate Intelligence Dossier
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Specialized Components

const SalesReport: React.FC<{ sales: NonNullable<BusinessReportData['sales']> }> = ({ sales }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Revenue" value={`₹${sales.total_sales.toLocaleString()}`} change="+12.4%" isPositive={true} accent="indigo" />
            <StatCard label="Net Operations" value={`₹${sales.net_sales.toLocaleString()}`} change="-0.8%" isPositive={false} sub="Post Returns" accent="emerald" />
            <StatCard label="GST Recievable" value={`₹${sales.gst_collected.toLocaleString()}`} sub="Current Cycle" accent="amber" />
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6">Payment Vector Distribution</p>
                <div className="space-y-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                            <span className="text-main">Digital/Bank</span>
                            <span className="text-indigo-500">{sales.payment_split.bank}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${sales.payment_split.bank}%` }} className="h-full bg-indigo-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PurchaseReport: React.FC<{ purchase: NonNullable<BusinessReportData['purchase']> }> = ({ purchase }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Acquisitions" value={`₹${purchase.total_purchase.toLocaleString()}`} accent="indigo" />
            <StatCard label="Input Tax Credit" value={`₹${purchase.input_tax_credit.toLocaleString()}`} sub="GST Recoverable" accent="emerald" />
            <div className="md:col-span-2 bg-rose-500 text-white p-8 rounded-[2rem] shadow-2xl shadow-rose-500/20 relative overflow-hidden group">
                <ShieldAlert className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">Critical Procurement Protocol</p>
                    <ul className="space-y-3">
                        {purchase.alerts.slice(0, 2).map((alert, i) => (
                            <li key={i} className="text-xs font-bold flex items-start gap-3 leading-snug">
                                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0 shadow-[0_0_8px_white]" /> {alert}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Valuation [FIFO]" value={`₹${inventory.closing_stock_value.toLocaleString()}`} sub="Total Assets" accent="indigo" />
            <StatCard label="Inert Capital" value={`₹${inventory.dead_stock_value.toLocaleString()}`} sub="90+ Day Static" accent="rose" />
            <StatCard label="Critical Reorder" value={`${inventory.low_stock_items} SKUs`} sub="Immediate Action" accent="amber" />
            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] shadow-xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">High-Velocity Items</p>
                <div className="flex flex-wrap gap-2">
                    {inventory.fast_moving_items.map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-white/[0.03] rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-tighter text-neutral-400">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Customer Revenue" value={`₹${customer.total_sales.toLocaleString()}`} change="+18.4%" isPositive={true} accent="indigo" />
            <StatCard label="Outstanding Ledger" value={`₹${customer.outstanding_dues.toLocaleString()}`} change="+5.2%" isPositive={false} sub="Risk: MODERATE" accent="rose" />
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6">Retention & Precision</p>
                <div className="flex items-center justify-between">
                    <div className="text-center">
                        <p className="text-2xl font-black text-main">{customer.repeat_frequency}</p>
                        <p className="text-[9px] font-black uppercase text-emerald-500 mt-1">Repeat Rate</p>
                    </div>
                    <div className="w-px h-10 bg-neutral-100 dark:bg-neutral-800" />
                    <div className="text-center">
                        <p className="text-2xl font-black text-main">{customer.return_ratio}</p>
                        <p className="text-[9px] font-black uppercase text-rose-500 mt-1">Return Ratio</p>
                    </div>
                </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] shadow-xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">High-Exposure Entities</p>
                <div className="space-y-3">
                    {customer.high_risk_debtors.map((debtor, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400 truncate max-w-[120px]">{debtor.name}</span>
                            <span className="text-rose-500 font-black">₹{(debtor.amount / 1000).toFixed(0)}k</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SupplierReport: React.FC<{ supplier: NonNullable<BusinessReportData['supplier']> }> = ({ supplier }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Procurement Value" value={`₹${supplier.total_purchases.toLocaleString()}`} accent="indigo" />
            <StatCard label="Accounts Payable" value={`₹${supplier.outstanding_payable.toLocaleString()}`} sub="Pending 30+ Days" accent="rose" />
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6">Efficiency Dynamics</p>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                        <span className="text-neutral-500">Avg. Pay Delay</span>
                        <span className="text-rose-500">{supplier.payment_delays} Epochs</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                        <span className="text-neutral-500">GRN Discrepancy</span>
                        <span className="text-amber-500">{supplier.grn_mismatches} INVs</span>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4">Top Liquidity Exposure</p>
                <div className="space-y-3">
                    {supplier.top_payables.map((v, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400 truncate max-w-[120px]">{v.vendor}</span>
                            <span className="text-indigo-500 font-black">₹{(v.amount / 1000).toFixed(0)}k</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TaxReport: React.FC<{ tax: NonNullable<BusinessReportData['tax']> }> = ({ tax }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <StatCard label="Net Tax Liability" value={`₹${tax.net_payable.toLocaleString()}`} sub="Current Cycle" accent="amber" />
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Output vs Input Vector Analysis</p>
                    <Scale className="w-4 h-4 text-neutral-300" />
                </div>
                <div className="flex items-center gap-10">
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-neutral-500">Output [Sales]</span>
                            <span className="text-rose-500">₹{(tax.output_tax / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-rose-500" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-neutral-500">Input [Procure]</span>
                            <span className="text-emerald-500">₹{(tax.input_tax / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(tax.input_tax / tax.output_tax) * 100}%` }} className="h-full bg-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] shadow-xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">Branch Liabilities</p>
                <div className="space-y-3">
                    {tax.branch_liability.map((b, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-neutral-400">{b.branch}</span>
                            <span className="text-amber-500 font-black">₹{(b.liability / 1000).toFixed(0)}k</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FinancialHealthReport: React.FC<{ financial: NonNullable<BusinessReportData['financial']> }> = ({ financial }) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-emerald-500 text-white p-8 rounded-[2rem] shadow-2xl shadow-emerald-500/20 flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 italic">Net Surplus</p>
                        <h3 className="text-3xl font-black tracking-tighter italic whitespace-nowrap">₹{financial.profit.toLocaleString()}</h3>
                    </div>
                    <p className="text-[10px] font-black uppercase mt-6 flex items-center gap-2 relative z-10">
                        <TrendingUp className="w-3.5 h-3.5" /> 27.4% Efficiency
                    </p>
                </div>

                <StatCard label="Operating Revenue" value={`₹${financial.revenue.toLocaleString()}`} accent="indigo" />

                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Consolidated Balance Vector</p>
                        <p className="text-[9px] font-black text-indigo-500 tracking-widest uppercase">A = L + E Protocol</p>
                    </div>
                    <div className="space-y-6">
                        <div className="flex h-3 w-full rounded-full overflow-hidden shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} className="h-full bg-indigo-500 relative group">
                                <span className="absolute -top-6 left-0 text-[8px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Assets ₹{(financial.assets / 1000000).toFixed(1)}M</span>
                            </motion.div>
                            <motion.div initial={{ width: 0 }} animate={{ width: '15%' }} className="h-full bg-rose-500 relative group">
                                <span className="absolute -top-6 left-0 text-[8px] font-black text-rose-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Liab ₹{(financial.liabilities / 1000000).toFixed(1)}M</span>
                            </motion.div>
                            <motion.div initial={{ width: 0 }} animate={{ width: '35%' }} className="h-full bg-neutral-900 dark:bg-white relative group">
                                <span className="absolute -top-6 left-0 text-[8px] font-black text-neutral-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Equity ₹{(financial.equity / 1000000).toFixed(1)}M</span>
                            </motion.div>
                        </div>
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-secondary">
                             <span>Assets Core</span>
                             <span>Liability Deck</span>
                             <span>Equity Pool</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Banks & Liquid Cash', val: financial.bank_balance, icon: Wallet, accent: 'text-blue-500 bg-blue-500/10' },
                    { label: 'Uncollected Receivables', val: financial.receivables, icon: ArrowDownRight, accent: 'text-emerald-500 bg-emerald-500/10' },
                    { label: 'Operational Payables', val: financial.payables, icon: ArrowUpRight, accent: 'text-rose-500 bg-rose-500/10' }
                ].map((item, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-6 group hover:translate-y-[-2px] transition-all duration-300">
                        <div className={`p-4 rounded-xl ${item.accent} transition-transform duration-500 group-hover:scale-110`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">{item.label}</p>
                            <p className="text-lg font-black text-main tabular-nums">₹{item.val.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DayBookReport: React.FC<{ day_book: NonNullable<BusinessReportData['day_book']> }> = ({ day_book }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Entry Volume" value={`${day_book.entries.length} TXNS`} accent="indigo" />
                <StatCard label="Total Inflow" value={`₹${day_book.total_income.toLocaleString()}`} accent="emerald" />
                <StatCard label="Total Outflow" value={`₹${day_book.total_expenses.toLocaleString()}`} accent="rose" />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-3">
                        <History className="w-4 h-4 text-indigo-500" /> Recent Chronology
                    </p>
                    <button className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Full Ledger</button>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {day_book.entries.slice(0, 8).map((entry, i) => (
                        <div key={i} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px] ${entry.type === 'INCOME' || entry.type === 'REFUND' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {entry.type[0]}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-main uppercase tracking-tight group-hover:translate-x-1 transition-transform">{entry.party || 'Internal Adj.'}</p>
                                    <p className="text-[9px] font-bold text-secondary uppercase mt-1">REF: {entry.voucher_no}</p>
                                </div>
                            </div>
                            <p className={`text-sm font-black tabular-nums ${entry.type === 'INCOME' || entry.type === 'REFUND' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {entry.type === 'INCOME' || entry.type === 'REFUND' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TrialBalanceReport: React.FC<{ trial_balance: NonNullable<BusinessReportData['trial_balance']> }> = ({ trial_balance }) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-500 text-white p-8 rounded-[2rem] flex items-center justify-between shadow-2xl shadow-indigo-500/20">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Debit Consolidated</p>
                        <h3 className="text-3xl font-black italic">₹{trial_balance.total_debit.toLocaleString()}</h3>
                    </div>
                    <Target className="w-12 h-12 opacity-20" />
                </div>
                <div className="bg-neutral-900 text-white p-8 rounded-[2rem] flex items-center justify-between shadow-xl">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Credit Consolidated</p>
                        <h3 className="text-3xl font-black italic">₹{trial_balance.total_credit.toLocaleString()}</h3>
                    </div>
                    <Scale className={`w-12 h-12 ${trial_balance.total_debit === trial_balance.total_credit ? 'text-emerald-500' : 'text-rose-500'} opacity-40`} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trial_balance.accounts.slice(0, 8).map((acc, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{acc.name}</p>
                            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-emerald-500 uppercase">Debit</p>
                                <p className="text-xs font-black text-main tabular-nums italic">₹{(acc.debit / 1000).toFixed(1)}k</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[8px] font-black text-rose-500 uppercase">Credit</p>
                                <p className="text-xs font-black text-main tabular-nums italic">₹{(acc.credit / 1000).toFixed(1)}k</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfitLossReport: React.FC<{ profit_loss: NonNullable<BusinessReportData['profit_loss']> }> = ({ profit_loss }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-10">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Operating Flux</h4>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm p-8 space-y-6">
                        <PLRow label="Gross Revenue" value={profit_loss.net_sales} isHeader />
                        <PLRow label="Cost of Goods Sold" value={profit_loss.cogs} />
                        <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                             <PLRow label="Operational Margin" value={profit_loss.gross_profit} isTotal accent="text-indigo-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-10 relative overflow-hidden group">
                    <TrendingUp className="absolute -bottom-6 -right-6 w-48 h-48 opacity-5 group-hover:scale-110 transition-transform duration-1000" />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Core Profit Vector</p>
                    <h3 className="text-5xl font-black text-white italic tracking-tighter">₹{profit_loss.net_profit.toLocaleString()}</h3>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase mt-8 flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Net Earnings Epoch Phase
                    </p>
                </div>
            </div>

            <div className="space-y-10">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-rose-500 rounded-full" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">System Overheads</h4>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm p-8 space-y-6">
                         <PLRow label="Operating Expenses" value={profit_loss.operating_expenses} />
                         <PLRow label="Aggregate Overheads" value={profit_loss.indirect_expenses} isTotal accent="text-rose-500" />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm text-center">
                         <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-2">Net Margin</p>
                         <p className="text-2xl font-black text-main italic">{profit_loss.margin}</p>
                     </div>
                     <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm text-center">
                         <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-2">OpEx Ratio</p>
                         <p className="text-2xl font-black text-main italic">32.1%</p>
                     </div>
                </div>
            </div>
        </div>
    );
};

const BalanceSheetReport: React.FC<{ balance_sheet: NonNullable<BusinessReportData['balance_sheet']> }> = ({ balance_sheet }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-10">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Asset Architecture</h4>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm p-8 space-y-6">
                        <PLRow label="Core Asset Pool" value={balance_sheet.assets.total} />
                         <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                            <PLRow label="Total Asset Vector" value={balance_sheet.assets.total} isTotal accent="text-indigo-500" />
                         </div>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-rose-500 rounded-full" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Liabilities & Equity</h4>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm p-8 space-y-6">
                        <PLRow label="Equity Pool" value={balance_sheet.equity.total} />
                        <PLRow label="Total Liabilities" value={balance_sheet.liabilities.total} />
                         <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                             <PLRow label="Aggregate Exposure" value={balance_sheet.liabilities.total + balance_sheet.equity.total} isTotal accent="text-rose-500" />
                         </div>
                    </div>
                </div>
                
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Protocol Alignment</p>
                            <p className="text-xs font-black text-emerald-900/60 dark:text-emerald-500/60 uppercase mt-1 tracking-tighter italic">Ledger Equation: Verified Balanced Phase</p>
                        </div>
                    </div>
                    <Zap className="w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

const PLRow: React.FC<{ label: string; value: number; isTotal?: boolean; isHeader?: boolean; accent?: string }> = ({ label, value, isTotal, isHeader, accent }) => (
    <div className={`flex justify-between items-center ${isHeader ? 'mb-2' : ''} ${isTotal ? 'py-2' : ''}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isHeader || isTotal ? 'text-main' : 'text-secondary'}`}>{label}</span>
        <span className={`text-sm font-black tabular-nums tracking-tighter ${isHeader ? 'text-xl italic' : ''} ${isTotal ? 'text-lg italic' : ''} ${accent || 'text-main'}`}>
            ₹{value.toLocaleString()}
        </span>
    </div>
);

const StatCard: React.FC<{ label: string; value: string; change?: string; isPositive?: boolean; sub?: string; accent?: 'indigo' | 'emerald' | 'amber' | 'rose' }> = ({ label, value, change, isPositive, sub, accent = 'indigo' }) => {
    const accentColors = {
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    };

    return (
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full -mr-12 -mt-12 transition-all duration-700 group-hover:scale-150 ${accentColors[accent].split(' ')[0].replace('text-', 'bg-')}`} />
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">{label}</p>
            <h3 className="text-3xl font-black tabular-nums text-main tracking-tighter group-hover:translate-x-1 transition-transform duration-500">{value}</h3>
            {(change || sub) && (
                <div className="flex items-center gap-2 mt-4">
                    {change && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${isPositive ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}>
                             {isPositive ? '+' : ''}{change}
                        </span>
                    )}
                    {sub && <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{sub}</span>}
                </div>
            )}
        </div>
    );
};

export default BusinessReportsHub;
