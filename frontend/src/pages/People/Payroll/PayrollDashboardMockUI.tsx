import React, { useMemo } from 'react';
import { 
    Users, Clock, DollarSign, Plus, 
    ArrowRight, AlertCircle, FileCheck, ShieldCheck,
    CreditCard, Activity, IndianRupee, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

const PayrollDashboardMockUI: React.FC = () => {
    const navigate = useNavigate();

    const metrics = useMemo(() => {
        const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
        const presentCount = employees.filter(e => e.status === 'Present').length;
        
        return [
            { label: 'Monthly Gross', value: `₹${(totalSalary/100000).toFixed(2)}L`, icon: IndianRupee, status: 'primary', trend: '+12.5%' },
            { label: 'Active Personnel', value: employees.length, icon: Users, status: 'success', trend: 'Stable' },
            { label: 'On-Clock Today', value: presentCount, icon: Clock, status: 'warning', trend: `${((presentCount/employees.length)*100).toFixed(1)}%` },
            { label: 'Audit Compliance', value: '100%', icon: ShieldCheck, status: 'info', trend: 'Verified' }
        ];
    }, []);

    const upcomingRuns = useMemo(() => [
        { period: 'May 2026 // Full Cycle', amount: `₹${(employees.reduce((s, e) => s + e.salary, 0) / 100000).toFixed(2)}L`, date: '2026-05-31', status: 'Ready' },
        { period: 'May 2026 // Mid-Month', amount: '₹1.24L', date: '2026-05-15', status: 'Completed' },
        { period: 'April 2026 // Full Cycle', amount: '₹4.82L', date: '2026-04-30', status: 'Disbursed' }
    ], []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Payroll <span className="text-primary">Intelligence</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Central Financial Governance // Disbursal Pipeline
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Activity className="w-4 h-4 text-primary" /> System Audit
                        </button>
                        <button 
                            onClick={() => navigate('/people/payroll/runs')}
                            className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90"
                        >
                            <Plus className="w-4 h-4" /> Initialize Run
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-sm p-6 border border-neutral-200 dark:border-neutral-800 relative overflow-hidden group hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">{stat.label}</p>
                                <div className={`p-2.5 rounded-sm border ${
                                    stat.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                    stat.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                    'bg-primary/10 text-primary border-primary/20'
                                }`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-display font-black text-neutral-900 dark:text-white tabular-nums">{stat.value}</h3>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Current Phase</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${stat.status === 'success' ? 'text-emerald-500' : 'text-primary'}`}>{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                    {/* Runs Table */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Upcoming Disbursal Nodes</h2>
                            <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-1 transition-transform">
                                VIEW CALENDAR <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800">
                                    <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
                                        <th className="px-8 py-4">Disbursal Period</th>
                                        <th className="px-8 py-4">Estimated Aggregate</th>
                                        <th className="px-8 py-4">Release Date</th>
                                        <th className="px-8 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {upcomingRuns.map((row, i) => (
                                        <tr key={i} className="hover:bg-primary/[0.02] transition-colors cursor-pointer group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <CreditCard className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{row.period}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-mono text-xs font-black text-neutral-500">{row.amount}</td>
                                            <td className="px-8 py-5 text-xs font-black text-neutral-400 uppercase">{row.date}</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-4 py-1 rounded-sm border text-[9px] font-black uppercase tracking-widest ${
                                                    row.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    row.status === 'Disbursed' ? 'bg-primary/10 text-primary border-primary/20' :
                                                    'bg-neutral-100 text-neutral-400 border-neutral-200'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Insights Sidebar */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 space-y-8 shadow-sm">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500">Operational Intelligence</h2>
                        <div className="space-y-6">
                            {[
                                { title: 'Compliance Warning', desc: 'PF submission for Cycle-14 is due in 48 hours. Immediate action required.', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
                                { title: 'Tax Validation', desc: 'TDS calculations for new employee on-boarding have been synchronized.', icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                                { title: 'Growth Insight', desc: 'Workforce expense has increased by 14% compared to previous quarter.', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' }
                            ].map((insight, i) => (
                                <div key={i} className={`p-5 rounded-sm border ${insight.bg} ${insight.border} space-y-3`}>
                                    <div className={`flex items-center gap-3 font-black text-[10px] uppercase tracking-widest ${insight.color}`}>
                                        <insight.icon className="w-4 h-4" /> {insight.title}
                                    </div>
                                    <p className="text-[11px] text-neutral-500 leading-relaxed font-bold">
                                        {insight.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-neutral-100 dark:border-neutral-800">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">Quick Directives</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {['Tax Configuration', 'E-Slips Dispatch', 'Bonus Registry', 'Statutory Reports'].map(link => (
                                    <button key={link} className="p-4 rounded-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-left hover:border-primary transition-all shadow-sm">
                                        {link}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PayrollDashboardMockUI;

