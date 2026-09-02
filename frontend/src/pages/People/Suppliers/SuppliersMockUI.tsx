import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, Plus, Search, Filter, AlertCircle, 
    CheckCircle2, Clock, 
    ArrowRight, Zap, ChevronRight
} from 'lucide-react';
import { suppliers } from '../../../data';
import Layout from '../../../components/shared/Layout';

const SuppliersMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    // Derive data from real suppliers
    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(sup => {
            const matchesSearch = 
                sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sup.gst_number.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesTab = 
                selectedTab === 'All' || 
                (selectedTab === 'Active' && sup.is_active) ||
                (selectedTab === 'Overdue' && sup.balance > sup.credit_limit);
            
            return matchesSearch && matchesTab;
        });
    }, [searchQuery, selectedTab]);

    const kpis = useMemo(() => {
        const totalPayable = suppliers.reduce((sum, s) => sum + s.balance, 0);
        const activeCount = suppliers.filter(s => s.is_active).length;
        const overdueCount = suppliers.filter(s => s.balance > s.credit_limit).length;

        return [
            { label: 'Total Payables', val: `₹${totalPayable.toLocaleString()}`, sub: 'Cycle Live', icon: Building2, bg: 'bg-primary/10', color: 'text-primary' },
            { label: 'Active Vendors', val: `${activeCount}`, sub: 'Institutional', icon: Zap, bg: 'bg-accent/10', color: 'text-accent' },
            { label: 'Overdue Dues', val: `${overdueCount}`, sub: 'Immediate', icon: AlertCircle, bg: 'bg-danger/10', color: 'text-danger' },
            { label: 'Reliability', val: '98.4%', sub: 'Score V4', icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success' }
        ];
    }, []);

    const filterCategories = useMemo(() => {
        return Array.from(new Set(suppliers.map(s => s.category)));
    }, []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative overflow-hidden z-10">
                {/* Advanced Filter Panel (Slide-over) */}
                <div className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 z-[60] transform transition-transform duration-500 ease-out shadow-2xl flex flex-col ${showFilters ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                        <h2 className="text-xl font-display font-black text-neutral-900 dark:text-white flex items-center gap-3">
                            <Filter className="w-5 h-5 text-warning" /> Advanced Filters
                        </h2>
                        <button onClick={() => setShowFilters(false)} className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-sm text-neutral-400 transition-all">
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar text-sm">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Vendor Category</label>
                            <div className="flex flex-wrap gap-2">
                                {filterCategories.map(cat => (
                                    <button key={cat} className="px-4 py-2 rounded-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 transition-all uppercase tracking-widest">
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Credit Limit Range</label>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                    <span>₹0</span>
                                    <span>₹1,00,00,000+</span>
                                </div>
                                <input type="range" className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Region / Origin</label>
                            <select className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm py-4 px-6 text-xs font-bold text-neutral-600 dark:text-neutral-400 focus:border-amber-500/50 outline-none appearance-none cursor-pointer transition-all uppercase tracking-widest">
                                <option>All Global Hubs</option>
                                <option>Domestic - North</option>
                                <option>Domestic - South</option>
                                <option>International - APAC</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-8 border-t border-neutral-200 dark:border-neutral-800 flex gap-4 bg-neutral-50 dark:bg-neutral-900/50">
                        <button className="flex-1 py-4 rounded-sm border border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">Clear All</button>
                        <button onClick={() => setShowFilters(false)} className="flex-1 py-4 rounded-sm bg-amber-500 text-white border border-amber-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">Apply Protocol</button>
                    </div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Supplier <span className="text-warning">Network</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">Vendor Intelligence & Payable Management // System Active</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => navigate('/suppliers/ledger')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-bold shadow-sm"
                        >
                            <Clock className="w-4 h-4 text-warning" /> Ageing Report
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white border border-amber-600 rounded-sm hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all text-xs font-black uppercase tracking-widest">
                            <Plus className="w-4 h-4" /> Add Vendor
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {kpis.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-4 group hover:border-amber-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color}`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-black text-neutral-400 group-hover:text-amber-500 uppercase tracking-widest transition-colors">{card.sub}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums mt-1">{card.val}</p>
                            </div>
                            <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mb-12 group-hover:scale-150 transition-transform duration-700"></div>
                        </div>
                    ))}
                </div>

                {/* Filters & Data Grid */}
                <div className="flex-1 bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-warning" />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH ENTITY / GSTIN / ORIGIN..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-6 text-xs font-bold tracking-widest focus:border-amber-500/50 outline-none transition-all text-neutral-900 dark:text-white shadow-inner" 
                                />
                            </div>
                            <button 
                                onClick={() => setShowFilters(true)}
                                className={`h-11 px-6 border rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${showFilters ? 'bg-amber-500 text-white border-amber-600' : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 shadow-sm'}`}
                            >
                                <Filter className="w-4 h-4" /> System Filters
                            </button>
                        </div>
                        <div className="flex gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-800 w-full lg:w-auto">
                            {['All', 'Active', 'Overdue'].map((tab) => (
                                <button 
                                    key={tab} 
                                    onClick={() => setSelectedTab(tab)}
                                    className={`flex-1 lg:flex-none px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === tab ? 'bg-white dark:bg-neutral-900 text-warning shadow-sm' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Supplier Entity</th>
                                    <th className="px-8 py-5 text-center">Tax Identity</th>
                                    <th className="px-8 py-5 text-center">Sector</th>
                                    <th className="px-8 py-5 text-right">Settlement Limit</th>
                                    <th className="px-8 py-5 text-right">Outstanding</th>
                                    <th className="px-8 py-5 text-center w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white/[0.01]">
                                {filteredSuppliers.map((sup, idx) => (
                                    <tr 
                                        key={idx} 
                                        onClick={() => navigate(`/suppliers/ledger?id=${sup.id}`)}
                                        className="hover:bg-amber-500/[0.02] transition-all group cursor-pointer"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-lg group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                                                    {sup.name[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">{sup.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${sup.is_active ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                                                        <span className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">{sup.is_active ? 'Verified Partner' : 'Inactive'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="font-mono text-[11px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-sm border border-neutral-200 dark:border-neutral-700 uppercase tracking-tighter">{sup.gst_number}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                                                {sup.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-mono font-black text-neutral-900 dark:text-white text-sm tabular-nums tracking-tighter">
                                            ₹{sup.credit_limit.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className={`font-mono text-sm font-black tracking-tighter tabular-nums ${sup.balance > sup.credit_limit ? 'text-rose-500' : sup.balance === 0 ? 'text-emerald-500' : 'text-neutral-900 dark:text-white'}`}>
                                                {sup.balance === 0 ? 'CLEARED' : `₹${sup.balance.toLocaleString()}`}
                                            </div>
                                            {sup.balance > sup.credit_limit && <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">Limit Exceeded</div>}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <button className="p-3 text-neutral-400 hover:text-white bg-neutral-50 dark:bg-neutral-800 hover:bg-amber-500 rounded-sm transition-all shadow-sm border border-neutral-200 dark:border-neutral-700">
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SuppliersMockUI;

