import React, { useState } from 'react';
import { 
    ArrowLeft, Edit3, Trash2, User, Mail, Phone, MapPin, 
    Calendar, Briefcase, DollarSign, PieChart, Activity, 
    Clock, ShieldCheck, Download, MoreVertical
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import laborDetailData from '../../../mockData/laborDetailData.json';

const LaborDetailMockUI: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    
    // Read active tab from URL query params
    const searchParams = new URLSearchParams(location.search);
    const initialTab = searchParams.get('tab') || 'Work Profile';
    const [activeTab, setActiveTab] = useState(initialTab);

    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState(laborDetailData.profile);

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header / Top Bar */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/people/employees/labor')}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-main/70" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Employee Profile
                            </h1>
                            <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-main/40 font-mono">
                                {id || 'EMP-001'}
                            </span>
                        </div>
                        <p className="text-sm text-main/60 mt-1">Detailed Personnel Analytics</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="p-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {isEditing ? (
                        <>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all text-sm font-medium"
                            >
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
                        >
                            <Edit3 className="w-4 h-4" /> Edit Profile
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-sm font-medium">
                        <Download className="w-4 h-4" /> Download Report
                    </button>
                </div>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Left Column: Avatar & Basic Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-panel p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                    <div className="w-full h-full rounded-xl bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                                        <User className="w-12 h-12 text-purple-400" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                            </div>
                            
                            {isEditing ? (
                                <input 
                                    className="text-xl font-bold mt-4 text-center bg-black/20 border border-white/10 rounded px-2 py-1 outline-none focus:border-purple-500 w-full text-main"
                                    value={profileData.name}
                                    onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                                />
                            ) : (
                                <h2 className="text-xl font-bold mt-4 text-main">{profileData.name}</h2>
                            )}
                            
                            {isEditing ? (
                                <input 
                                    className="text-sm font-medium mt-2 text-center bg-black/20 border border-white/10 rounded px-2 py-1 outline-none focus:border-purple-500 w-full text-purple-400"
                                    value={profileData.role}
                                    onChange={e => setProfileData(p => ({ ...p, role: e.target.value }))}
                                />
                            ) : (
                                <p className="text-purple-400 text-sm font-medium">{profileData.role}</p>
                            )}
                            
                            <div className="w-full h-px bg-white/5 my-6" />
                            
                            <div className="w-full space-y-4">
                                <div className="flex items-center gap-3 text-sm text-main/60">
                                    <Mail className="w-4 h-4 text-purple-400/70 shrink-0" />
                                    {isEditing ? (
                                        <input 
                                            className="bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded px-2 py-1 outline-none focus:border-purple-500 flex-1 min-w-0 text-main"
                                            value={profileData.email}
                                            onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}
                                        />
                                    ) : (
                                        <span className="truncate">{profileData.email}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-main/60">
                                    <Phone className="w-4 h-4 text-purple-400/70 shrink-0" />
                                    {isEditing ? (
                                        <input 
                                            className="bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded px-2 py-1 outline-none focus:border-purple-500 flex-1 min-w-0 text-main"
                                            value={profileData.phone}
                                            onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))}
                                        />
                                    ) : (
                                        <span className="truncate">{profileData.phone}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-main/60">
                                    <MapPin className="w-4 h-4 text-purple-400/70 shrink-0" />
                                    {isEditing ? (
                                        <input 
                                            className="bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded px-2 py-1 outline-none focus:border-purple-500 flex-1 min-w-0 text-main"
                                            value={profileData.location}
                                            onChange={e => setProfileData(p => ({ ...p, location: e.target.value }))}
                                        />
                                    ) : (
                                        <span className="truncate">{profileData.location}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                            <h3 className="text-xs font-bold text-main/40 uppercase tracking-widest">Performance Metrics</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-main/60">Attendance Rate</span>
                                        <span className="text-emerald-400 font-bold">{laborDetailData.performance.attendance}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: laborDetailData.performance.attendance }} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-main/60">Task Efficiency</span>
                                        <span className="text-purple-400 font-bold">{laborDetailData.performance.efficiency}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" style={{ width: laborDetailData.performance.efficiency }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle & Right: Detailed Info */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {laborDetailData.kpis.map((kpi, i) => (
                                <div key={i} className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${kpi.color}`}>
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-main/30 uppercase tracking-wider">{kpi.label}</p>
                                        <p className="text-xl font-bold text-main">{kpi.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Detailed Tabs (Mock) */}
                        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                            <div className="flex border-b border-white/5 bg-white/[0.02]">
                                {['Work Profile', 'Attendance Log', 'Salary History', 'Documents'].map((tab, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-4 text-sm font-medium transition-all ${activeTab === tab ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-main/40 hover:text-main/60'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            
                            {activeTab === 'Work Profile' && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-main/30 uppercase tracking-widest">
                                                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> System & Security
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-main/60">System Role</span>
                                                    <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 text-xs font-bold">SALES_STAFF</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-main/60">POS Access</span>
                                                    <span className="text-emerald-400 flex items-center gap-1 font-bold"><ShieldCheck className="w-3.5 h-3.5" /> Active</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-main/60">Last Login</span>
                                                    <span className="text-main/80 font-mono">2026-04-26 10:45 AM</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-main/30 uppercase tracking-widest">
                                                <Activity className="w-3.5 h-3.5 text-blue-500" /> Recent Activity
                                            </div>
                                            <div className="space-y-4">
                                                {laborDetailData.activity.map((log, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                                                        <div>
                                                            <p className="text-sm text-main/80 font-medium">{log.action}</p>
                                                            <p className="text-[10px] text-main/40 uppercase tracking-tighter mt-0.5">{log.time}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-main/30 uppercase tracking-widest">
                                                <PieChart className="w-3.5 h-3.5 text-pink-500" /> Skills & Expertise
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {laborDetailData.skills.map((skill, i) => (
                                                    <span key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-main/70 hover:border-purple-500/30 hover:text-purple-400 transition-all cursor-default">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-xs font-bold text-purple-400 uppercase">Manager Feedback</span>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <div key={s} className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-main/70 leading-relaxed italic">
                                                "{laborDetailData.feedback}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Attendance Log' && (
                                <div className="p-6 animate-fade-in">
                                    <h3 className="text-xs font-bold text-main/40 uppercase tracking-widest mb-4">Past Attendance Records (April 2026)</h3>
                                    <div className="overflow-x-auto rounded-xl border border-white/5">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-black/20 border-b border-white/5">
                                                <tr>
                                                    <th className="p-4 font-medium text-main/60">Date</th>
                                                    <th className="p-4 font-medium text-main/60">Status</th>
                                                    <th className="p-4 font-medium text-main/60">Check In</th>
                                                    <th className="p-4 font-medium text-main/60">Check Out</th>
                                                    <th className="p-4 font-medium text-main/60 text-right">Overtime</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                                                {laborDetailData.attendanceLog.map((log, i) => (
                                                    <tr key={i} className="hover:bg-white/[0.04] transition-colors">
                                                        <td className="p-4 font-mono text-main/80">{log.date}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${
                                                                log.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                log.status === 'HALF' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                log.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            }`}>{log.status}</span>
                                                        </td>
                                                        <td className="p-4 font-mono text-emerald-400/80">{log.in}</td>
                                                        <td className="p-4 font-mono text-amber-400/80">{log.out}</td>
                                                        <td className="p-4 font-mono text-main/60 text-right">{log.ot} Hrs</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'Work Profile' && activeTab !== 'Attendance Log' && (
                                <div className="p-12 text-center">
                                    <p className="text-main/40 italic">This section ({activeTab}) is under construction.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LaborDetailMockUI;
