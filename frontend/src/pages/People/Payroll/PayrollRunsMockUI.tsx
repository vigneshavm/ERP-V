import React from 'react';
import { Filter, Search, Plus, Download, ChevronRight, Users, Zap, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

const PayrollRunsMockUI: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Payroll <span className="text-primary">Ledger</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Salary Disbursement Registry // Current Cycle: Nov 2024
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Download className="w-4 h-4 text-primary" /> Export Records
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Initialize Run
                        </button>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-6 shadow-sm relative overflow-hidden group">
                        <div className="p-4 rounded-sm bg-primary/10 text-primary border border-primary/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">Total Recipients</p>
                            <p className="text-3xl font-display font-black mt-1 text-neutral-900 dark:text-white tabular-nums">{employees.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-6 shadow-sm relative overflow-hidden group">
                        <div className="p-4 rounded-sm bg-success/10 text-success border border-success/20">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">Gross Disbursement</p>
                            <p className="text-3xl font-display font-black mt-1 text-neutral-900 dark:text-white tabular-nums">
                                ₹{(employees.reduce((s, e) => s + e.salary, 0)/100000).toFixed(2)}L
                            </p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-6 shadow-sm relative overflow-hidden group">
                        <div className="p-4 rounded-sm bg-warning/10 text-warning border border-warning/20">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">Run Completion</p>
                            <p className="text-3xl font-display font-black mt-1 text-neutral-900 dark:text-white tabular-nums">94%</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-sm flex flex-col md:flex-row gap-6 items-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY STAFF IDENTITY OR NAME..." 
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-3.5 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                        />
                    </div>
                    <button className="h-12 px-6 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex items-center gap-2 transition-all">
                        <Filter className="w-4 h-4" /> Department filter
                    </button>
                </div>

                {/* Data Grid */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Staff Identity</th>
                                    <th className="px-8 py-5">Personnel Name</th>
                                    <th className="px-8 py-5">Department</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Payroll Amount</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {employees.map((rec, i) => (
                                    <tr key={i} className="hover:bg-primary/[0.02] transition-all group cursor-pointer" onClick={() => navigate(`/people/staff/${rec.id}`)}>
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-xs font-black text-primary uppercase tracking-tighter">
                                                {rec.id.split('-').pop()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                    {rec.full_name[0]}
                                                </div>
                                                <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">{rec.full_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                                                {rec.dept}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                                <span className="text-[10px] font-black text-success uppercase tracking-widest">DISBURSED</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="font-mono text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">
                                                ₹{rec.salary.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <button className="p-3 text-neutral-400 hover:text-white bg-neutral-50 dark:bg-neutral-800 hover:bg-primary rounded-sm transition-all shadow-sm border border-neutral-200 dark:border-neutral-700">
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
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

export default PayrollRunsMockUI;

