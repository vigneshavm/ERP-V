import React, { useState, useMemo } from 'react';
import { Filter, Search, Plus, Download, ChevronRight, Users, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

const StaffManagerMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => 
            emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.role.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Staff <span className="text-primary">Directory</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Enterprise Personnel Registry // Unified Access Layer
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Download className="w-4 h-4 text-primary" /> Export Dataset
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Add Personnel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-sm flex flex-col md:flex-row gap-6 items-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY STAFF NAME / DEPT / ROLE..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-3.5 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                        />
                    </div>
                    <button className="h-12 px-6 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex items-center gap-2 transition-all">
                        <Filter className="w-4 h-4" /> Advanced Filter
                    </button>
                </div>

                {/* Data Grid */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Personnel Identity</th>
                                    <th className="px-8 py-5">Job Profile</th>
                                    <th className="px-8 py-5">Operational Dept</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredEmployees.map((rec, i) => (
                                    <tr key={i} className="hover:bg-primary/[0.02] transition-all group cursor-pointer" onClick={() => navigate(`/people/staff/${rec.id}`)}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg group-hover:bg-primary group-hover:text-white transition-all">
                                                    {rec.full_name[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">{rec.full_name}</div>
                                                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">ID: {rec.id.split('-').pop()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300">
                                                <Briefcase className="w-4 h-4 text-primary/50" />
                                                <span className="text-xs font-black uppercase tracking-tight">{rec.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                                                {rec.dept}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${rec.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                    {rec.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </div>
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

export default StaffManagerMockUI;

