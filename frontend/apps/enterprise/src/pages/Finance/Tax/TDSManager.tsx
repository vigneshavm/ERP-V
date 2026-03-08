import React, { useState } from 'react';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { 
    FileText, 
    Download, 
    Plus, 
    Search, 
    Filter, 
    Calendar, 
    ShieldCheck, 
    ArrowUpRight, 
    AlertCircle,
    PieChart
} from 'lucide-react';

const TDSManager: React.FC = () => {
    const [view, setView] = useState<'RECORDS' | 'SUMMARY'>('SUMMARY');

    const tdsRecords = [
        { id: 'TDS-001', vendor: 'Infra Builders Pvt Ltd', type: '194C (Contractors)', amount: 500000, tdsRate: 2, tdsAmount: 10000, date: '2024-02-15', status: 'DEDUCTED' },
        { id: 'TDS-002', vendor: 'Arun & Co (Legal)', type: '194J (Professional)', amount: 150000, tdsRate: 10, tdsAmount: 15000, date: '2024-02-18', status: 'PAID' },
        { id: 'TDS-003', vendor: 'Global Cloud Systems', type: '194J (Technical)', amount: 80000, tdsRate: 10, tdsAmount: 8000, date: '2024-02-22', status: 'PENDING' },
    ];

    return (
        <Layout>
            <PageHeader
                title="TDS Management Authority"
                description="Tax Deducted at Source tracking, compliance and returns management"
                breadcrumbs={[{ label: 'Finance' }, { label: 'Taxation' }, { label: 'TDS' }]}
                actions={
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <Download className="w-4 h-4" /> Export 26AS
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" /> New Deduction
                        </button>
                    </div>
                }
            />

            {/* TDS Quick Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8 mt-6">
                {[
                    { label: 'Total Deducted (MTD)', value: '₹ 1,24,500', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Pending Payment', value: '₹ 32,000', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'TDS Payable (Q4)', value: '₹ 4,85,000', icon: PieChart, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Compliance Rate', value: '100%', icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                        <div className={`w-10 h-10 ${stat.bg} dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setView('SUMMARY')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'SUMMARY' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Summary
                        </button>
                        <button 
                            onClick={() => setView('RECORDS')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'RECORDS' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Deduction Records
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                placeholder="Search Section / Vendor..."
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
                            />
                        </div>
                        <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="px-4 py-4">ID</th>
                                <th className="px-4 py-4">Vendor</th>
                                <th className="px-4 py-4">TDS Section</th>
                                <th className="px-4 py-4 text-right">Base Amount</th>
                                <th className="px-4 py-4 text-center">Rate (%)</th>
                                <th className="px-4 py-4 text-right">TDS Amt</th>
                                <th className="px-4 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {tdsRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                                    <td className="px-4 py-5 text-xs font-black text-slate-900 dark:text-white">{record.id}</td>
                                    <td className="px-4 py-5">
                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{record.vendor}</div>
                                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" /> {record.date}
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                            {record.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-right font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                                        ₹ {record.amount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-5 text-center font-mono text-xs font-black text-slate-900 dark:text-white">
                                        {record.tdsRate}%
                                    </td>
                                    <td className="px-4 py-5 text-right font-mono text-xs font-black text-primary">
                                        ₹ {record.tdsAmount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            record.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                            record.status === 'DEDUCTED' ? 'bg-blue-100 text-blue-700' :
                                            'bg-rose-100 text-rose-700'
                                        }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        Authorized TDS Ledger | System Gen: {new Date().toLocaleDateString()}
                    </p>
                    <button className="flex items-center gap-2 text-xs font-black text-primary hover:underline uppercase tracking-widest">
                        Download Quarterly Return (Form 26Q) <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default TDSManager;
