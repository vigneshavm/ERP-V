import React, { useMemo, useState } from 'react';
import { Users, Plus, Search, Filter, UserCheck, Clock, DollarSign, Briefcase, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

const HRMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('All');

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = 
                emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.dept.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesTab = 
                selectedTab === 'All' || 
                (selectedTab === 'Active' && emp.is_active) ||
                (selectedTab === 'On Leave' && emp.status === 'On Leave');
            
            return matchesSearch && matchesTab;
        });
    }, [searchQuery, selectedTab]);

    const metrics = useMemo(() => {
        const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
        const presentCount = employees.filter(emp => emp.status === 'Present').length;
        const leaveCount = employees.filter(emp => emp.status === 'On Leave').length;

        return [
            { label: 'Total Workforce', val: `${employees.length}`, sub: 'Active Contracts', icon: Users, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
            { label: 'Present Today', val: `${presentCount}`, sub: `${((presentCount/employees.length)*100).toFixed(1)}% Active`, icon: UserCheck, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
            { label: 'On Leave', val: `${leaveCount}`, sub: 'Planned Absence', icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
            { label: 'Monthly Payroll', val: `₹${(totalSalary/100000).toFixed(2)}L`, sub: 'Projected Cost', icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' }
        ];
    }, []);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Workforce <span className="text-primary">Intelligence</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Human Capital Management // Protocol V4 Active
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <DollarSign className="w-4 h-4 text-primary" /> Run Payroll
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Onboard Staff
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-sm p-6 border border-neutral-200 dark:border-neutral-800 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className={`p-3 rounded-sm ${card.bg} ${card.color} w-fit mb-6 border ${card.border}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-display font-black tracking-tighter mt-1 text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                            <p className={`text-[10px] mt-2 font-black uppercase tracking-widest ${card.color} flex items-center gap-1`}>
                                <Zap className="w-3 h-3" /> {card.sub}
                            </p>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                        </div>
                    ))}
                </div>

                {/* Data Grid Section */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col lg:flex-row justify-between items-center gap-4 bg-neutral-50/50 dark:bg-neutral-950/50">
                        <div className="flex gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH STAFF / DEPT / ROLE..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3.5 pl-12 pr-6 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all text-neutral-900 dark:text-white shadow-inner" 
                                />
                            </div>
                            <button className="h-12 px-6 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex items-center gap-2 transition-all">
                                <Filter className="w-4 h-4" /> Global Filter
                            </button>
                        </div>
                        <div className="flex gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-800 w-full lg:w-auto">
                            {['All', 'Active', 'On Leave'].map((tab) => (
                                <button 
                                    key={tab} 
                                    onClick={() => setSelectedTab(tab)}
                                    className={`flex-1 lg:flex-none px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === tab ? 'bg-white dark:bg-neutral-900 text-primary shadow-sm' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Employee Entity</th>
                                    <th className="px-8 py-5 text-center">Department</th>
                                    <th className="px-8 py-5">Designation</th>
                                    <th className="px-8 py-5 text-center">Joined</th>
                                    <th className="px-8 py-5 text-right">Compensation</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-primary/[0.02] transition-all group cursor-pointer" onClick={() => navigate(`/people/staff/${emp.id}`)}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                    {emp.full_name[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">{emp.full_name}</div>
                                                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">ID: {emp.id.split('-').pop()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                                                {emp.dept}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2.5">
                                                <Briefcase className="w-4 h-4 text-primary/50" />
                                                <span className="text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-tight">{emp.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 font-mono">{emp.joined}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="font-mono text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">₹{emp.salary.toLocaleString()}</span>
                                            <div className="text-[9px] font-black text-success uppercase tracking-widest mt-1">Lump Sum</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${emp.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                                    {emp.status}
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

export default HRMockUI;

