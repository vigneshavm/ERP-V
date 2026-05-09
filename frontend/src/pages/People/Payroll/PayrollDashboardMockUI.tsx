import React from 'react';
import { 
    Users, Clock, DollarSign, TrendingUp, Plus, 
    ArrowRight, AlertCircle, FileCheck, ShieldCheck,
    CreditCard, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import payrollDashboardData from '../../../mockData/payrollDashboardData.json';

const IconMap: Record<string, React.ElementType> = {
    DollarSign, ShieldCheck, AlertCircle, FileCheck, Clock
};

const PayrollDashboardMockUI: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Payroll Operations
                    </h1>
                    <p className="text-sm text-main/60 mt-1">Central Financial Governance & HR Intelligence</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm">
                        <Activity className="w-4 h-4" /> System Audit
                    </button>
                    <button 
                        onClick={() => navigate('/people/payroll/runs')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Initialize New Run
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {payrollDashboardData.metrics.map((kpi, idx) => {
                    const Icon = IconMap[kpi.icon];
                    return (
                        <div key={idx} className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className={`p-2.5 rounded-lg ${kpi.bg} ${kpi.color}`}>
                                    {Icon && <Icon className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-bold text-main/30 uppercase tracking-tighter">{kpi.trend}</span>
                            </div>
                            <div>
                                <p className="text-[10px] text-main/40 uppercase tracking-widest font-bold">{kpi.title}</p>
                                <p className="text-xl font-bold mt-0.5 text-main">{kpi.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Upcoming Runs */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="glass-panel rounded-xl border border-white/5 flex flex-col flex-1 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-main/60">Upcoming Payroll Runs</h2>
                            <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-bold">
                                View Calendar <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-black/20 text-main/40 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium">Period</th>
                                        <th className="px-6 py-3 text-left font-medium">Est. Payout</th>
                                        <th className="px-6 py-3 text-left font-medium">Due Date</th>
                                        <th className="px-6 py-3 text-center font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payrollDashboardData.upcomingRuns.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <CreditCard className="w-4 h-4 text-purple-400/50" />
                                                    <span className="font-bold text-main/80">{row.period}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-main/60">{row.amount}</td>
                                            <td className="px-6 py-4 font-medium text-main/40">{row.date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                                    row.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    'bg-white/5 text-main/30 border-white/10'
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
                </div>

                {/* Operational Insights */}
                <div className="glass-panel rounded-xl border border-white/5 p-6 space-y-6">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-main/60 mb-4">Operational Insights</h2>
                        <div className="space-y-4">
                            {payrollDashboardData.insights.map((insight, i) => {
                                const Icon = IconMap[insight.icon];
                                return (
                                    <div key={i} className={`p-4 rounded-xl ${insight.bg} border ${insight.border} space-y-2`}>
                                        <div className={`flex items-center gap-2 ${insight.color} font-bold text-xs uppercase tracking-tighter`}>
                                            {Icon && <Icon className="w-4 h-4" />} {insight.title}
                                            {insight.deadline && <span className="ml-auto text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded">{insight.deadline}</span>}
                                        </div>
                                        <p className="text-xs text-main/60 leading-relaxed">
                                            {insight.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-bold text-main/30 uppercase tracking-widest mb-4">Quick Links</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {payrollDashboardData.quickLinks.map(link => (
                                <button key={link} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-main/60 text-left transition-all">
                                    {link}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayrollDashboardMockUI;
