import React, { useState, useMemo } from 'react';
import { 
    Users, Clock, Calendar, TrendingUp, Download, 
    FileText, CheckCircle2, AlertTriangle, ArrowUpRight,
    BarChart3, Activity, ShieldCheck, Zap
} from 'lucide-react';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

const AttendanceSummaryManagerMockUI: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('MAY 2026');

    const metrics = useMemo(() => {
        const totalStaff = employees.length;
        const presentToday = employees.filter(e => e.status === 'Present').length;
        const attendanceRate = ((presentToday / totalStaff) * 100).toFixed(1);
        
        return [
            { title: 'Total Personnel', value: totalStaff, trend: '+2.4%', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
            { title: 'Average Attendance', value: `${attendanceRate}%`, trend: '+0.8%', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { title: 'Overtime Buffer', value: '428H', trend: '-12%', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { title: 'System Uptime', value: '99.9%', trend: 'Stable', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
        ];
    }, []);

    const historicalData = useMemo(() => [
        { period: 'MAY 2026 (Active)', totalHours: '12,480', overtime: '142', accuracy: '99.8%', status: 'CURRENT' },
        { period: 'APRIL 2026', totalHours: '18,240', overtime: '210', accuracy: '99.4%', status: 'VERIFIED' },
        { period: 'MARCH 2026', totalHours: '17,920', overtime: '185', accuracy: '99.1%', status: 'VERIFIED' },
        { period: 'FEBRUARY 2026', totalHours: '16,400', overtime: '160', accuracy: '98.9%', status: 'ARCHIVED' },
        { period: 'JANUARY 2026', totalHours: '18,100', overtime: '195', accuracy: '99.5%', status: 'ARCHIVED' }
    ], []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Attendance <span className="text-primary">Intelligence</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Biometric Aggregation // Workforce Utilization Audit
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-3 uppercase">
                            <Download className="w-4 h-4 text-primary" /> Export Data
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <FileText className="w-4 h-4" /> Audit Ledger
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((kpi, idx) => (
                        <div key={idx} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-4 rounded-sm ${kpi.bg} ${kpi.color} border border-current/10`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black tracking-widest px-2 py-1 rounded-sm border ${kpi.trend.startsWith('+') ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-rose-500/5 text-rose-500 border-rose-500/10'}`}>
                                    {kpi.trend}
                                </span>
                            </div>
                            <div className="mt-6 relative z-10">
                                <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">{kpi.title}</p>
                                <p className="text-3xl font-display font-black mt-1 text-neutral-900 dark:text-white tabular-nums">{kpi.value}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-primary" /> Historical Utilization Matrix
                            </h2>
                            <div className="flex gap-2">
                                <button className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-sm hover:text-primary transition-all">
                                    <Zap className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                    <tr className="text-neutral-500 dark:text-neutral-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-8 py-4">Payroll Node Period</th>
                                        <th className="px-8 py-4 text-right">Total Aggregate Hours</th>
                                        <th className="px-8 py-4 text-right">OT Buffer</th>
                                        <th className="px-8 py-4 text-right">Log Accuracy</th>
                                        <th className="px-8 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {historicalData.map((row, i) => (
                                        <tr key={i} className="hover:bg-primary/[0.02] transition-all group cursor-pointer">
                                            <td className="px-8 py-5 font-black text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-tighter">{row.period}</td>
                                            <td className="px-8 py-5 text-right font-mono text-xs font-black text-primary tabular-nums">{row.totalHours}H</td>
                                            <td className="px-8 py-5 text-right font-mono text-xs font-black text-amber-500 tabular-nums">{row.overtime}H</td>
                                            <td className="px-8 py-5 text-right font-mono text-xs font-black text-emerald-500 tabular-nums">{row.accuracy}</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-sm border text-[9px] font-black uppercase tracking-widest ${
                                                    row.status === 'CURRENT' ? 'bg-primary/5 text-primary border-primary/10' :
                                                    row.status === 'VERIFIED' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' :
                                                    'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700'
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

                    <div className="space-y-8 min-w-0">
                        <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-8">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 pb-4">Personnel Health Check</h2>
                            <div className="space-y-6">
                                {[
                                    { title: 'Biometric Drift', sub: 'Anomalies detected in Floor 4', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
                                    { title: 'Compliance Shield', sub: 'All mandatory logs verified', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                                    { title: 'Resource Shortage', sub: 'Logistics dept under-capacity', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' }
                                ].map((item, i) => (
                                    <div key={i} className={`p-5 rounded-sm ${item.bg} border ${item.border} flex items-center gap-5 group hover:scale-[1.02] transition-transform cursor-pointer shadow-sm`}>
                                        <div className={`w-12 h-12 rounded-sm bg-white dark:bg-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 shadow-sm ${item.color}`}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">{item.title}</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1 truncate italic">{item.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
                            <button className="w-full py-4 rounded-sm bg-neutral-50 dark:bg-neutral-950 hover:bg-primary hover:text-white border border-neutral-200 dark:border-neutral-800 hover:border-primary transition-all text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-inner">
                                Full Personnel Audit Log <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AttendanceSummaryManagerMockUI;
