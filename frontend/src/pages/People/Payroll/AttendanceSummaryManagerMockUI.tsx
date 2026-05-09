import React, { useState } from 'react';
import { 
    Users, Clock, Calendar, TrendingUp, Download, 
    FileText, CheckCircle2, AlertTriangle, ArrowUpRight,
    BarChart3
} from 'lucide-react';
import attendanceSummaryData from '../../../mockData/attendanceSummaryData.json';

const IconMap: Record<string, React.ElementType> = {
    Clock, TrendingUp, Users, CheckCircle2, AlertTriangle
};

const MOCK_SUMMARIES = attendanceSummaryData.summaries;

const AttendanceSummaryManagerMockUI: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('April 2026');

    const handleExport = () => {
        const headers = ['Payroll Period', 'Total Hours', 'Overtime', 'Accuracy', 'Status'];
        const csvContent = [
            headers.join(','),
            ...MOCK_SUMMARIES.map(row => 
                `"${row.period}","${row.totalHours.replace(/,/g, '')}","${row.overtime.replace(/,/g, '')}","${row.accuracy}","${row.status}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'attendance_summary.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Attendance & Timesheets
                    </h1>
                    <p className="text-sm text-main/60 mt-1">Payroll Intelligence & Historical Summary</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
                    >
                        <Download className="w-4 h-4" /> Export Summary
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-sm font-medium">
                        <FileText className="w-4 h-4" /> Generate Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {attendanceSummaryData.metrics.map((kpi, idx) => {
                    const Icon = IconMap[kpi.icon];
                    return (
                        <div key={idx} className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className={`p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                                    {Icon && <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpi.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {kpi.trend}
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] text-main/30 uppercase tracking-widest font-bold">{kpi.title}</p>
                                <p className="text-2xl font-bold mt-0.5 text-main">{kpi.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                <div className="lg:col-span-2 glass-panel rounded-xl border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-main/60">Historical Performance</h2>
                        <div className="flex gap-2">
                            <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <BarChart3 className="w-4 h-4 text-purple-400" />
                            </button>
                        </div>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-black/20 text-main/40 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium">Payroll Period</th>
                                    <th className="px-6 py-3 text-right font-medium">Total Hours</th>
                                    <th className="px-6 py-3 text-right font-medium">Overtime</th>
                                    <th className="px-6 py-3 text-right font-medium">Accuracy</th>
                                    <th className="px-6 py-3 text-center font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {MOCK_SUMMARIES.map((row, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                                        <td className="px-6 py-4 font-bold text-main/80">{row.period}</td>
                                        <td className="px-6 py-4 text-right font-mono text-blue-400/80">{row.totalHours}</td>
                                        <td className="px-6 py-4 text-right font-mono text-amber-400/80">{row.overtime}</td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-400/80">{row.accuracy}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-main/40">
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col space-y-6">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-main/60 mb-4">Payroll Health</h2>
                        <div className="space-y-4">
                            {attendanceSummaryData.health.map((item, i) => {
                                const Icon = IconMap[item.icon];
                                return (
                                    <div key={i} className={`p-4 rounded-xl ${item.bg} border ${item.border} flex items-center gap-4`}>
                                        {Icon && <Icon className={`w-8 h-8 ${item.color}`} />}
                                        <div>
                                            <p className="text-sm font-bold text-main/90">{item.title}</p>
                                            <p className="text-xs text-main/40">{item.sub}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-bold flex items-center justify-center gap-2">
                            View Full Audit Log <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceSummaryManagerMockUI;
