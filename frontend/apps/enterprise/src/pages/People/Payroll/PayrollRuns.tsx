import { logger } from '@/shared/lib/logger';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import { RootState, AppDispatch } from "@/app/store/store";
import { fetchPayrollRuns, generatePayrollRun } from "@/entities/people/model/payrollSlice";
import { PlayCircle, Eye, Printer, Trash2 } from 'lucide-react';
import { formatDateISO } from "@/shared/lib/utils/helpers";
import api from "@/shared/api/api";

const PayrollRuns = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { runs, loading, success } = useSelector((state: RootState) => state.payroll);

    // Generate Dialog
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

    useEffect(() => {
        dispatch(fetchPayrollRuns());
    }, [dispatch]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
        if (success) setIsGenerateOpen(false);
    }, [success]);

    const { id } = useParams<{ id: string }>();
    const [runDetails, setRunDetails] = useState<any>(null);
    const [payslips, setPayslips] = useState<any[]>([]);

    // Fetch Run Details if ID is present
    useEffect(() => {
        if (id) {
            const fetchDetails = async () => {
                try {
                    const response = await api.get(`/hr/payroll/runs/${id}`);
                    setRunDetails(response.data.data.run);
                    setPayslips(response.data.data.payslips || []);
                } catch (e) {
                    logger.error("Failed to fetch run details", e);
                }
            };
            fetchDetails();
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
            setRunDetails(null);
            dispatch(fetchPayrollRuns());
        }
    }, [id, dispatch]);

    const handleGenerate = () => {
        dispatch(generatePayrollRun(selectedDate));
    };

    if (id && runDetails) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <PageHeader
                        title={`Payroll Run: ${new Date(0, runDetails.month).toLocaleString('default', { month: 'long' })} ${runDetails.year}`}
                        description={`Status: ${runDetails.status} | Generated: ${runDetails.processedDate || runDetails.createdAt ? formatDateISO(new Date(runDetails.processedDate || runDetails.createdAt)) : 'N/A'}`}
                        breadcrumbs={[
                            { label: 'Payroll', link: '/people/payroll' },
                            { label: 'Runs', link: '/people/payroll/run' },
                            { label: 'Details' }
                        ]}
                    />
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Employee Payslips ({payslips.length})</h3>
                            <div className="flex gap-2">
                                {runDetails.status === 'DRAFT' && (
                                    <button
                                        onClick={async () => {
                                            if (confirm('Are you sure you want to approve this payroll?')) {
                                                await api.put(`/hr/payroll/runs/${id}/approve`);
                                                // Refresh
                                                const response = await api.get(`/hr/payroll/runs/${id}`);
                                                setRunDetails(response.data.data.run);
                                            }
                                        }}
                                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                    >
                                        Approve Run
                                    </button>
                                )}
                                {runDetails.status === 'APPROVED' && (
                                    <button
                                        onClick={async () => {
                                            const accountId = prompt('Enter Account ID (Placeholder UI):');
                                            if (accountId) {
                                                await api.post(`/hr/payroll/runs/${id}/pay`, { accountId, paymentMode: 'CASH' });
                                                // Refresh
                                                const response = await api.get(`/hr/payroll/runs/${id}`);
                                                setRunDetails(response.data.data.run);
                                            }
                                        }}
                                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                                    >
                                        Mark as Paid
                                    </button>
                                )}
                                <button className="p-2 text-gray-400 hover:text-gray-600">
                                    <Printer size={18} />
                                </button>
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-3 font-medium">Employee</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
                                    <th className="px-6 py-3 font-medium text-right">Net Pay</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payslips.map(p => (
                                    <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{p.employeeId?.name || 'Unknown'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{p.employeeId?.role || 'Staff'}</td>
                                        <td className="px-6 py-3 text-right font-medium text-gray-900">₹{p.netPay.toLocaleString()}</td>
                                        <td className="px-6 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {p.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => navigate(`/people/payroll/payslip/${p._id}`, { state: { payslip: p } })}
                                                className="text-indigo-600 hover:underline text-sm font-medium"
                                            >
                                                View Slip
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Layout >
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title="Payroll Runs"
                    description="History of all generated payrolls."
                    breadcrumbs={[
                        { label: 'Payroll', link: '/people/payroll' },
                        { label: 'Runs' }
                    ]}
                    actions={
                        <button
                            onClick={() => setIsGenerateOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <PlayCircle size={18} />
                            Generate New Payroll
                        </button>
                    }
                />

                {isGenerateOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Run Payroll</h3>
                            <p className="text-sm text-gray-500 mb-6">Select the period for which you want to generate the payroll. This will calculate salaries based on attendance and structure.</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Month</label>
                                    <select
                                        className="w-full p-2 border rounded-lg bg-gray-50"
                                        value={selectedDate.month}
                                        onChange={(e) => setSelectedDate({ ...selectedDate, month: parseInt(e.target.value) })}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Year</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg bg-gray-50"
                                        value={selectedDate.year}
                                        onChange={(e) => setSelectedDate({ ...selectedDate, year: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsGenerateOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Run Payroll'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {runs.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-4 font-medium">Period</th>
                                    <th className="px-6 py-4 font-medium">Run Date</th>
                                    <th className="px-6 py-4 font-medium">Total Payout</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {runs.map((run) => (
                                    <tr key={run._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {run.periodStart ? new Date(run.periodStart).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Run Date: {run.processedDate || run.createdAt ? formatDateISO(new Date(run.processedDate || run.createdAt)) : 'N/A'}
                                                </div>
                                            </div>
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
                                        <td className="px-6 py-4 flex justify-end gap-3 text-gray-400">
                                            <button
                                                title="View Details"
                                                onClick={() => navigate(`/people/payroll/run/${run._id}`)}
                                                className="hover:text-indigo-600 transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button className="hover:text-gray-600 transition-colors" title="Print Reports">
                                                <Printer size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            No payroll runs found. Click "Generate" to start.
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PayrollRuns;
