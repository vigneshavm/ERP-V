import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../redux/store";
import { getAgingReport } from "../../redux/slices/inventorySlice";
import Layout from "../../components/shared/Layout";
import {
    Clock,
    TrendingDown,
    Zap,
    Download,
    AlertCircle,
    Package,
    ArrowRight,
    Search,
    Filter,
    Calendar,
    ShieldAlert,
    TrendingUp,
    Info,
    DollarSign,
    Box,
    Layers,
    Tag,
} from 'lucide-react';

// --- Types ---

type AgeBucket = 'FRESH' | 'AGED_60' | 'AGED_90' | 'CRITICAL_120';
type RecommendationType = 'LIQUIDATE' | 'BREAK_EVEN' | 'BUNDLE' | 'REPRICE' | 'KEEP';

interface AgedProduct {
    id: string;
    sku: string;
    name: string;
    stock: number;
    cost: number;
    value: number;
    last_restocked: string;
    days_aged: number;
    age_bucket: AgeBucket;
    expiry_date?: string;
    days_to_expiry?: number;
    recommendation: {
        type: RecommendationType;
        discount_pct: number;
        logic: string;
    };
}

const AgedStockManager: React.FC = () => {
    const { agingReport, isLoading } = useSelector((state: RootState) => state.inventory);
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';
    const dispatch = useDispatch();

    const [searchTerm, setSearchTerm] = useState('');
    const [ageFilter, setAgeFilter] = useState<AgeBucket | 'ALL'>('ALL');

    useEffect(() => {
        dispatch(getAgingReport() as any);
    }, [dispatch]);

    // --- Intelligence Engine ---

    const agedStock: AgedProduct[] = useMemo(() => {
        return (Array.isArray(agingReport) ? agingReport : []).map(a => ({
            ...a,
            id: a._id || a.id,
            cost: a.costPrice || 0,
            last_restocked: a.lastSoldDate || 'N/A',
            days_aged: a.daysSinceLastSold || 0,
            age_bucket: (a.daysSinceLastSold >= 120 ? 'CRITICAL_120' : a.daysSinceLastSold >= 90 ? 'AGED_90' : a.daysSinceLastSold >= 60 ? 'AGED_60' : 'FRESH') as AgeBucket,
            recommendation: a.recommendation || { type: 'KEEP', discount_pct: 0, logic: 'No action required' }
        })) as AgedProduct[];
    }, [agingReport]);

    const filteredStock = useMemo(() => {
        return agedStock.filter(a => {
            const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAge = ageFilter === 'ALL' || a.age_bucket === ageFilter;
            return matchesSearch && matchesAge;
        }).sort((a, b) => b.days_aged - a.days_aged);
    }, [agedStock, searchTerm, ageFilter]);

    const metrics = useMemo(() => {
        const totalValue = agedStock.reduce((acc, a) => acc + a.value, 0);
        const trappedCapital = agedStock.filter(a => a.days_aged >= 90).reduce((acc, a) => acc + a.value, 0);
        const shelfRiskCount = agedStock.filter(a => a.days_aged >= 90).length;
        return {
            totalValue,
            trappedCapital,
            trappedPct: totalValue > 0 ? (trappedCapital / totalValue) * 100 : 0,
            shelfRiskCount,
            efficiencyScore: 88
        };
    }, [agedStock]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight uppercase">
                            <Clock className="w-6 h-6 text-primary" />
                            Aged Stock Intelligence
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5 font-medium">
                            Identifying dead capital and expiry risks for <span className="font-bold text-primary">{tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest">
                            <Zap className="w-4 h-4 fill-current" /> Auto-Optimize
                        </button>
                    </div>
                </div>

                {/* KPI Pulse */}
                < div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" >
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Trapped Capital</p>
                        <h3 className="text-3xl font-black text-error italic">₹{(metrics.trappedCapital / 100000).toFixed(2)}L</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingDown className="w-4 h-4 text-error" />
                            <span className="text-[10px] font-black text-error uppercase">{metrics.trappedPct.toFixed(1)}% of inventory value</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Shelf Risk Nodes</p>
                        <h3 className="text-3xl font-black text-warning italic">{metrics.shelfRiskCount}</h3>
                        <p className="text-[10px] text-neutral-500 mt-2 font-bold uppercase tracking-tight">Products sitting &gt; 90 days</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Inventory Efficiency</p>
                        <h3 className="text-3xl font-black text-success italic">{metrics.efficiencyScore}%</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="text-[10px] font-black text-success uppercase">+4.2% Optimization</span>
                        </div>
                    </div>

                    <div className="bg-neutral-950 text-white p-5 rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden group">
                        <Zap className="absolute -top-4 -right-4 w-20 h-20 text-primary opacity-10 group-hover:scale-110 transition duration-700" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 italic">Agent Protocol</p>
                        <p className="text-xs font-bold leading-relaxed pr-8">Liquidate <span className="text-primary italic">120+ day stock</span> to free up cash floor space.</p>
                        <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-primary group-hover:translate-x-1 transition" />
                    </div>
                </div >

                {/* Filters */}
                < div className="flex flex-col md:flex-row gap-4" >
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search Product, SKU or Class..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition shadow-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black uppercase tracking-widest outline-none shadow-sm transition"
                            value={ageFilter}
                            onChange={(e) => setAgeFilter(e.target.value as any)}
                        >
                            <option value="ALL">All Age Groups</option>
                            <option value="CRITICAL_120">Critical (120+ Days)</option>
                            <option value="AGED_90">Aged (90+ Days)</option>
                            <option value="AGED_60">Warning (60+ Days)</option>
                            <option value="FRESH">Fresh (&lt; 60 Days)</option>
                        </select>
                    </div>
                </div >

                {/* Main Content Area */}
                < div className="grid grid-cols-1 lg:grid-cols-3 gap-8" >
                    {/* Stock Table */}
                    < div className="lg:col-span-2 space-y-4" >
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-2 mb-4">Stock Age Topology</h4>

                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm shadow-black/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm tabular-nums">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                        <tr>
                                            <th className="p-6">Product Information</th>
                                            <th className="p-6 text-center">Age (Days)</th>
                                            <th className="p-6 text-center">Stock/Value</th>
                                            <th className="p-6 text-right">Strategic Move</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredStock.map(a => (
                                            <tr key={a.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group cursor-default ${a.days_aged >= 120 ? 'bg-error/[0.02]' : ''}`}>
                                                <td className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`mt-1 p-2 rounded-xl h-fit ${a.days_aged >= 120 ? 'bg-error/10 text-error' :
                                                            a.days_aged >= 90 ? 'bg-warning/10 text-warning' :
                                                                'bg-neutral-100 dark:bg-neutral-900 text-neutral-400'
                                                            }`}>
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-neutral-900 dark:text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{a.name}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-neutral-400 font-black">SKU: {a.sku}</span>
                                                                <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                                                <span className="text-[10px] text-neutral-400 font-black italic">Restocked: {a.last_restocked}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-black italic ${a.days_aged >= 120 ? 'bg-error text-white' :
                                                        a.days_aged >= 90 ? 'bg-warning text-neutral-900' :
                                                            'bg-neutral-100 dark:bg-neutral-900'
                                                        }`}>
                                                        {a.days_aged}d
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className="font-bold text-neutral-800 dark:text-neutral-200">{a.stock} Units</div>
                                                    <div className="text-[11px] font-black text-neutral-400 italic">₹{a.value.toLocaleString()}</div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${a.recommendation.type === 'LIQUIDATE' ? 'bg-error text-white' :
                                                            a.recommendation.type === 'BREAK_EVEN' ? 'bg-warning text-neutral-900 shadow-sm' :
                                                                'bg-primary/10 text-primary'
                                                            }`}>
                                                            {a.recommendation.type.replace('_', ' ')}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <Tag className="w-3 h-3 text-primary" />
                                                            <span className="text-xs font-black text-primary">-{a.recommendation.discount_pct}%</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button className="w-full py-5 bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] hover:text-primary border-t border-neutral-100 dark:border-neutral-800 transition hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                Expand Deep Analysis Topology
                            </button>
                        </div>
                    </div >

                    {/* Right Panel: Agent Recommendations */}
                    < div className="space-y-6" >
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-2 mb-4">Intelligence Feed</h4>

                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm relative overflow-hidden group">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-error/10 border border-error/20 rounded-full text-error text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                                <AlertCircle className="w-3.5 h-3.5" /> High Risk Detected
                            </div>

                            <div className="space-y-6">
                                {agedStock.filter(a => a.days_aged >= 120).slice(0, 2).map(a => (
                                    <div key={a.id} className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-transparent hover:border-error/20 transition cursor-default">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="text-xs font-black uppercase tracking-tight text-neutral-900 dark:text-white truncate max-w-[150px]">{a.name}</h5>
                                            <span className="text-[10px] font-black text-error italic">{a.days_aged} Days Aged</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-neutral-500 leading-relaxed mb-4 italic">"{a.recommendation.logic}"</p>
                                        <button className="w-full py-2 bg-error text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-error/20">
                                            Liquidate Now (-{a.recommendation.discount_pct}%)
                                        </button>
                                    </div>
                                ))}

                                {agedStock.filter(a => a.days_to_expiry !== undefined && a.days_to_expiry < 30).slice(0, 1).map(a => (
                                    <div key={a.id} className="p-4 bg-primary/5 rounded-2xl border border-transparent hover:border-primary/20 transition cursor-default">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="text-xs font-black uppercase tracking-tight text-primary-dark dark:text-primary-light truncate max-w-[150px]">{a.name}</h5>
                                            <span className="text-[10px] font-black text-primary italic">Expiry in {a.days_to_expiry}d</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-neutral-500 leading-relaxed mb-4 italic">"Expiry risk detected. Agent suggests bundling with high-velocity SKU-001."</p>
                                        <button className="w-full py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                                            Execute Bundle Strategy
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Inventory Flow Stats */}
                        <div className="bg-neutral-950 text-white p-8 rounded-[2.5rem] border border-neutral-800 shadow-2xl relative overflow-hidden group">
                            <Layers className="absolute -top-10 -right-10 w-40 h-40 text-primary opacity-5 group-hover:rotate-12 group-hover:scale-110 transition duration-1000" />
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                                    <ShieldAlert className="w-3.5 h-3.5 fill-current" /> Core Inventory Guard
                                </div>
                                <h4 className="text-xl font-black mb-4 leading-tight italic">Inventory <span className="text-primary underline">Velocity Hub.</span></h4>
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                                        <span className="text-neutral-500">Avg. Inventory Age</span>
                                        <span>42 Days</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full rounded-full" style={{ width: '42%' }} />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                                        <span className="text-neutral-500">Storage Optimization</span>
                                        <span>92%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                        <div className="bg-success h-full rounded-full" style={{ width: '92%' }} />
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-neutral-400 font-bold leading-relaxed italic">
                                        Wings-Grade Aged Analysis identifies stock that has lost 30% of its initial market relevance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
            </div >
        </Layout >
    );
};

export default AgedStockManager;
