import React, { useMemo } from 'react';
import { ArrowLeft, Save, X, User, Briefcase, IndianRupee, Calendar, MapPin, ShieldCheck, Mail, Phone, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employees, MockEmployee } from '../../data/index';
import Layout from '../../components/shared/Layout/index';

const LaborAddMockUI: React.FC = () => {
    const navigate = useNavigate();

    const departments = useMemo(() => {
        const depts = (employees as MockEmployee[]).map(emp => emp.dept);
        return Array.from(new Set(depts));
    }, []);

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
                            <h1 className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                                Personnel <span className="text-primary">Onboarding</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                                Workforce Expansion // Security Screening
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => navigate('/people/employees/labor')}
                            className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-3 uppercase"
                        >
                            <X className="w-4 h-4 text-rose-500" /> Abort
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Save className="w-4 h-4" /> Finalize Record
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Basic Info */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                    <User className="w-4 h-4" /> Personal Intelligence Node
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Legal Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input 
                                                type="text" 
                                                placeholder="ENTER STAFF IDENTITY..." 
                                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-4 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">System Identifier</label>
                                        <input 
                                            type="text" 
                                            defaultValue={`EMP-${(employees.length + 100).toString()}`}
                                            className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest cursor-not-allowed outline-none"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Communication Node (Phone)</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input 
                                                type="tel" 
                                                placeholder="+91 00000 00000" 
                                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-4 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Digital Mail Gateway</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input 
                                                type="email" 
                                                placeholder="IDENTITY@VIGNESH.ERP" 
                                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-4 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                    <Briefcase className="w-4 h-4" /> Operational Deployment
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Functional Department</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <select className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-8 py-4 text-xs font-black uppercase tracking-widest focus:border-primary outline-none appearance-none cursor-pointer">
                                                {departments.map(dept => (
                                                    <option key={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Organizational Role</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. OPERATIONS ANALYST" 
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm px-6 py-4 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Deployment Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input 
                                                type="date" 
                                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-4 text-xs font-black tracking-widest focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Deployment Site</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input 
                                                type="text" 
                                                placeholder="CHENNAI HQ / INDUSTRIAL PARK..." 
                                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-4 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Info */}
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                    <IndianRupee className="w-4 h-4" /> Compensation Data
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Annual CTC Valuation</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input 
                                                type="number" 
                                                placeholder="0.00" 
                                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-4 text-xs font-black tabular-nums tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Currency Allocation</label>
                                        <select className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm px-6 py-4 text-xs font-black uppercase tracking-widest focus:border-primary outline-none appearance-none cursor-pointer">
                                            <option>INR (₹)</option>
                                            <option>USD ($)</option>
                                            <option>EUR (€)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-4">Pre-Deployment Audit</div>
                                {[
                                    'Government ID Verification',
                                    'Academic Credential Scan',
                                    'Previous Employment Audit',
                                    'NDA & Contract Compliance',
                                    'Biometric Initialization'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-6 h-6 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center transition-all group-hover:border-primary">
                                            {i < 2 && <ShieldCheck className="w-4 h-4 text-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]" />}
                                        </div>
                                        <span className="text-[11px] font-black text-neutral-500 uppercase tracking-widest group-hover:text-primary transition-colors">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LaborAddMockUI;
