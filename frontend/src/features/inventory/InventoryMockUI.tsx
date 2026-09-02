import React, { useMemo } from 'react';
import { } from 'react-router-dom';
import { 
    Search, Plus, Box, AlertTriangle, MoreVertical, Layers, Zap, 
    ShieldCheck, RefreshCw, IndianRupee, BarChart3
} from 'lucide-react';
import { inventory, MockProduct } from '../../data/index';
import Layout from '../../components/shared/Layout/index';

const InventoryMockUI: React.FC = () => {

    const metrics = useMemo(() => {
        const _totalItems = inventory.length;
        const totalStock = (inventory as MockProduct[]).reduce((sum, item) => sum + item.stock, 0);
        const lowStockCount = (inventory as MockProduct[]).filter(item => item.stock < 15).length;
        const totalValue = (inventory as MockProduct[]).reduce((sum, item) => sum + (item.selling_price * item.stock), 0);

        return [
            { label: 'Total Stock Units', value: totalStock.toLocaleString(), trend: '+4.2%', icon: Box, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Inventory Valuation', value: `₹${(totalValue/100000).toFixed(2)}L`, trend: '+1.5%', icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Low Stock Nodes', value: lowStockCount, trend: '-2', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ];
    }, []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Inventory <span className="text-primary">Matrix</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Asset Monitoring Node // System V4.0
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <BarChart3 className="w-4 h-4 text-primary" /> Stock Audit
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Initialize Item
                        </button>
                    </div>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black ${card.color} uppercase tracking-[0.2em] transition-colors`}>{card.trend} V/PREV</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.value}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Filter & Registry */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" /> Active Stock Registry
                            </h3>
                            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden lg:block" />
                            <div className="flex gap-4">
                                {['ALL ITEMS', 'LOW STOCK', 'CATEGORY WISE'].map((tab, idx) => (
                                    <button key={tab} className={`text-[9px] font-black uppercase tracking-widest transition-all ${idx === 0 ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}>{tab}</button>
                                ))}
                            </div>
                        </div>
                        <div className="relative w-full lg:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input 
                                type="text" 
                                placeholder="FILTER BY SKU / NAME..." 
                                className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-2 pl-10 pr-4 text-[9px] font-black tracking-widest uppercase focus:border-primary outline-none" 
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Asset Descriptor</th>
                                    <th className="px-8 py-5">Classification</th>
                                    <th className="px-8 py-5">Stock Level</th>
                                    <th className="px-8 py-5 text-right">Unit Valuation</th>
                                    <th className="px-8 py-5 text-right">Asset Worth</th>
                                    <th className="px-8 py-5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {inventory.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-primary/[0.02] transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden relative group/img">
                                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Zap className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`} alt="" className="w-full h-full object-cover p-2" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                                                    <p className="text-[10px] font-mono text-neutral-400 mt-1 uppercase">SKU: {item.id.split('-').pop()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${item.stock < 15 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} style={{ width: `${Math.min(item.stock, 100)}%` }} />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tabular-nums ${item.stock < 15 ? 'text-amber-500' : 'text-emerald-500'}`}>{item.stock}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-1 font-mono text-xs font-black text-neutral-400">
                                                <IndianRupee className="w-3 h-3" />
                                                {(item as MockProduct).selling_price.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-1 font-mono text-xs font-black text-neutral-900 dark:text-white tabular-nums">
                                                <IndianRupee className="w-3 h-3" />
                                                {((item as MockProduct).selling_price * (item as MockProduct).stock).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button className="p-2 text-neutral-300 hover:text-primary transition-all">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Protocol Footer */}
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-sm flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-primary/10 rounded-sm text-primary">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Asset Validation Layer Active</h4>
                            <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest italic">All stock adjustments are cryptographically signed and logged to the central ledger.</p>
                        </div>
                    </div>
                    <button className="p-3 text-neutral-400 hover:text-primary transition-all flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Resync Nodes</span>
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default InventoryMockUI;
