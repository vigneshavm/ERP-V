import React from 'react';
import { Users, Plus, Search, Filter, UserCheck, UserX, Clock, DollarSign, Briefcase, Calendar, MoreHorizontal, ArrowRight, Shield } from 'lucide-react';
import hrData from '../../../mockData/hrData.json';

const IconMap: Record<string, React.ElementType> = {
    Users,
    UserCheck,
    Clock,
    DollarSign
};

const HRMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-5%] right-[15%] w-[45%] h-[45%] bg-indigo-700/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[0%] left-[5%] w-[40%] h-[40%] bg-blue-800/10 rounded-full blur-[140px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                            HR & Workforce
                            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Shield className="w-3 h-3" /> People Module
                            </span>
                        </h1>
                        <p className="text-sm text-secondary mt-1 font-medium">Manage employees, attendance, payroll, and salary structures.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-card hover:bg-card text-main font-bold text-sm tracking-wide rounded-xl transition-all border border-default flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Run Payroll
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-main font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Employee
                        </button>
                    </div>
                </header>

            <div className="grid grid-cols-4 gap-6 mb-8">
                {hrData.metrics.map((card, i) => {
                    const Icon = IconMap[card.icon];
                    return (
                        <div key={i} className={`glass-panel backdrop-blur-md rounded-2xl p-6 border ${card.border} group hover:bg-card/80 transition-all cursor-pointer`}>
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}>
                                {Icon && <Icon className="w-5 h-5" />}
                            </div>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-black tracking-tighter mt-1 text-main">{card.val}</p>
                            <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                        </div>
                    );
                })}
            </div>

                <div className="flex-1 glass-panel backdrop-blur-xl border border-default rounded-3xl flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-default flex justify-between items-center bg-card">
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                                <input type="text" placeholder="Search employee, department..." className="w-80 bg-input border border-default rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-main placeholder:text-slate-600" />
                            </div>
                            <button className="h-10 px-4 bg-card hover:bg-card border border-default rounded-xl text-xs font-bold text-main flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Active', 'On Leave', 'Resigned'].map((tab, idx) => (
                                <button key={tab} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${idx === 0 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-secondary hover:text-main'}`}>{tab}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    {['Employee', 'Department', 'Role', 'Joined', 'Salary', 'Attendance', 'Status', 'Actions'].map(h => (
                                        <th key={h} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default ${h === 'Salary' ? 'text-right' : h === 'Attendance' || h === 'Status' || h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {hrData.employees.map((emp, idx) => (
                                    <tr key={idx} className="hover:bg-card/30 transition-colors group cursor-pointer">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">{emp.name.split(' ').map(n => n[0]).join('')}</div>
                                                <div className="text-sm font-bold text-main">{emp.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><span className="px-2.5 py-1 bg-card border border-default rounded-lg text-[10px] font-black uppercase tracking-widest text-muted">{emp.dept}</span></td>
                                        <td className="px-6 py-5"><div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-secondary" /><span className="text-sm text-main font-bold">{emp.role}</span></div></td>
                                        <td className="px-6 py-5"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-secondary" /><span className="text-sm text-muted font-bold">{emp.joined}</span></div></td>
                                        <td className="px-6 py-5 text-right"><span className="font-mono text-sm font-black text-main">₹{emp.salary}</span></td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-card rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: emp.attend }} /></div>
                                                <span className="text-xs font-black text-main">{emp.attend}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><div className="flex justify-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-${emp.color}-500/10 text-${emp.color}-400 border-${emp.color}-500/20`}>{emp.status}</span></div></td>
                                        <td className="px-6 py-5"><div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-muted hover:text-indigo-400 bg-card hover:bg-card rounded-lg transition-colors"><ArrowRight className="w-4 h-4" /></button>
                                            <button className="p-2 text-muted hover:text-main bg-card hover:bg-card rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HRMockUI;
