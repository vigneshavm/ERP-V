import React, { useMemo } from 'react';
import { } from 'react-router-dom';
import { TrendingUp, Download, Filter, FileText, Package, ShoppingCart, 
    DollarSign, ArrowRight, Database, 
    ShieldCheck, Zap, Layers, RefreshCw, ChevronRight
} from 'lucide-react';
import { salesInvoices, purchases, inventory, transactions, MockSalesInvoice, MockProduct } from '../../data';
import Layout from '../../components/shared/Layout';

const ReportsMockUI: React.FC = () => {

    const metrics = useMemo(() => {
        const totalSales = (salesInvoices as MockSalesInvoice[]).reduce((sum, s) => sum + s.total, 0);
        const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
        const inventoryValue = (inventory as MockProduct[]).reduce((sum, i) => sum + (i.selling_price * i.stock), 0);
        const totalReceipts = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);

        return [
            { label: 'Revenue Matrix', val: `₹${(totalSales/100000).toFixed(2)}L`, sub: '+12.4% vs prev', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Asset Value', val: `₹${(inventoryValue/100000).toFixed(2)}L`, sub: 'Current Stock Value', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Expense Index', val: `₹${(totalPurchases/100000).toFixed(2)}L`, sub: 'Direct Procurement', icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Cash Liquidity', val: `₹${(totalReceipts/100000).toFixed(2)}L`, sub: 'Realized Revenue', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
        ];
    }, []);

    const categories = [
        {
            title: 'Sales & Revenue',
            desc: 'Transaction analytics & forecasting',
            icon: TrendingUp,
            color: 'primary',
            reports: ['Sales Register', 'Customer Wise Sales', 'Item Sales Summary', 'Tax Report (GST)']
        },
        {
            title: 'Inventory & Stock',
            desc: 'Asset tracking & valuation',
            icon: Package,
            color: 'emerald',
            reports: ['Stock Summary', 'Stock Ledger', 'Reorder Level Report', 'Warehouse Movement']
        },
        {
            title: 'Procurement',
            desc: 'Supplier & purchase analytics',
            icon: ShoppingCart,
            color: 'amber',
            reports: ['Purchase Register', 'Supplier Wise Purchase', 'Pending POs', 'Purchase Returns']
        }
    ];

    const financeReports = [
        { title: 'Financial Statements', icon: FileText, color: 'indigo', reports: ['Profit & Loss', 'Balance Sheet', 'Cash Flow Statement'] },
        { title: 'Tax & Compliance', icon: ShieldCheck, color: 'rose', reports: ['GSTR-1 Summary', 'GSTR-3B Details', 'TDS Report'] },
        { title: 'Audit Logs', icon: Database, color: 'slate', reports: ['User Activity', 'Transaction History', 'System Integrity'] }
    ];

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Business <span className="text-primary">Intelligence</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Decision Support Layer // Analytics Node V4
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Filter className="w-4 h-4 text-primary" /> Parameters
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Download className="w-4 h-4" /> Global Export
                        </button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black ${card.color} uppercase tracking-[0.2em] transition-colors`}>{card.sub}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Main Report Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categories.map((cat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 flex flex-col gap-6 group hover:border-primary/50 transition-all shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-4 rounded-sm bg-${cat.color}-500/10 text-${cat.color}-500 border border-${cat.color}-500/20`}>
                                    <cat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{cat.title}</h3>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest">{cat.desc}</p>
                                </div>
                            </div>
                            <div className="space-y-2 relative z-10">
                                {cat.reports.map((report, ri) => (
                                    <button key={ri} className="w-full flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-sm text-xs font-black text-neutral-600 dark:text-neutral-400 hover:text-primary hover:border-primary/30 transition-all group/item">
                                        <span className="uppercase tracking-widest">{report}</span>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover/item:opacity-100 transition-all translate-x-[-10px] group-hover/item:translate-x-0" />
                                    </button>
                                ))}
                            </div>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>

                {/* Secondary Report Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {financeReports.map((cat, i) => (
                        <div key={i} className="bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 flex flex-col gap-4 hover:bg-white dark:hover:bg-neutral-900 transition-all shadow-sm border-dashed">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-sm bg-${cat.color}-500/10 text-${cat.color}-500 border border-${cat.color}-500/20`}>
                                    <cat.icon className="w-4 h-4" />
                                </div>
                                <h3 className="text-[11px] font-black text-neutral-900 dark:text-white uppercase tracking-widest">{cat.title}</h3>
                            </div>
                            <div className="space-y-1.5">
                                {cat.reports.map((report, ri) => (
                                    <button key={ri} className="w-full text-left p-2.5 rounded-sm text-[10px] font-bold text-neutral-500 dark:text-neutral-400 hover:bg-primary/5 hover:text-primary transition-all uppercase tracking-widest border border-transparent hover:border-primary/20 flex justify-between items-center group">
                                        {report}
                                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* System Status Footer */}
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-sm flex items-center gap-6 mt-auto">
                    <div className="p-4 bg-primary/10 rounded-sm border border-primary/20">
                        <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Institutional Intelligence Layer Active</h4>
                        <p className="text-xs text-neutral-500 font-bold mt-1 italic uppercase tracking-widest leading-relaxed">Cross-module data synchronization complete. Financial forecasting model v2.4 initialized. System status: NOMINAL.</p>
                    </div>
                    <button className="ml-auto p-3 text-neutral-400 hover:text-primary transition-all">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default ReportsMockUI;
