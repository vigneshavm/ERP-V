import React, { useState, useMemo } from 'react';
import { Filter, Search, Plus, Download, ChevronRight, Users, CreditCard, Calculator, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

const AllowanceManagerMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    const departments = useMemo(() => {
        const depts = employees.map(emp => emp.dept);
        return ['All', ...Array.from(new Set(depts))];
    }, []);

    const adjustments = useMemo(() => {
        return employees.slice(0, 12).map((emp, i) => ({
            id: emp.id,
            name: emp.full_name,
            dept: emp.dept,
            type: i % 2 === 0 ? 'Travel Allowance' : 'Tax Deduction',
            category: i % 2 === 0 ? 'Allowance' : 'Deduction',
            status: i % 3 === 0 ? 'Approved' : i % 3 === 1 ? 'Pending' : 'Rejected',
            amount: i % 2 === 0 ? (Math.random() * 5000 + 1000).toFixed(0) : (Math.random() * 2000 + 500).toFixed(0)
        }));
    }, []);

    const filteredRecords = useMemo(() => {
        return adjustments.filter(item => {
            const matchesSearch = 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.type.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesDept = selectedDept === 'All' || item.dept === selectedDept;
            
            return matchesSearch && matchesDept;
        });
    }, [searchQuery, selectedDept, adjustments]);

    const stats = useMemo(() => {
        const totalAllowance = adjustments.filter(a => a.category === 'Allowance').reduce((sum, a) => sum + parseFloat(a.amount), 0);
        const totalDeduction = adjustments.filter(a => a.category === 'Deduction').reduce((sum, a) => sum + parseFloat(a.amount), 0);
        return [
            { label: 'Total Allowances', value: `₹${(totalAllowance/1000).toFixed(1)}K`, icon: ArrowUpRight, color: 'text-emerald-500' },
            { label: 'Total Deductions', value: `₹${(totalDeduction/1000).toFixed(1)}K`, icon: ArrowDownRight, color: 'text-rose-500' },
            { label: 'Pending Reviews', value: adjustments.filter(a => a.status === 'Pending').length, icon: CreditCard, color: 'text-amber-500' },
            { label: 'Net Adjustment', value: `₹${((totalAllowance - totalDeduction)/1000).toFixed(1)}K`, icon: Calculator, color: 'text-primary' }
        ];
    }, [adjustments]);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Payroll <span className="text-primary">Adjustments</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Allowance & Deduction Registry // Financial Compliance
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Download className="w-4 h-4 text-primary" /> Export Ledger
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> New Entry
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-6 shadow-sm">
                            <div className="p-4 rounded-sm bg-primary/5 text-primary border border-primary/10">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">{stat.label}</p>
                                <p className="text-2xl font-display font-black mt-1 text-neutral-900 dark:text-white tabular-nums">{stat.value}</p>
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
                            placeholder="SEARCH BY STAFF NAME / TYPE / ID..." 
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
                                    <th className="px-8 py-5">Employee Identity</th>
                                    <th className="px-8 py-5">Adjustment Type</th>
                                    <th className="px-8 py-5">Functional Dept</th>
                                    <th className="px-8 py-5 text-center">Audit Status</th>
                                    <th className="px-8 py-5 text-right">Credit Value</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredRecords.map((item, i) => (
                                    <tr key={i} className="hover:bg-primary/[0.02] transition-all group cursor-pointer" onClick={() => navigate(`/people/employees/labor/view/${item.id}`)}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                    {item.name[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-neutral-900 dark:text-white">{item.name}</div>
                                                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">ID: {item.id.split('-').pop()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className={`w-3.5 h-3.5 ${item.category === 'Allowance' ? 'text-emerald-500' : 'text-rose-500'}`} />
                                                <span className="text-xs font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-300">{item.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                                                {item.dept}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                                                    item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                    item.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                    {item.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`font-mono text-sm font-black tabular-nums tracking-tighter ${item.category === 'Allowance' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {item.category === 'Allowance' ? '+' : '-'}₹{parseFloat(item.amount).toLocaleString()}
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

export default AllowanceManagerMockUI;

