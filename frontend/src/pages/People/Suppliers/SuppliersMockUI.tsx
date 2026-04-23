import React from 'react';
import { Building2, Plus, Search, Filter, Star, AlertCircle, CheckCircle2, Clock, TrendingDown, Phone, MoreHorizontal, ArrowRight } from 'lucide-react';

const SuppliersMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-teal-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] left-[-5%] w-[50%] h-[50%] bg-teal-700/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[0%] right-[10%] w-[35%] h-[40%] bg-cyan-800/10 rounded-full blur-[140px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                            Supplier Network
                            <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Vendor Registry
                            </span>
                        </h1>
                        <p className="text-sm text-secondary mt-1 font-medium">Manage supplier relationships, credit terms, and payable ageing.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-card hover:bg-card text-main font-bold text-sm tracking-wide rounded-xl transition-all border border-default flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" /> Ageing Report
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-main font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Supplier
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Suppliers', val: '148', sub: '12 added this month', icon: Building2, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
                        { label: 'Outstanding Payables', val: '₹28.4L', sub: '32 bills pending', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                        { label: 'Overdue Payables', val: '₹6.8L', sub: '9 suppliers affected', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
                        { label: 'Settled (MTD)', val: '₹45.2L', sub: '87 transactions', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                    ].map((card, i) => (
                        <div key={i} className={`glass-panel backdrop-blur-md rounded-2xl p-6 border ${card.border} group hover:bg-card/80 transition-all cursor-pointer`}>
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-black tracking-tighter mt-1 text-main">{card.val}</p>
                            <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="flex-1 glass-panel backdrop-blur-xl border border-default rounded-3xl flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-default flex justify-between items-center bg-card">
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                                <input type="text" placeholder="Search supplier, GSTIN, city..." className="w-80 bg-input border border-default rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-teal-500 transition-colors text-main placeholder:text-slate-600" />
                            </div>
                            <button className="h-10 px-4 bg-card hover:bg-card border border-default rounded-xl text-xs font-bold text-main flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Active', 'Overdue', 'Blacklisted'].map((tab, idx) => (
                                <button key={tab} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${idx === 0 ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-secondary hover:text-main'}`}>{tab}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    {['Supplier', 'GSTIN', 'Category', 'Credit Limit', 'Outstanding', 'Rating', 'Actions'].map(h => (
                                        <th key={h} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default ${h === 'Outstanding' || h === 'Credit Limit' ? 'text-right' : h === 'Rating' || h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {[
                                    { name: 'Global Raw Materials Inc.', gstin: '27AABCG1234A1Z5', cat: 'Raw Materials', limit: '50,00,000', outstanding: '12,45,000', rating: 5, status: 'Active' },
                                    { name: 'TechComponents Asia Pvt Ltd', gstin: '29AATCT5678B2Z1', cat: 'Electronics', limit: '25,00,000', outstanding: '8,20,000', rating: 4, status: 'Active' },
                                    { name: 'Omega Industrial Supply', gstin: '06AABCO9012C3Z8', cat: 'Industrial', limit: '15,00,000', outstanding: '6,80,000', rating: 3, status: 'Overdue' },
                                    { name: 'Starlight Medical Devices', gstin: '33AABCS3456D4Z2', cat: 'Medical', limit: '10,00,000', outstanding: '0', rating: 5, status: 'Active' },
                                    { name: 'Apex Packaging Works', gstin: '24AABCA7890E5Z9', cat: 'Packaging', limit: '8,00,000', outstanding: '1,15,000', rating: 4, status: 'Active' },
                                ].map((sup, idx) => (
                                    <tr key={idx} className="hover:bg-card/30 transition-colors group cursor-pointer">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black text-sm">{sup.name[0]}</div>
                                                <div>
                                                    <div className="text-sm font-bold text-main">{sup.name}</div>
                                                    <div className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-slate-600" /><span className="text-[10px] text-secondary">+91 98765 43210</span></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5"><span className="font-mono text-xs text-muted">{sup.gstin}</span></td>
                                        <td className="px-8 py-5"><span className="px-2.5 py-1 bg-card border border-default rounded-lg text-[10px] font-black uppercase tracking-widest text-muted">{sup.cat}</span></td>
                                        <td className="px-8 py-5 text-right"><span className="font-mono text-sm font-bold text-main">₹{sup.limit}</span></td>
                                        <td className="px-8 py-5 text-right"><span className={`font-mono text-sm font-bold ${sup.status === 'Overdue' ? 'text-rose-400' : sup.outstanding === '0' ? 'text-emerald-400' : 'text-main'}`}>{sup.outstanding === '0' ? 'Nil' : `₹${sup.outstanding}`}</span></td>
                                        <td className="px-8 py-5"><div className="flex justify-center gap-0.5">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className={`w-3.5 h-3.5 ${s < sup.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />)}</div></td>
                                        <td className="px-8 py-5"><div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-muted hover:text-teal-400 bg-card hover:bg-card rounded-lg transition-colors"><ArrowRight className="w-4 h-4" /></button>
                                            <button className="p-2 text-muted hover:text-main bg-card hover:bg-card rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuppliersMockUI;
