import React from 'react';
import { ArrowLeft, Save, X, User, Briefcase, DollarSign, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LaborAddMockUI: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/people/employees/labor')}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-main/70" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Add New Employee
                        </h1>
                        <p className="text-sm text-main/60 mt-1">Personnel Onboarding</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/people/employees/labor')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
                    >
                        <X className="w-4 h-4" /> Cancel
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all text-sm font-bold">
                        <Save className="w-4 h-4" /> Save Record
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                            <div className="flex items-center gap-2 text-purple-400 font-medium pb-2 border-b border-white/5">
                                <User className="w-4 h-4" /> Personal Information
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/20" />
                                        <input 
                                            type="text" 
                                            placeholder="Enter employee name" 
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-main/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Employee ID</label>
                                    <input 
                                        type="text" 
                                        defaultValue="EMP-007"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-main/50 cursor-not-allowed outline-none"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Contact Number</label>
                                    <input 
                                        type="tel" 
                                        placeholder="+1 (555) 000-0000" 
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-main/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Email Address</label>
                                    <input 
                                        type="email" 
                                        placeholder="employee@company.com" 
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-main/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                            <div className="flex items-center gap-2 text-purple-400 font-medium pb-2 border-b border-white/5">
                                <Briefcase className="w-4 h-4" /> Employment Details
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Department</label>
                                    <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all appearance-none cursor-pointer">
                                        <option className="bg-[#0a0a0a]">Engineering</option>
                                        <option className="bg-[#0a0a0a]">Marketing</option>
                                        <option className="bg-[#0a0a0a]">Sales</option>
                                        <option className="bg-[#0a0a0a]">Operations</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Job Role</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Senior Developer" 
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-main/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Joining Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/20" />
                                        <input 
                                            type="date" 
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/20" />
                                        <input 
                                            type="text" 
                                            placeholder="City, Country" 
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-main/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Info */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                            <div className="flex items-center gap-2 text-purple-400 font-medium pb-2 border-b border-white/5">
                                <DollarSign className="w-4 h-4" /> Compensation
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Base Salary (Annual)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-main/40 text-sm">$</span>
                                        <input 
                                            type="number" 
                                            placeholder="85,000" 
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-main/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-main/40 uppercase tracking-wider">Currency</label>
                                    <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all appearance-none cursor-pointer">
                                        <option className="bg-[#0a0a0a]">USD ($)</option>
                                        <option className="bg-[#0a0a0a]">EUR (€)</option>
                                        <option className="bg-[#0a0a0a]">INR (₹)</option>
                                        <option className="bg-[#0a0a0a]">GBP (£)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                            <div className="text-xs font-bold text-main/40 uppercase tracking-wider">Onboarding Checklist</div>
                            {[
                                'Identity Verification',
                                'Tax Documents Signed',
                                'Equipment Provisioned',
                                'System Access Granted'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded border border-white/10 bg-black/20 flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-all">
                                        {i === 0 && <div className="w-2.5 h-2.5 bg-purple-500 rounded-sm shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
                                    </div>
                                    <span className="text-sm text-main/70">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LaborAddMockUI;
