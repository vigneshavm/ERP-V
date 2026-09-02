import React, { useState, useMemo } from 'react';
import { } from 'react-redux';
import { Landmark, ArrowUpRight, ArrowDownRight, Briefcase,
    FileSpreadsheet, Plus, Filter, Search, ShieldCheck, Activity, IndianRupee,
    CreditCard, Zap, ChevronRight
} from 'lucide-react';
import { } from 'react-router-dom';
import { salesInvoices, purchases, bank_accounts, pdcs, MockSalesInvoice } from '../../data/index';
import Layout from '../../components/shared/Layout/index';

const FinanceMockUI: React.FC = () => {

    const [searchQuery, setSearchQuery] = useState('');

    const metrics = useMemo(() => {
        const totalSales = (salesInvoices as MockSalesInvoice[]).reduce((sum, inv) => sum + inv.total, 0);
        const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
        const netPosition = totalSales - totalPurchases;

        return [
            { label: 'System Liquidity', val: `₹${(netPosition/100000).toFixed(2)}L`, trend: '+4.2%', icon: Landmark, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Unreconciled Nodes', val: '12', trend: '-2', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Quantum Throughput', val: `₹${(totalSales/100000).toFixed(1)}L`, trend: '+12.5%', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
        ];
    }, []);


    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Treasury <span className="text-purple-500">Node</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Institutional Fiscal Core // Protocol V4
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <FileSpreadsheet className="w-4 h-4 text-purple-500" /> Fiscal Export
                        </button>
                        <button className="h-12 px-8 bg-purple-600 text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-purple-500/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> New Journal Entry
                        </button>
                    </div>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-purple-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black ${card.color} uppercase tracking-[0.2em]`}>{card.trend} V/PREV</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Bank Nodes */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {bank_accounts.map((bank, i) => (
                            <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 group hover:border-purple-500/50 transition-all shadow-sm">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-sm border border-neutral-200 dark:border-neutral-800">
                                        <Landmark className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{bank.no}</p>
                                        <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tight mt-1">{bank.name}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">Available Liquidity</p>
                                    <p className="text-3xl font-display font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">{bank.bal}</p>
                                    <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest mt-2 ${bank.up ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {bank.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {bank.diff} Temporal Delta
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Instrument Vault */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 flex flex-col shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white flex items-center gap-2 mb-6">
                            <CreditCard className="w-4 h-4 text-purple-500" /> Instrument Vault (PDCs)
                        </h3>
                        <div className="space-y-4 flex-1">
                            {pdcs.map((pdc, i) => (
                                <div key={i} className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-sm flex justify-between items-center group cursor-pointer hover:border-purple-500/30 transition-all">
                                    <div>
                                        <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tight">{pdc.entity}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${pdc.color}`}>{pdc.date}</p>
                                    </div>
                                    <p className="font-mono text-sm font-black text-neutral-900 dark:text-white">{pdc.amount}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full h-11 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-purple-500 border border-neutral-200 dark:border-neutral-700 rounded-sm text-[9px] font-black uppercase tracking-widest mt-6 transition-all">
                            View All Uncleared
                        </button>
                    </div>
                </div>

                {/* Ledger Registry */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-purple-500" /> Fiscal Ledger
                            </h3>
                            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden lg:block" />
                            <div className="relative w-64">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input 
                                    type="text" 
                                    placeholder="FILTER BY REF / ENTITY..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-2 pl-10 pr-4 text-[9px] font-black tracking-widest uppercase focus:border-purple-500 outline-none" 
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="h-10 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-purple-500 transition-all flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Global Filters
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Node Reference</th>
                                    <th className="px-8 py-5">Particulars</th>
                                    <th className="px-8 py-5 text-right">Debit (In)</th>
                                    <th className="px-8 py-5 text-right">Credit (Out)</th>
                                    <th className="px-8 py-5 text-center">Protocol state</th>
                                    <th className="px-8 py-5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                { (salesInvoices as MockSalesInvoice[]).slice(0, 10).map((inv, idx) => (
                                    <tr key={idx} className="hover:bg-purple-500/[0.02] transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-sm bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <span className="font-mono text-sm font-black text-neutral-900 dark:text-white uppercase">{inv.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-tight">Sales Transaction</span>
                                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">{inv.date}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-1 font-mono text-sm font-black text-emerald-500 tabular-nums tracking-tighter">
                                                <IndianRupee className="w-3.5 h-3.5" />
                                                {inv.total.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-1 font-mono text-sm font-black text-neutral-400 tabular-nums tracking-tighter">
                                                —
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button className="p-2 text-neutral-300 hover:text-purple-500 transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
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

export default FinanceMockUI;
