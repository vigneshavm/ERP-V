import { useAuthStore } from '@repo/shared';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    Clock,
    FileText,
    ChevronLeft,
    Edit3,
    Shield,
    Briefcase,
    TrendingUp,
    FileCheck,
    History,
    MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { RootState } from "@/app/store/store";
import { Layout, PageHeader } from "@/shared/ui";
import { formatCurrency } from "@/shared/lib/utils/helpers";
import AttendanceCalendar from "./AttendanceCalendar";
import PaymentHistory from "./PaymentHistory";

const EmployeeProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { employees, attendance, payments } = useSelector((state: RootState) => state.labor);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const {  user  } = useAuthStore();

    const employee = employees.find(e => e.id === id || e._id === id);

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ATTENDANCE' | 'PAYROLL' | 'DOCUMENTS'>('OVERVIEW');

    if (!employee) {
        return (
            <Layout>
                <div className="page-shell">
                <div className="h-[80vh] flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mb-6">
                        <User size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-main">Agent Not Found</h2>
                    <p className="text-muted mt-2">The requested neural profile does not exist or has been archived.</p>
                    <button
                        onClick={() => navigate('/people/employees')}
                        className="mt-8 text-blue-600 font-bold flex items-center gap-2 hover:underline"
                    >
                        <ChevronLeft size={20} /> Return to Directory
                    </button>
                </div>
                      </div>

            </Layout>
        );
    }

    interface StatCardProps {
        icon: any;
        label: string;
        value: string | number;
        color: string;
    }

    const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
        <div className="bg-white dark:bg-[var(--erp-card)] p-5 rounded-2xl border border-default dark:border-default shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110`} />
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-4 transition-colors`}>
                <Icon size={20} className={`text-${color}-600`} />
            </div>
            <p className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest leading-none">{label}</p>
            <p className="text-xl font-black text-main mt-1.5">{value}</p>
        </div>
    );

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title={employee.name}
                    description={`Universal Agent Profile // Sector: ${employee.sector || 'N/A'}`}
                    backButton={
                        <button
                            onClick={() => navigate('/people/employees')}
                            className="flex items-center gap-2 text-muted hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest"
                        >
                            <ChevronLeft size={16} /> Back to Directory
                        </button>
                    }
                    actions={
                        <button className="bg-white dark:bg-[var(--erp-card)] text-secondary dark:text-main px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm border border-default dark:border-default hover:border-blue-500 transition-all">
                            <Edit3 size={18} />
                            Modify Profile
                        </button>
                    }
                />

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Lateral Column - Profile Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-[var(--erp-card)] rounded-3xl p-6 shadow-sm border border-default dark:border-default text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10" />
                            <div className="relative pt-4">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-blue-500/30">
                                    {employee.name.charAt(0)}
                                </div>
                                <h3 className="text-xl font-black text-main uppercase tracking-tight">{employee.name}</h3>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{employee.role}</p>

                                <div className="mt-8 space-y-4 px-2">
                                    <div className="flex items-center gap-3 text-sm text-muted group">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] flex items-center justify-center border border-default dark:border-default group-hover:text-blue-500 transition-colors">
                                            <Phone size={14} />
                                        </div>
                                        <span className="font-mono text-xs">{employee.mobile}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted group">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] flex items-center justify-center border border-default dark:border-default group-hover:text-blue-500 transition-colors">
                                            <Mail size={14} />
                                        </div>
                                        <span className="truncate text-xs">{employee.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted group">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] flex items-center justify-center border border-default dark:border-default group-hover:text-blue-500 transition-colors">
                                            <Calendar size={14} />
                                        </div>
                                        <span className="text-xs">Joined {employee.joinedDate ? new Date(employee.joinedDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions / Status */}
                        <div className="bg-[var(--erp-bg)] rounded-3xl p-6 text-main shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                            <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Shield size={12} /> Security Matrix
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-[var(--erp-bg-sunken)] rounded-2xl border border-default">
                                    <span className="text-xs font-bold opacity-70">Access Level</span>
                                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{employee.systemRole || 'Staff'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[var(--erp-bg-sunken)] rounded-2xl border border-default">
                                    <span className="text-xs font-bold opacity-70">PIN Code</span>
                                    <span className="text-xs font-mono font-black tracking-widest">{employee.pin || '****'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Dynamic View */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Tabs */}
                        <div className="flex p-1.5 bg-white dark:bg-[var(--erp-card)] rounded-2xl shadow-sm border border-default dark:border-default overflow-x-auto">
                            {[
                                { id: 'OVERVIEW', label: 'Overview', icon: TrendingUp },
                                { id: 'ATTENDANCE', label: 'Attendance Log', icon: Clock },
                                { id: 'PAYROLL', label: 'Compensation', icon: CreditCard },
                                { id: 'DOCUMENTS', label: 'Documents', icon: FileCheck }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-muted hover:text-secondary dark:hover:text-slate-200'}`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {activeTab === 'OVERVIEW' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* eslint-disable-next-line  */}
                                        <StatCard icon={TrendingUp} label="Month Performance" value="98%" color="emerald" />
                                        {/* eslint-disable-next-line  */}
                                        <StatCard icon={Clock} label="Worked Days" value="22" color="blue" />
                                        {/* eslint-disable-next-line  */}
                                        <StatCard icon={CreditCard} label="Earned Value" value={formatCurrency(employee.baseSalary || employee.dailyRate * 22)} color="indigo" />
                                        {/* eslint-disable-next-line  */}
                                        <StatCard icon={History} label="Pending Due" value={formatCurrency(500)} color="rose" />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-3xl border border-default dark:border-default shadow-sm">
                                            <h4 className="font-bold text-main mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
                                                <Briefcase size={16} className="text-blue-500" /> Professional Details
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-default/50">
                                                    <span className="text-xs font-bold text-muted uppercase tracking-widest">Base Salary</span>
                                                    <span className="text-sm font-black text-secondary dark:text-slate-200">{formatCurrency(employee.baseSalary || 0)} / {employee.wageType?.toLowerCase()}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-default/50">
                                                    <span className="text-xs font-bold text-muted uppercase tracking-widest">Branch Unit</span>
                                                    <span className="text-sm font-black text-secondary dark:text-slate-200">{employee.branchId || 'Headquarters'}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-50 dark:border-default/50">
                                                    <span className="text-xs font-bold text-muted uppercase tracking-widest">Employment Type</span>
                                                    <span className="text-sm font-black text-secondary dark:text-slate-200">Full-Time</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-3xl border border-default dark:border-default shadow-sm">
                                            <h4 className="font-bold text-main mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
                                                <History size={16} className="text-blue-500" /> Recent Life Cycle
                                            </h4>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Joining Confirmed', date: 'Jan 12, 2026', type: 'SYSTEM' },
                                                    { label: 'Module Access Granted', date: 'Jan 13, 2026', type: 'SECURITY' },
                                                    { label: 'Role Escalated to Senior', date: 'Feb 20, 2026', type: 'PROMOTION' }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="w-1.5 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                                        <div>
                                                            <p className="text-sm font-bold text-secondary dark:text-slate-200 leading-none">{item.label}</p>
                                                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1.5">{item.date} // {item.type}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ATTENDANCE' && (
                                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-3xl border border-default dark:border-default shadow-sm">
                                    <AttendanceCalendar
                                        currentMonth={new Date().getMonth()}
                                        currentYear={new Date().getFullYear()}
                                        attendance={attendance}
                                        selectedLaborerId={(employee.id || employee._id) as string}
                                        isSelectionMode={false}
                                        onToggleSelectionMode={() => { }}
                                        selectedDates={new Set()}
                                        onDateClick={() => { }}
                                        onBulkAction={() => { }}
                                    />
                                </div>
                            )}

                            {activeTab === 'PAYROLL' && (
                                <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-3xl border border-default dark:border-default shadow-sm">
                                    <PaymentHistory
                                        payments={payments}
                                        selectedLaborerId={(employee.id || employee._id) as string}
                                        paymentAmount=""
                                        setPaymentAmount={() => { }}
                                        paymentType="ADVANCE"
                                        setPaymentType={() => { }}
                                        paymentNote=""
                                        setPaymentNote={() => { }}
                                        onAddPayment={() => { }}
                                    />
                                </div>
                            )}

                            {activeTab === 'DOCUMENTS' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[
                                        { name: 'Employment_Hub_Contract.pdf', size: '1.2 MB', date: 'Jan 12, 2026' },
                                        { name: 'Kyc_Identification_Docs.zip', size: '4.5 MB', date: 'Jan 12, 2026' },
                                        { name: 'Degree_Certification.pdf', size: '800 KB', date: 'Jan 12, 2026' }
                                    ].map((doc, i) => (
                                        <div key={i} className="bg-white dark:bg-[var(--erp-card)] p-4 rounded-2xl border border-default dark:border-default shadow-sm flex items-center justify-between group hover:border-blue-500/50 transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-main truncate max-w-[150px]">{doc.name}</p>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">{doc.size} // {doc.date}</p>
                                                </div>
                                            </div>
                                            <button className="p-2 text-muted hover:text-blue-600 transition-colors">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EmployeeProfile;
