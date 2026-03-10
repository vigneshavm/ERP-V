import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    Calendar, 
    DollarSign, 
    Users, 
    FileText, 
    PlayCircle, 
    Clock, 
    TrendingUp, 
    ArrowUpRight,
    ChevronRight,
    Loader2,
    CalendarCheck,
    History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../../components/shared/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { RootState, AppDispatch } from "@/app/store/store";
import { fetchPayrollRuns } from "@/entities/people/model/payrollSlice";
import { formatDateISO, formatCurrency } from "@/shared/lib/utils/helpers";

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
                <Icon size={24} />
            </div>
            {subtext && (
                <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                    <TrendingUp size={12} />
                    {subtext}
                </div>
            )}
        </div>
        <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 uppercase tracking-tight">{value}</h3>
        </div>
    </motion.div>
);

const PayrollDashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { runs, loading } = useSelector((state: RootState) => state.payroll);

    useEffect(() => {
        dispatch(fetchPayrollRuns());
    }, [dispatch]);

    const recentRuns = useMemo(() => {
        return [...runs].sort((a, b) => new Date(b.processedDate || b.createdAt).getTime() - new Date(a.processedDate || a.createdAt).getTime()).slice(0, 5);
    }, [runs]);

    const stats = useMemo(() => ({
        lastRun: recentRuns.length > 0 ? formatDateISO(new Date(recentRuns[0].processedDate || recentRuns[0].createdAt)) : 'N/A',
        totalPaidYTD: runs.filter(r => r.status === 'PAID').reduce((acc, r) => acc + (r.totalAmount || 0), 0),
        pendingApprovals: runs.filter(r => r.status === 'DRAFT').length
    }), [runs, recentRuns]);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title="Vortex Payroll Matrix"
                    description="Industrial-grade compensation engine for neural organization management."
                    breadcrumbs={[
                        { label: 'Cloud Hub', link: '/dashboard' },
                        { label: 'Payroll Console' }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/people/payroll/structure')}
                                className="bg-white dark:bg-slate-800 text-slate-700 dark:text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all active:scale-95"
                            >
                                <CalendarCheck size={18} className="text-blue-500" />
                                Salary Matrix
                            </button>
                            <button
                                onClick={() => navigate('/people/payroll/run')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                <PlayCircle size={18} />
                                Execute Run
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <StatCard
                        title="Neural Last Cycle"
                        value={stats.lastRun}
                        icon={Clock}
                        color="blue"
                    />
                    <StatCard
                        title="Quantum Approval Pending"
                        value={stats.pendingApprovals}
                        icon={FileText}
                        color="amber"
                    />
                    <StatCard
                        title="Total Value Dispatched (YTD)"
                        value={formatCurrency(stats.totalPaidYTD)}
                        subtext="+12.5%"
                        icon={DollarSign}
                        color="emerald"
                    />
                </div>

                <div className="mt-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white/30 dark:bg-slate-900/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <HistoryIcon size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Recent Temporal Cycles</h3>
                        </div>
                        <button 
                            onClick={() => navigate('/people/payroll/history')} 
                            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.2em] flex items-center gap-2"
                        >
                            Log History <ArrowUpRight size={14} />
                        </button>
                    </div>

                    {loading && runs.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Payment Nexus...</p>
                        </div>
                    ) : recentRuns.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase tracking-[0.2em]">
                                        <th className="px-8 py-4 font-black">Temporal Period</th>
                                        <th className="px-8 py-4 font-black">Dispatch Date</th>
                                        <th className="px-8 py-4 font-black">Quantum Payout</th>
                                        <th className="px-8 py-4 font-black">Nexus Status</th>
                                        <th className="px-8 py-4 font-black text-right">Access</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRuns.map((run) => (
                                        <tr key={run._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                                            <td className="px-8 py-5 text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                                {run.periodStart ? new Date(run.periodStart).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'}
                                            </td>
                                            <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                                                {run.processedDate || run.createdAt ? formatDateISO(new Date(run.processedDate || run.createdAt)) : 'N/A'}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-black text-slate-800 dark:text-white">
                                                {formatCurrency(run.totalAmount || 0)}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border
                                                    ${run.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                        run.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                            'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                                                    {run.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => navigate(`/people/payroll/run/${run._id}`)}
                                                    className="p-2 text-slate-400 group-hover:text-blue-500 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-24 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
                                <DollarSign size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Nexus Offline</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2 text-sm leading-relaxed uppercase tracking-widest text-[10px] font-black">No payroll cycles detected in the current matrix.</p>
                            <button
                                onClick={() => navigate('/people/payroll/run')}
                                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Initiate Genesis Run
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PayrollDashboard;
