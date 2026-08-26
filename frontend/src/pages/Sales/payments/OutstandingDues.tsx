import React, { useState } from 'react';
import { AlertTriangle, Search, Download, ChevronRight, Phone, Clock } from 'lucide-react';

const DUES = [
    { customer: 'Rajesh Textiles', phone: '9876543210', total: 180000, overdue: 45000, days0_30: 60000, days31_60: 45000, days61_90: 30000, days90plus: 45000, lastPayment: '2026-01-10', risk: 'High' },
    { customer: 'Priya Fashions', phone: '9845001122', total: 32000, overdue: 0, days0_30: 32000, days31_60: 0, days61_90: 0, days90plus: 0, lastPayment: '2026-02-15', risk: 'Low' },
    { customer: 'Sri Murugan Stores', phone: '9700111222', total: 78000, overdue: 28000, days0_30: 22000, days31_60: 28000, days61_90: 18000, days90plus: 10000, lastPayment: '2026-01-05', risk: 'Medium' },
    { customer: 'Kavitha Silks', phone: '9865432100', total: 55000, overdue: 55000, days0_30: 0, days31_60: 0, days61_90: 20000, days90plus: 35000, lastPayment: '2025-11-30', risk: 'High' },
    { customer: 'Anbu Traders', phone: '9944332211', total: 12000, overdue: 0, days0_30: 12000, days31_60: 0, days61_90: 0, days90plus: 0, lastPayment: '2026-02-20', risk: 'Low' },
];

const RISK: Record<string, string> = {
    High: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    Medium: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    Low: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
};

const OutstandingDues: React.FC = () => {
    const [search, setSearch] = useState('');
    const [risk, setRisk] = useState('All');

    const totalDues = DUES.reduce((s, d) => s + d.total, 0);
    const totalOverdue = DUES.reduce((s, d) => s + d.overdue, 0);
    const highRisk = DUES.filter(d => d.risk === 'High').length;

    const filtered = DUES.filter(d =>
        d.customer.toLowerCase().includes(search.toLowerCase()) &&
        (risk === 'All' || d.risk === risk)
    );

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-red-600 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Outstanding Dues</h1>
                        <p className="text-xs text-slate-500">Customer receivables ageing analysis</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Receivables', value: `₹${(totalDues / 1000).toFixed(0)}k`, sub: `${DUES.length} customers`, border: 'border-l-blue-500' },
                    { label: 'Overdue Amount', value: `₹${(totalOverdue / 1000).toFixed(0)}k`, sub: `${Math.round((totalOverdue / totalDues) * 100)}% of total`, border: 'border-l-red-500' },
                    { label: 'High Risk', value: `${highRisk} customers`, sub: 'Immediate follow-up needed', border: 'border-l-amber-500' },
                ].map((kpi, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 border-l-4 ${kpi.border} p-5`}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div className="flex gap-1">
                        {['All', 'High', 'Medium', 'Low'].map(r => (
                            <button key={r} onClick={() => setRisk(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${risk === r ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>{['Customer', 'Total Due', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Last Payment', 'Risk', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filtered.map((d, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{d.customer}</p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">₹{d.total.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs text-emerald-600 font-bold">{d.days0_30 ? `₹${d.days0_30.toLocaleString()}` : '—'}</td>
                                    <td className="px-4 py-3 text-xs text-amber-600 font-bold">{d.days31_60 ? `₹${d.days31_60.toLocaleString()}` : '—'}</td>
                                    <td className="px-4 py-3 text-xs text-orange-600 font-bold">{d.days61_90 ? `₹${d.days61_90.toLocaleString()}` : '—'}</td>
                                    <td className="px-4 py-3 text-xs text-red-600 font-black">{d.days90plus ? `₹${d.days90plus.toLocaleString()}` : '—'}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{d.lastPayment}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${RISK[d.risk]}`}>{d.risk}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </button>
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

export default OutstandingDues;
