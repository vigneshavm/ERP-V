import React, { useState, useMemo } from 'react';
import { Filter, Search, Plus, Download, ChevronRight, Users, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import allowanceManagerData from '../../../mockData/allowanceManagerData.json';

const MOCK_ALLOWANCES = allowanceManagerData.allowances;

const AllowanceManagerMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    const departments = useMemo(() => {
        const depts = MOCK_ALLOWANCES.map(item => item.dept);
        return ['All', ...Array.from(new Set(depts))];
    }, []);

    const filteredRecords = useMemo(() => {
        return MOCK_ALLOWANCES.filter(item => {
            const matchesSearch = 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.type.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesDept = selectedDept === 'All' || item.dept === selectedDept;
            
            return matchesSearch && matchesDept;
        });
    }, [searchQuery, selectedDept]);

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Allowances & Deductions
                    </h1>
                    <p className="text-sm text-main/60 mt-1">Payroll Adjustment Registry</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm">
                        <Download className="w-4 h-4" /> Export Ledger
                    </button>
                    <button 
                        onClick={() => navigate('/people/employees/labor/add')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> New Adjustment
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 rounded-xl flex gap-4 items-center border border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/40" />
                    <input 
                        type="text" 
                        placeholder="Search by name, ID or type..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-purple-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                        <select 
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm hover:bg-white/10 transition-all outline-none appearance-none cursor-pointer focus:border-purple-500/50"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept} className="bg-[#0a0a0a]">{dept === 'All' ? 'All Departments' : dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/40 border-b border-white/10 text-main/60">
                            <tr>
                                <th className="p-4 text-left font-medium">Employee</th>
                                <th className="p-4 text-left font-medium">Adjustment Type</th>
                                <th className="p-4 text-left font-medium">Department</th>
                                <th className="p-4 text-left font-medium">Status</th>
                                <th className="p-4 text-right font-medium">Amount</th>
                                <th className="p-4 text-center font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((item) => (
                                    <tr 
                                        key={item.id} 
                                        onClick={() => navigate(`/people/employees/labor/view/${item.id}`)}
                                        className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-main/90">{item.name}</div>
                                                    <div className="text-[10px] text-main/30 font-mono tracking-tighter">{item.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-main/80 font-medium">
                                                <CreditCard className="w-3.5 h-3.5 text-blue-400/70" />
                                                {item.type}
                                            </div>
                                        </td>
                                        <td className="p-4 text-main/60">{item.dept}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 border rounded-full text-xs font-medium tracking-wide ${
                                                item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                item.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-main/90 font-mono">₹{item.amount}</td>
                                        <td className="p-4 text-center">
                                            <ChevronRight className="w-4 h-4 text-main/30 group-hover:text-main/70 transition-colors inline-block" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-main/30 italic">
                                        No records matching "${searchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllowanceManagerMockUI;
