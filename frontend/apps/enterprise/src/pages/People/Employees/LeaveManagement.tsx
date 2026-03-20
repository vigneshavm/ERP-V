import { useAuthStore } from '@repo/shared';
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Plus,
    Filter,
    ArrowRight,
    User,
    Info,
    CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from "@/app/store/store";
import { fetchLeaves, createLeaveRequest } from "@/entities/people/model/laborSlice";
import { Layout, PageHeader } from "@/shared/ui";
import { LeaveRequest, LeaveType } from "@/entities/people/model/hr";

const LeaveManagement: React.FC = () => {
    const dispatch = useDispatch();
    const { leaves, employees } = useSelector((state: RootState) => state.labor);
    const {  user  } = useAuthStore();

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

    useEffect(() => {
        dispatch(fetchLeaves() as any);
    }, [dispatch]);

    const filteredLeaves = useMemo(() => {
        if (filterStatus === 'ALL') return leaves;
        return leaves.filter(l => l.status === filterStatus);
    }, [leaves, filterStatus]);

    const LeaveCard = ({ leave }: { leave: LeaveRequest }) => {
        const employee = employees.find(e => e.id === leave.employeeId || e._id === leave.employeeId);

        const statusColors = {
            'PENDING': 'bg-amber-500/10 text-amber-600 border-amber-200/50',
            'APPROVED': 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
            'REJECTED': 'bg-rose-500/10 text-rose-600 border-rose-200/50',
            'CANCELLED': 'bg-slate-500/10 text-slate-600 border-slate-200/50'
        };

        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-all group"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-500">
                            <User size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{employee?.name || 'Unknown Agent'}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{employee?.role || 'N/A'}</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColors[leave.status]}`}>
                        {leave.status}
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-6">
                    <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <CalendarDays size={12} className="text-blue-500" /> Duration
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">{new Date(leave.startDate).toLocaleDateString()}</span>
                            <ArrowRight size={12} className="text-slate-400" />
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">{new Date(leave.endDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest">{leave.totalDays} Work Days</p>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Classification: <span className="text-slate-600 dark:text-slate-300">{leave.leaveType}</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-lg italic">
                        "{leave.reason}"
                    </p>
                </div>

                {leave.status === 'PENDING' && user?.role !== 'Staff' && (
                    <div className="mt-6 flex items-center gap-2">
                        <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                            Authorize
                        </button>
                        <button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-500/20">
                            Reject
                        </button>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title="Vortex Leave System"
                    description="Advanced leave lifecycle management with neural approval workflows."
                    actions={
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            Request Leave
                        </button>
                    }
                    breadcrumbs={[
                        { label: 'People', link: '/people' },
                        { label: 'Leave Management' }
                    ]}
                />

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Lateral Column - Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Info size={14} /> Leave Inventory
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { label: 'Sick Leave', used: 2, total: 12, color: 'rose' },
                                    { label: 'Casual Leave', used: 5, total: 10, color: 'blue' },
                                    { label: 'Earned Leave', used: 15, total: 30, color: 'emerald' }
                                ].map((type, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span>{type.label}</span>
                                            <span className="opacity-60">{type.used}/{type.total}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-${type.color}-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]`}
                                                style={{ width: `${(type.used / type.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Filter size={14} /> Filter Portal
                            </h4>
                            <div className="space-y-2">
                                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status as any)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                                    >
                                        {status} REQUESTS
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="popLayout">
                            {filteredLeaves.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-40 flex flex-col items-center justify-center text-center bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700"
                                >
                                    <Calendar className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6 opacity-30" />
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Temporal Silence</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2 text-sm leading-relaxed">No leave requests found in the current temporal slice.</p>
                                </motion.div>
                            ) : (
                                <motion.div layout className="grid md:grid-cols-2 gap-6">
                                    {filteredLeaves.map(leave => (
                                        <LeaveCard key={leave.id || leave._id} leave={leave} />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LeaveManagement;
