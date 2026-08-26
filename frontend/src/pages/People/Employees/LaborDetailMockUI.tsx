import React, { useState, useMemo } from 'react';
import { 
    ArrowLeft, Edit3, Trash2, User, Mail, Phone, MapPin, 
    Calendar, Briefcase, DollarSign, PieChart, Activity, 
    Clock, ShieldCheck, Download, MoreVertical, IndianRupee,
    BriefcaseIcon, UserCheck, Zap, Star
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { employees, MockEmployee } from '../../../data';
import Layout from '../../../components/shared/Layout';

const LaborDetailMockUI: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    
    const employee = useMemo(() => {
        return (employees as MockEmployee[]).find(e => e.id === id) || employees[0];
    }, [id]);

    const searchParams = new URLSearchParams(location.search);
    const initialTab = searchParams.get('tab') || 'Work Profile';
    const [activeTab, setActiveTab] = useState(initialTab);

    const kpis = useMemo(() => [
        { label: 'Monthly Remittance', val: `₹${(employee.salary/12).toLocaleString()}`, color: 'text-emerald-500', icon: IndianRupee },
        { label: 'Deployment Term', val: '14 Months', color: 'text-primary', icon: BriefcaseIcon },
        { label: 'Audit Score', val: '9.8/10', color: 'text-amber-500', icon: UserCheck }
    ], [employee]);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/people/employees/labor')}
                            className="w-12 h-12 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm hover:bg-primary hover:text-white transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white">
                                    Personnel <span className="text-primary">Intelligence</span>
                                </h1>
                                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-[10px] font-black text-neutral-400 font-mono tracking-widest uppercase">
                                    NODE_{employee.id.split('-').pop()}
                                </span>
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">Detailed Workforce Analytics // Audit Active</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-rose-500 rounded-sm hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-3 uppercase shadow-sm">
                            <Edit3 className="w-4 h-4 text-primary" /> Modify
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Download className="w-4 h-4" /> Dossier
                        </button>
                    </div>
                </div>

                {/* Profile Grid */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white dark:bg-neutral-900 p-10 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                                <div className="relative mb-8">
                                    <div className="w-28 h-28 rounded-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-2 shadow-xl">
                                        <div className="w-full h-full rounded-sm bg-primary/10 flex items-center justify-center">
                                            <User className="w-14 h-14 text-primary" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-neutral-900 rounded-full shadow-lg" />
                                </div>
                                
                                <h2 className="text-2xl font-display font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{employee.full_name}</h2>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2 italic">{employee.role}</p>
                                
                                <div className="w-full h-px bg-neutral-100 dark:bg-neutral-800 my-8" />
                                
                                <div className="w-full space-y-6">
                                    <div className="flex items-center gap-4 text-left group cursor-pointer">
                                        <div className="w-10 h-10 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Digital Hub</p>
                                            <p className="text-xs font-black text-neutral-600 dark:text-neutral-400 truncate">{employee.full_name.toLowerCase().replace(' ', '.')}@vignesh.erp</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-left group cursor-pointer">
                                        <div className="w-10 h-10 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Mobile Node</p>
                                            <p className="text-xs font-black text-neutral-600 dark:text-neutral-400">+91 98840 00000</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-left group cursor-pointer">
                                        <div className="w-10 h-10 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Deployment Site</p>
                                            <p className="text-xs font-black text-neutral-600 dark:text-neutral-400 truncate">Phase III, Industrial Hub</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center justify-between">
                                    Operational Efficiency <Zap className="w-3.5 h-3.5 text-primary" />
                                </h3>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-neutral-500">Attendance Quotient</span>
                                            <span className="text-emerald-500">98.4%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" style={{ width: '98.4%' }} />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-neutral-500">Task Velocity</span>
                                            <span className="text-primary">92.1%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" style={{ width: '92.1%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3 space-y-8">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {kpis.map((kpi, i) => (
                                    <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-6 shadow-sm group hover:border-primary transition-all cursor-pointer">
                                        <div className={`w-14 h-14 rounded-sm bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center border border-neutral-100 dark:border-neutral-700 group-hover:bg-primary group-hover:text-white transition-all`}>
                                            <kpi.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                            <p className="text-2xl font-display font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">{kpi.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tabs & Details */}
                            <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                                <div className="flex border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                    {['Work Profile', 'Attendance Log', 'Salary History', 'Audit Logs'].map((tab, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-r border-neutral-100 dark:border-neutral-800 ${activeTab === tab ? 'text-primary bg-white dark:bg-neutral-900 border-b-2 border-b-primary shadow-inner' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="p-10 animate-fade-in">
                                    {activeTab === 'Work Profile' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                            <div className="space-y-10">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                                        <ShieldCheck className="w-4 h-4" /> System Governance
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">Access Protocol</span>
                                                            <span className="px-4 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-sm text-[10px] font-black uppercase tracking-widest">SALES_EXEC_v2</span>
                                                        </div>
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">Module Clearance</span>
                                                            <span className="text-emerald-500 flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-emerald-500/5 px-4 py-1.5 border border-emerald-500/10 rounded-sm">
                                                                <ShieldCheck className="w-3.5 h-3.5" /> AUTHORIZED
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">Last Network Sync</span>
                                                            <span className="text-neutral-900 dark:text-white font-mono text-xs font-black uppercase tracking-widest">26-MAY-2026 // 14:02</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                                        <Activity className="w-4 h-4" /> Operational Trace
                                                    </div>
                                                    <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-neutral-100 dark:before:bg-neutral-800">
                                                        {[
                                                            { action: 'Shift Initialized // Counter 04', time: 'Today 08:30 AM' },
                                                            { action: 'Inventory Audit Completed // Section A', time: 'Yesterday 04:45 PM' },
                                                            { action: 'Payroll Verification Finalized', time: '24 May 2026' }
                                                        ].map((log, i) => (
                                                            <div key={i} className="flex items-start gap-6 pl-8 relative group">
                                                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 border-2 border-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] z-10 group-hover:scale-125 transition-transform" />
                                                                <div>
                                                                    <p className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">{log.action}</p>
                                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mt-1 italic">{log.time}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-10">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                                        <Star className="w-4 h-4" /> Expertise Matrix
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        {['Advanced POS Operations', 'Inventory Logic', 'Conflict Resolution', 'GST Compliance', 'Customer Intelligence'].map((skill, i) => (
                                                            <span key={i} className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-5 py-2.5 rounded-sm text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest hover:border-primary hover:text-primary transition-all cursor-default shadow-sm">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-8 bg-primary/[0.03] rounded-sm border border-primary/10 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <Activity className="w-20 h-20" />
                                                    </div>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Executive Feedback</span>
                                                        <div className="flex gap-1.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <div key={s} className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed italic border-l-4 border-primary pl-6 py-2">
                                                        "Demonstrates exceptional aptitude in managing high-volume transactions during peak hours. Consistently accurate in cash reconciliation protocols. Recommended for senior executive audit training."
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab !== 'Work Profile' && (
                                        <div className="p-20 text-center space-y-6">
                                            <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800 rounded-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center mx-auto mb-8">
                                                <Activity className="w-10 h-10 text-neutral-300" />
                                            </div>
                                            <h3 className="text-xl font-display font-black text-neutral-400 uppercase tracking-widest italic">Node Data Sync in Progress</h3>
                                            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.3em]">Centralized Audit Stream for {activeTab.toUpperCase()} is currently restricted.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LaborDetailMockUI;
