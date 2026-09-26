import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchPayrollRuns } from '../../redux/slices/payrollSlice';
import { DollarSign, Users, FileText, PlayCircle, Clock } from 'lucide-react';
import { formatDateISO } from '../../utils/helpers';
import StatusBadge from '@/components/shared/UI/StatusBadge';

const PayrollInfoCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const PayrollDashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { runs, loading } = useSelector((state: RootState) => state.payroll);
    const { user: _user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(fetchPayrollRuns());
    }, [dispatch]);

    const recentRuns = [...runs].sort((a, b) => new Date(b.processedDate || b.createdAt).getTime() - new Date(a.processedDate || a.createdAt).getTime()).slice(0, 5);

    const now = new Date();
    const fyStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);

    const stats = {
        lastRun: recentRuns.length > 0 ? formatDateISO(new Date(recentRuns[0].processedDate || recentRuns[0].createdAt)) : 'N/A',
        // Paid runs whose period starts in the current financial year (April to March).
        totalPaidYTD: `₹${runs
            .filter(r => r.status === 'PAID' && r.periodStart && new Date(r.periodStart) >= fyStart)
            .reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)
            .toLocaleString('en-IN')}`,
        pendingApprovals: runs.filter(r => r.status === 'DRAFT').length
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title="Payroll Management"
                    description="Manage salaries, generate payslips, and track payroll history."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Payroll' }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/people/payroll/structure')}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                            >
                                <Users size={18} />
                                Salary Structures
                            </button>
                            <button
                                onClick={() => navigate('/people/payroll/run')}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                            >
                                <PlayCircle size={18} />
                                Run Payroll
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <PayrollInfoCard
                        title="Last Payroll Run"
                        value={stats.lastRun}
                        icon={Clock}
                        color="bg-primary"
                    />
                    <PayrollInfoCard
                        title="Pending Approvals"
                        value={stats.pendingApprovals}
                        icon={FileText}
                        color="bg-warning"
                    />
                    <PayrollInfoCard
                        title="Total Paid (this FY)"
                        value={stats.totalPaidYTD}
                        icon={DollarSign}
                        color="bg-success"
                    />
                </div>

                <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Recent Payroll Runs</h3>
                        <button onClick={() => navigate('/people/payroll/history')} className="text-sm text-primary hover:text-primary font-medium">View All</button>
                    </div>

                    {loading && runs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Loading payroll history...</div>
                    ) : recentRuns.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-3 font-medium">Month/Year</th>
                                    <th className="px-6 py-3 font-medium">Run Date</th>
                                    <th className="px-6 py-3 font-medium">Total Payout</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRuns.map((run) => (
                                    <tr key={run._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {run.periodStart ? new Date(run.periodStart).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {run.processedDate || run.createdAt ? formatDateISO(new Date(run.processedDate || run.createdAt)) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">₹{(run.totalAmount || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={run.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/people/payroll/run/${run._id}`)}
                                                className="text-primary hover:text-primary text-sm font-medium"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                            <FileText className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="text-lg font-medium text-slate-900">No payroll runs found</p>
                            <p className="text-sm mt-1">Get started by running your first payroll.</p>
                            <button
                                onClick={() => navigate('/people/payroll/run')}
                                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium"
                            >
                                Run Payroll
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PayrollDashboard;
