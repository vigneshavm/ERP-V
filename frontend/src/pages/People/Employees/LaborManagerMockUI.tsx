import React, { useState, useMemo } from 'react';
import { Filter, Search, Plus, Download, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import laborManagerData from '../../../mockData/laborManagerData.json';

const MOCK_LABOR_DATA = laborManagerData.laborers;

const LaborManagerMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    const departments = useMemo(() => {
        const depts = MOCK_LABOR_DATA.map(emp => emp.department);
        return ['All', ...Array.from(new Set(depts))];
    }, []);

    const filteredEmployees = useMemo(() => {
        return MOCK_LABOR_DATA.filter(emp => {
            const matchesSearch = 
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.department.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
            
            return matchesSearch && matchesDept;
        });
    }, [searchQuery, selectedDept]);

    const handleExport = () => {
        const headers = ['ID', 'Name', 'Department', 'Status', 'Value'];
        const csvContent = [
            headers.join(','),
            ...filteredEmployees.map(emp => 
                `${emp.id},"${emp.name}","${emp.department}","${emp.status}","${emp.value.replace(/,/g, '')}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'labor_data.csv');
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
                        Labor Management
                    </h1>
                    <p className="text-sm text-main/60 mt-1">HR & Payroll Data Grid</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
                    >
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                    <button 
                        onClick={() => navigate('/people/employees/labor/add')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Create Record
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 rounded-xl flex gap-4 items-center border border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/40" />
                    <input 
                        type="text" 
                        placeholder="Search employees or records..." 
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
                                <th className="p-4 text-left font-medium">ID</th>
                                <th className="p-4 text-left font-medium">Name</th>
                                <th className="p-4 text-left font-medium">Department</th>
                                <th className="p-4 text-left font-medium">Status</th>
                                <th className="p-4 text-right font-medium">Amount/Value</th>
                                <th className="p-4 text-center font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr 
                                        key={emp.id} 
                                        onClick={() => navigate(`/people/employees/labor/view/${emp.id}`)}
                                        className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4 font-medium text-purple-400 group-hover:text-purple-300">{emp.id}</td>
                                        <td className="p-4 text-main/90 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                {emp.name}
                                            </div>
                                        </td>
                                        <td className="p-4 text-main/80">{emp.department}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 border rounded-full text-xs font-medium tracking-wide ${
                                                emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                emp.status === 'On Leave' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-medium text-main/90">${emp.value}</td>
                                        <td className="p-4 text-center">
                                            <ChevronRight className="w-4 h-4 text-main/30 group-hover:text-main/70 transition-colors inline-block" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-main/30 italic">
                                        No results found matching "${searchQuery}"
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

export default LaborManagerMockUI;
