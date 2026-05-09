import React, { useState, useMemo } from 'react';
import { 
    Building2, Plus, Search, Filter, Star, AlertCircle, 
    CheckCircle2, Clock, TrendingDown, Phone, MoreHorizontal, 
    ArrowRight, Globe, ShieldCheck, Zap, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import suppliersData from '../../../mockData/suppliersData.json';

const IconMap: Record<string, React.ElementType> = {
    Building2, Zap, AlertCircle, CheckCircle2
};

const MOCK_SUPPLIERS = suppliersData.MOCK_SUPPLIERS;

const SuppliersMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const filteredSuppliers = useMemo(() => {
        return MOCK_SUPPLIERS.filter(sup => {
            const matchesSearch = 
                sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sup.gstin.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesTab = 
                selectedTab === 'All' || 
                (selectedTab === 'Active' && sup.status === 'Active') ||
                (selectedTab === 'Overdue' && sup.status === 'Overdue');
            
            return matchesSearch && matchesTab;
        });
    }, [searchQuery, selectedTab]);

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in relative overflow-hidden">
            {/* Advanced Filter Panel (Slide-over) */}
            <div className={`absolute top-0 right-0 h-full w-80 bg-[#0a0a0c]/95 backdrop-blur-2xl border-l border-white/10 z-50 transform transition-transform duration-500 ease-out shadow-[-20px_0_40px_rgba(0,0,0,0.4)] flex flex-col ${showFilters ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-main/90 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-purple-400" /> Advanced Filter
                    </h2>
                    <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-white/5 rounded-lg text-main/40 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar text-sm">
                    {/* Categories */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-main/30">Vendor Category</label>
                        <div className="flex flex-wrap gap-2">
                            {suppliersData.filterCategories.map(cat => (
                                <button key={cat} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 text-[11px] text-main/60 transition-all active:scale-95">
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quality Rating */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-main/30">Quality Rating</label>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} className="p-1 hover:scale-110 transition-transform">
                                    <Star className={`w-5 h-5 ${star <= 4 ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Financial Threshold */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-main/30">Credit Limit Range</label>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono text-main/40">
                                <span>₹0</span>
                                <span>₹1,00,00,000+</span>
                            </div>
                            <input type="range" className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                    </div>

                    {/* Geo Location */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-main/30">Region / City</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-main/60 focus:border-purple-500/50 outline-none appearance-none cursor-pointer transition-all">
                            <option>All India</option>
                            <option>Maharashtra</option>
                            <option>Karnataka</option>
                            <option>Gujarat</option>
                        </select>
                    </div>

                    {/* Payment Terms */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="w-5 h-5 rounded border border-white/20 group-hover:border-purple-500/50 transition-colors flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-xs text-main/60">Hide Overdue Suppliers</span>
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-main/40 hover:bg-white/5 transition-all">Reset</button>
                    <button onClick={() => setShowFilters(false)} className="flex-1 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/30 transition-all">Apply</button>
                </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                        Supplier Network
                    </h1>
                    <p className="text-sm text-main/60 mt-1 font-medium">Manage vendor relationships, credit terms, and payable ageing.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/suppliers/ledger')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-bold"
                    >
                        <Clock className="w-4 h-4" /> Ageing Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-sm font-black uppercase tracking-widest">
                        <Plus className="w-4 h-4" /> Add Supplier
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {suppliersData.kpis.map((card, i) => {
                    const Icon = IconMap[card.iconName];
                    return (
                        <div key={i} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-3 group hover:bg-white/[0.04] transition-all cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                                    {Icon && <Icon className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-bold text-main/20 group-hover:text-main/40 uppercase tracking-widest">{card.sub}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-main/40 uppercase tracking-widest">{card.label}</p>
                                <p className="text-2xl font-black tracking-tight text-main">{card.val}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters & Data Grid */}
            <div className="flex-1 glass-panel rounded-3xl border border-white/5 flex flex-col overflow-hidden bg-white/[0.01]">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-main/30" />
                            <input 
                                type="text" 
                                placeholder="Search supplier, GSTIN, city..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-80 bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-purple-500/50 outline-none transition-all text-main" 
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(true)}
                            className={`h-10 px-4 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${showFilters ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-white/5 hover:bg-white/10 border-white/10 text-main/60'}`}
                        >
                            <Filter className="w-4 h-4" /> Advanced Filter
                        </button>
                    </div>
                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
                        {['All', 'Active', 'Overdue', 'Blacklisted'].map((tab) => (
                            <button 
                                key={tab} 
                                onClick={() => setSelectedTab(tab)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedTab === tab ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg' : 'text-main/40 hover:text-main/60 hover:bg-white/5'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-black/40 sticky top-0 z-20 backdrop-blur-md">
                            <tr className="text-main/40 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                <th className="px-8 py-4">Supplier Entity</th>
                                <th className="px-8 py-4 text-center">Identity</th>
                                <th className="px-8 py-4 text-center">Category</th>
                                <th className="px-8 py-4 text-right">Credit Limit</th>
                                <th className="px-8 py-4 text-right">Outstanding</th>
                                <th className="px-8 py-4 text-center">Quality Rating</th>
                                <th className="px-8 py-4 text-center w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSuppliers.map((sup, idx) => (
                                <tr 
                                    key={idx} 
                                    onClick={() => navigate(`/suppliers/ledger?id=${sup.id}`)}
                                    className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-sm group-hover:bg-purple-500/20 transition-all">
                                                {sup.name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-main/90 group-hover:text-purple-400 transition-colors">{sup.name}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Globe className="w-3 h-3 text-main/20" />
                                                    <span className="text-[10px] text-main/40 font-mono">Domestic Vendor</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="font-mono text-[11px] text-main/30 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase">{sup.gstin}</span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-main/50">
                                            {sup.cat}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className="font-mono text-sm font-bold text-main/70">₹{sup.limit}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`font-mono text-sm font-bold ${sup.status === 'Overdue' ? 'text-pink-400' : sup.outstanding === '0' ? 'text-emerald-400' : 'text-main/90'}`}>
                                            {sup.outstanding === '0' ? 'Nil' : `₹${sup.outstanding}`}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-center gap-0.5">
                                            {Array.from({ length: 5 }).map((_, s) => (
                                                <Star key={s} className={`w-3.5 h-3.5 ${s < sup.rating ? 'text-amber-400 fill-amber-400' : 'text-white/5'}`} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-center">
                                            <button className="p-2 text-main/20 hover:text-purple-400 bg-white/5 hover:bg-purple-500/10 rounded-lg transition-all border border-transparent hover:border-purple-500/20">
                                                <ChevronRight className="w-4 h-4" />
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
    );
};

export default SuppliersMockUI;
