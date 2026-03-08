import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart3, 
    ShoppingCart, 
    Users, 
    Receipt, 
    History, 
    Scale, 
    PieChart, 
    FileText, 
    TrendingUp, 
    Zap, 
    Target, 
    ArrowRight,
    Search,
    Filter,
    Activity,
    ShieldCheck,
    Layers,
    LayoutGrid,
    ChevronRight,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from "../../components/shared/Layout/Layout";

interface ReportNode {
    name: string;
    path: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
    isPremium?: boolean;
}

interface ReportCategory {
    title: string;
    id: string;
    description: string;
    icon: React.ElementType;
    accent: string;
    reports: ReportNode[];
}

const CATEGORIES: ReportCategory[] = [
    {
        title: 'Transaction Intelligence',
        id: 'transactions',
        description: 'Core financial throughput and ledger dynamics',
        icon: Activity,
        accent: 'indigo',
        reports: [
            { name: 'Business Snapshot', path: '/', description: 'Real-time organizational health summary', icon: Target, badge: 'LIVE' },
            { name: 'Sales Intelligence', path: '/reports/sales', description: 'Deep-dive into revenue streams', icon: BarChart3, isPremium: true },
            { name: 'Procurement Ledger', path: '/reports/purchase', description: 'Supply chain financial tracking', icon: ShoppingCart },
            { name: 'Day Book Journal', path: '/reports/daybook', description: 'Daily sequential transaction audit', icon: History },
            { name: 'Profit & Loss', path: '/reports/profit-loss', description: 'Fiscal performance and margins', icon: TrendingUp },
            { name: 'Cash Flow Dynamics', path: '/reports/cashflow', description: 'Liquidity and solvency analysis', icon: Zap },
        ]
    },
    {
        title: 'Stakeholder Analytics',
        id: 'parties',
        description: 'B2B and B2C relationship intelligence',
        icon: Users,
        accent: 'emerald',
        reports: [
            { name: 'Customer LTV', path: '/reports/party-statement', description: 'Lifetime value and ledger statements', icon: Users },
            { name: 'Supplier Scorecard', path: '/reports/purchase-party', description: 'Fulfillment and credit intelligence', icon: ShieldCheck },
            { name: 'Party-Wise P&L', path: '/reports/party-pl', description: 'Profitability by account entity', icon: PieChart },
            { name: 'Group Performance', path: '/reports/sales-party-group', description: 'Aggregated sector analytics', icon: Layers },
        ]
    },
    {
        title: 'Statutory & Compliance',
        id: 'gst',
        description: 'Regulatory reporting and tax integrity',
        icon: Scale,
        accent: 'rose',
        reports: [
            { name: 'GSTR-1 (Outward)', path: '/reports/gstr1', description: 'B2B/B2C sales tax return data', icon: FileText, badge: 'TAX' },
            { name: 'GSTR-3B (Summary)', path: '/reports/gstr3b', description: 'Monthly tax liability reconciliation', icon: Receipt },
            { name: 'Trial Balance', path: '/reports/trial-balance', description: 'Double-entry integrity verification', icon: Scale },
            { name: 'Balance Sheet', path: '/reports/balance-sheet', description: 'Net worth and structural solvency', icon: LayoutGrid },
        ]
    }
];

const ReportsDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredCategories = CATEGORIES.map(cat => ({
        ...cat,
        reports: cat.reports.filter(r => 
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            cat.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.reports.length > 0);

    return (
        <Layout>
            <div className="relative space-y-12 pb-20">
                {/* === HIGH-FIDELITY HEADER === */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                                <BarChart3 className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-main tracking-tighter uppercase italic leading-none">Command Hub</h1>
                                <p className="text-[10px] font-black text-secondary tracking-[0.4em] uppercase mt-1 flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Unified Intelligence Matrix
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-96 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="SEARCH DATA POINT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-14 bg-white/[0.03] border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-14 pr-6 text-xs font-black tracking-widest uppercase outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500/40 transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                            />
                        </div>
                        <button className="h-14 px-6 bg-white/[0.03] border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-3 hover:bg-white/[0.05] transition-all active:scale-95 group">
                             <Filter className="w-4 h-4 text-secondary" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                        </button>
                    </div>
                </div>

                {/* === TACTICAL CATEGORY GRIDS === */}
                <div className="grid grid-cols-1 gap-16">
                    {filteredCategories.map((category, catIdx) => (
                        <motion.div 
                            key={category.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIdx * 0.1 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6 px-2">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-${category.accent}-500/10 text-${category.accent}-500 border border-${category.accent}-500/20`}>
                                        <category.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-main tracking-tight uppercase italic">{category.title}</h2>
                                        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{category.description}</p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2">
                                     <span className="text-[10px] font-black text-secondary tracking-widest uppercase">0{category.reports.length} Nodes Online</span>
                                     <div className="w-20 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                          <div className={`h-full bg-${category.accent}-500`} style={{ width: '40%' }} />
                                     </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {category.reports.map((report, idx) => (
                                    <motion.button
                                        key={report.name}
                                        whileHover={{ y: -6, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(report.path)}
                                        className="group relative h-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-8 text-left transition-all hover:bg-white/[0.05] hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
                                    >
                                        {/* Ambient Glow */}
                                        <div className={`absolute -right-8 -bottom-8 w-24 h-24 bg-${category.accent}-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                        
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div className={`p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400 group-hover:bg-${category.accent}-500 group-hover:text-white transition-all duration-500 shadow-xl`}>
                                                    <report.icon className="w-6 h-6" />
                                                </div>
                                                {report.badge && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${
                                                        report.badge === 'LIVE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                                    }`}>
                                                        {report.badge}
                                                    </span>
                                                )}
                                                {report.isPremium && (
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-sm font-black text-main uppercase italic group-hover:text-indigo-400 transition-colors tracking-tight">
                                                    {report.name}
                                                </h3>
                                                <p className="text-[10px] font-medium text-secondary line-clamp-1 opacity-60">
                                                    {report.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Entry Arrow */}
                                        <div className="absolute top-8 right-8 text-neutral-200 dark:text-neutral-800 group-hover:text-indigo-500 transition-all transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 duration-500">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* === AI GENERATIVE FOOTER === */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="relative p-12 lg:p-16 rounded-[3rem] bg-indigo-600 overflow-hidden shadow-[0_32px_64px_-12px_rgba(79,70,229,0.3)]"
                >
                    {/* Background Visuals */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700" />
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(indigo, transparent)'
                    }} />
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }} />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="max-w-xl space-y-6">
                            <h3 className="text-4xl lg:text-5xl font-black text-white leading-none tracking-tighter uppercase italic">
                                Need Specialized <br />
                                <span className="underline decoration-indigo-300/30 decoration-8 underline-offset-[10px]">Synthesis?</span>
                            </h3>
                            <p className="text-lg text-indigo-100 font-bold leading-relaxed max-w-md uppercase tracking-tight italic">
                                Our neural engine can architect custom data pipelines and high-fidelity reports tailored to your enterprise DNA.
                            </p>
                        </div>
                        <button className="h-16 px-10 bg-white text-indigo-600 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.2em] italic shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group">
                             Custom Synthesis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
};

export default ReportsDashboard;
