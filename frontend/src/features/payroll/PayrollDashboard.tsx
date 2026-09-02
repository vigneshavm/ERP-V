import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchPayrollRuns } from '../../redux/slices/payrollSlice';
import { DollarSign, Users, FileText, PlayCircle, Clock } from 'lucide-react';
import { formatDateISO } from '../../utils/helpers';

const PayrollInfoCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
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

    const stats = {
        lastRun: recentRuns.length > 0 ? formatDateISO(new Date(recentRuns[0].processedDate || recentRuns[0].createdAt)) : 'N/A',
        totalPaidYTD: '₹0.00', // Placeholder
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
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                            >
                                <Users size={18} />
                                Salary Structures
                            </button>
                            <button
                                onClick={() => navigate('/people/payroll/run')}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
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
                        color="bg-blue-500"
                    />
                    <PayrollInfoCard
                        title="Pending Approvals"
                        value={stats.pendingApprovals}
                        icon={FileText}
                        color="bg-amber-500"
                    />
                    <PayrollInfoCard
                        title="Total Paid (YTD)"
                        value={stats.totalPaidYTD}
                        icon={DollarSign}
                        color="bg-emerald-500"
                    />
                </div>

                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Recent Payroll Runs</h3>
                        <button onClick={() => navigate('/people/payroll/history')} className="text-sm text-primary hover:text-indigo-800 font-medium">View All</button>
                    </div>

                    {loading && runs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Loading payroll history...</div>
                    ) : recentRuns.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-3 font-medium">Month/Year</th>
                                    <th className="px-6 py-3 font-medium">Run Date</th>
                                    <th className="px-6 py-3 font-medium">Total Payout</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRuns.map((run) => (
                                    <tr key={run._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {run.periodStart ? new Date(run.periodStart).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {run.processedDate || run.createdAt ? formatDateISO(new Date(run.processedDate || run.createdAt)) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{(run.totalAmount || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${run.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                    run.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {run.status.toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/people/payroll/run/${run._id}`)}
                                                className="text-primary hover:text-indigo-900 text-sm font-medium"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <FileText className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-lg font-medium text-gray-900">No payroll runs found</p>
                            <p className="text-sm mt-1">Get started by running your first payroll.</p>
                            <button
                                onClick={() => navigate('/people/payroll/run')}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
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
