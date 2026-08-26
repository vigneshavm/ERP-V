import React, { useState, useMemo } from 'react';
import { Filter, Search, Plus, Download, ChevronRight, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

const LaborManagerMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    const departments = useMemo(() => {
        const depts = employees.map(emp => emp.dept);
        return ['All', ...Array.from(new Set(depts))];
    }, []);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = 
                emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.role.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesDept = selectedDept === 'All' || emp.dept === selectedDept;
            
            return matchesSearch && matchesDept;
        });
    }, [searchQuery, selectedDept]);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Labor <span className="text-primary">Management</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Workforce Operations Control // Industrial Grade HR
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

                {/* KPI Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Workforce', value: employees.length, icon: Users, color: 'primary' },
                        { label: 'Active Shifts', value: employees.filter(e => e.status === 'Present').length, icon: Zap, color: 'success' },
                        { label: 'Avg Attendance', value: '94.2%', icon: Zap, color: 'warning' },
                        { label: 'Operations Dept', value: departments.length - 1, icon: Users, color: 'info' }
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-6 shadow-sm">
                            <div className="p-4 rounded-sm bg-primary/5 text-primary border border-primary/10">
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">{kpi.label}</p>
                                <p className="text-2xl font-display font-black mt-1 text-neutral-900 dark:text-white tabular-nums">{kpi.value}</p>
                            </div>
                        </div>
                    ))}
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
                    <div className="relative w-full md:w-64">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <select 
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-8 py-3.5 text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-primary shadow-sm"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept === 'All' ? 'Every Department' : dept}</option>
                            ))}
                        </select>
                    </div>
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
                                    <th className="px-8 py-5 text-right">Daily Rate</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((rec, i) => (
                                        <tr key={i} className="hover:bg-primary/[0.02] transition-all group cursor-pointer" onClick={() => navigate(`/people/employees/labor/view/${rec.id}`)}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                        {rec.full_name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">{rec.full_name}</div>
                                                        <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">ID: {rec.id.split('-').pop()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-300">{rec.role}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                                                    {rec.dept}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                                                        rec.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                        rec.status === 'Late' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    }`}>
                                                        {rec.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="font-mono text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">
                                                    ₹{(rec.salary / 30).toFixed(0).toLocaleString()}
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center text-neutral-400 italic font-black uppercase tracking-widest text-xs">
                                            No personnel matching current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LaborManagerMockUI;

