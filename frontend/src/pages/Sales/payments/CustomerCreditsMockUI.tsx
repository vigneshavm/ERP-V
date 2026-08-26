import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2, CreditCard, TrendingUp, TrendingDown, Clock, ShieldCheck, Wallet } from 'lucide-react';
import { customers } from '../../../data';
import Layout from '../../../components/shared/Layout';

const CustomerCreditsMockUI: React.FC = () => {
    const navigate = useNavigate();

    // Derive data from real customers list
    const creditCustomers = useMemo(() => {
        return customers.filter(c => c.creditLimit > 0);
    }, []);

    const metrics = useMemo(() => {
        const totalCredit = creditCustomers.reduce((sum, c) => sum + c.creditBalance, 0);
        const activeWallets = creditCustomers.length;
        const totalLimit = creditCustomers.reduce((sum, c) => sum + c.creditLimit, 0);
        const avgUtilization = totalLimit > 0 ? (totalCredit / totalLimit) * 100 : 0;

        return [
            { label: "Total Available Credit", value: `₹${totalCredit.toLocaleString()}`, trend: "+5.2%", status: "success" },
            { label: "Credits Issued (MTD)", value: "₹82,400", trend: "+12%", status: "warning" },
            { label: "Active Credit Wallets", value: `${activeWallets} Nodes`, trend: `+${activeWallets}`, status: "success" },
            { label: "Utilization Rate", value: `${Math.round(avgUtilization)}%`, trend: "-2.1%", status: "info" }
        ];
    }, [creditCustomers]);

    return (
        <Layout>
            <div className="flex-1 w-full bg-app text-main font-sans selection:bg-amber-500/30 relative">
                {/* Ambient Background - Matching Sales Register */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                    <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
                </div>

                <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8">
                    {/* Cyber Header - Unified with Sales Theme */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                            <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                                Customer <span className="text-warning">Credits</span>
                                <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs font-bold uppercase tracking-widest">
                                    Wallet Ledger
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Real-time Credit Sync // Protocol V4</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-bold shadow-sm">
                                <Download className="w-4 h-4 text-warning" /> Statement Export
                            </button>
                            <button 
                                onClick={() => navigate('/sales/payments/new')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all text-xs font-black uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" /> Issue Credit
                            </button>
                        </div>
                    </div>

                    {/* Neural Metrics Grid - Sales Theme Styled */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {metrics.map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-neutral-900 rounded-sm p-6 border border-neutral-200 dark:border-neutral-800 relative overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                                    <div className={`p-2.5 rounded-xl ${
                                        stat.status === 'success' ? 'bg-success/10 text-success border border-success/20' : 
                                        stat.status === 'warning' ? 'bg-warning/10 text-warning border border-warning/20' : 
                                        stat.status === 'info' ? 'bg-info/10 text-info border border-info/20' :
                                        'bg-danger/10 text-danger border border-danger/20'
                                    }`}>
                                        {stat.status === 'success' ? <Wallet className="w-4 h-4" /> : 
                                         stat.status === 'warning' ? <ShieldCheck className="w-4 h-4" /> : 
                                         <CreditCard className="w-4 h-4" />}
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-2xl font-display font-black text-neutral-900 dark:text-white tabular-nums">{stat.value}</h3>
                                    <div className={`flex items-center gap-1 text-[10px] font-bold ${
                                        stat.trend.startsWith('+') ? 'text-success' : 'text-danger'
                                    }`}>
                                        {stat.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {stat.trend}
                                    </div>
                                </div>
                                <div className="mt-5 h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${
                                            stat.status === 'success' ? 'bg-emerald-500' : 
                                            stat.status === 'warning' ? 'bg-amber-500' : 
                                            'bg-rose-500'
                                        } shadow-[0_0_8px_currentColor]`}
                                        style={{ width: '70%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filtering Infrastructure */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                            <input 
                                type="text" 
                                placeholder="SEARCH BY WALLET ID / CUSTOMER REFERENCE..." 
                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-14 pr-6 py-4 text-xs font-bold tracking-widest placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-amber-500/50 outline-none transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                                <Filter className="w-4 h-4" /> Grid Options
                            </button>
                            <button 
                                onClick={() => navigate('/settings/audit')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-warning/10 text-warning border border-warning/20 rounded-sm hover:bg-warning/20 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <BarChart2 className="w-4 h-4" /> Audit Log
                            </button>
                        </div>
                    </div>

                    {/* Industrial Data Workspace */}
                    <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Wallet Node</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Origin Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Entity Path</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Credit Type</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 text-right">Balance</th>
                                        <th className="px-8 py-5 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {creditCustomers.map((c, i) => (
                                        <tr 
                                            key={i} 
                                            onClick={() => navigate(`/sales/credits/${c.id}`)}
                                            className="hover:bg-amber-500/[0.02] transition-all cursor-pointer group"
                                        >
                                            <td className="px-8 py-6">
                                                <span className="font-mono text-sm font-bold text-warning group-hover:underline cursor-pointer tracking-tighter">#CRD-{c.id.split('-').pop()?.toUpperCase()}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-bold text-neutral-900 dark:text-neutral-200">{c.lastPaymentDate || '2024-05-15'}</div>
                                                <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Verified Sync</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform inline-block">{c.name}</div>
                                                <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">{c.sector} Tier</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Institutional Credit</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                                                    c.riskScore === 'LOW' ? 'bg-success/10 text-success border-success/20' :
                                                    c.riskScore === 'MEDIUM' ? 'bg-warning/10 text-warning border-warning/20' :
                                                    'bg-danger/10 text-danger border-danger/20'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        c.riskScore === 'LOW' ? 'bg-emerald-500' :
                                                        c.riskScore === 'MEDIUM' ? 'bg-amber-500' :
                                                        'bg-rose-500 animate-pulse'
                                                    }`} />
                                                    {c.riskScore || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="text-lg font-mono font-black text-neutral-900 dark:text-white tracking-tighter">₹{c.creditBalance.toLocaleString()}</div>
                                                <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-0.5">Limit: ₹{c.creditLimit.toLocaleString()}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Control Panel / Pagination */}
                        <div className="p-8 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                                Syncing <span className="text-warning font-black">{creditCustomers.length.toString().padStart(2, '0')}</span> of <span className="text-neutral-900 dark:text-white">{creditCustomers.length}</span> Total Credit Nodes
                            </p>
                            <div className="flex gap-3">
                                <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-400 disabled:opacity-30 transition-all" disabled>Prev</button>
                                <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-warning hover:border-amber-500/50 transition-all shadow-sm">Next</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </Layout>
    );
};

export default CustomerCreditsMockUI;

