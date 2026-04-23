import React from 'react';
import { Banknote, Landmark, ArrowUpRight, ArrowDownRight, Briefcase, FileSpreadsheet, Plus, Filter, Search, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

const FinanceMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                            Treasury & Ledger
                            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Encrypted Vault
                            </span>
                        </h1>
                        <p className="text-sm text-secondary mt-1 font-medium">Reconcile institutional cashflows, banking nodes, and uncleared instruments.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-card hover:bg-card text-main font-bold text-sm tracking-wide rounded-xl transition-all border border-default flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> Export Ledger
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-main font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Journal Entry
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Bank Accounts Grid */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                        {[
                            { name: 'HDFC Corporate Current', no: '**** 4482', bal: '₹42,50,000', up: true, diff: '+₹2.4L' },
                            { name: 'SBI Settlement Node', no: '**** 9011', bal: '₹18,25,000', up: false, diff: '-₹1.1L' },
                            { name: 'ICICI Forex Reserve', no: '**** 3329', bal: '$124,500', up: true, diff: '+$4.2k' },
                            { name: 'Petty Cash Vault', no: 'Main Branch', bal: '₹45,200', up: true, diff: '+₹5k' },
                        ].map((bank, idx) => (
                            <div key={idx} className="glass-panel backdrop-blur-md border border-default rounded-3xl p-6 group hover:border-purple-500/30 transition-all cursor-pointer relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl -mr-10 -mb-10 group-hover:scale-150 transition-transform duration-700" />
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="p-3 bg-card rounded-xl text-purple-400">
                                            <Landmark className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-main">{bank.name}</p>
                                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest font-mono">{bank.no}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-3xl font-black text-main tabular-nums tracking-tighter mb-1">{bank.bal}</p>
                                    <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${bank.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {bank.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {bank.diff} today
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PDC & Alerts */}
                    <div className="glass-panel backdrop-blur-md border border-amber-900/30 rounded-3xl p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2 relative z-10">
                            <Activity className="w-4 h-4 text-amber-500" /> Instrument Vault (PDCs)
                        </h3>
                        <div className="flex-1 space-y-4 relative z-10">
                            {[
                                { entity: 'Nexus Cybernetics', amount: '₹4.5L', date: 'Due Tomorrow', color: 'amber' },
                                { entity: 'Omega Industrial', amount: '₹1.2L', date: 'Overdue 2 Days', color: 'rose' },
                                { entity: 'Starlight Medical', amount: '₹8.9L', date: 'Due in 3 Days', color: 'slate' }
                            ].map((pdc, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-input border border-default rounded-2xl">
                                    <div>
                                        <p className="text-xs font-bold text-main">{pdc.entity}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 text-${pdc.color}-400`}>{pdc.date}</p>
                                    </div>
                                    <p className="font-mono text-sm font-black text-main">{pdc.amount}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-3 rounded-xl border border-default text-[10px] font-black uppercase tracking-widest text-muted hover:text-main hover:bg-card transition-all">
                            View All Uncleared
                        </button>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="flex-1 glass-panel backdrop-blur-xl border border-default rounded-3xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-default flex justify-between items-center bg-card">
                        <h3 className="text-sm font-black uppercase tracking-widest text-main flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-purple-500" /> Recent Transactions
                        </h3>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                                <input 
                                    type="text" 
                                    placeholder="Search references..." 
                                    className="w-64 bg-input border border-default rounded-xl py-2 pl-12 pr-4 text-sm focus:outline-none focus:border-purple-500 transition-colors text-main"
                                />
                            </div>
                            <button className="px-4 py-2 bg-card hover:bg-card border border-default rounded-xl text-xs font-bold text-main flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filters
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default">Date</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default">Reference</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default">Particulars</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default text-right">Debit</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default text-right">Credit</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default text-center">Reconciled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {[
                                    { date: 'Oct 15, 2026', ref: 'JRN-8891', part: 'Payment to Global Raw Materials', dr: '12,50,000', cr: '-', rec: true },
                                    { date: 'Oct 14, 2026', ref: 'REC-2201', part: 'Receipt from Nexus Cybernetics', dr: '-', cr: '4,50,000', rec: false },
                                    { date: 'Oct 14, 2026', ref: 'BNK-CHG', part: 'HDFC Corporate Card Fees', dr: '2,500', cr: '-', rec: true },
                                    { date: 'Oct 13, 2026', ref: 'JRN-8890', part: 'Salary Disbursal (Oct)', dr: '18,40,000', cr: '-', rec: true },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-card/30 transition-colors cursor-default">
                                        <td className="px-8 py-5 text-sm font-bold text-main whitespace-nowrap">{row.date}</td>
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-xs font-black text-purple-400 hover:underline cursor-pointer">{row.ref}</span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-main">{row.part}</td>
                                        <td className="px-8 py-5 text-right font-mono text-sm font-black text-main">
                                            {row.dr !== '-' ? `₹${row.dr}` : '-'}
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono text-sm font-black text-emerald-400">
                                            {row.cr !== '-' ? `₹${row.cr}` : '-'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center">
                                                {row.rec ? (
                                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <button className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-colors flex items-center gap-1">
                                                        <RefreshCw className="w-3 h-3" /> Reconcile
                                                    </button>
                                                )}
                                            </div>
                                        </td>
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

export default FinanceMockUI;
