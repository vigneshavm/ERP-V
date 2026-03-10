import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from "@/app/store/store";
import { getPayments, updatePaymentStatus } from "@/app/store/slices/paymentOutSlice";
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, MoreVertical, Filter, Download } from 'lucide-react';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import { toast } from 'react-toastify';

const PaymentOutList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { payments, loading } = useSelector((state: RootState) => state.paymentOut);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        dispatch(getPayments());
    }, [dispatch]);

    const handleStatusUpdate = async (id: string, status: string) => {
        if (window.confirm(`Are you sure you want to mark this payment as ${status}?`)) {
            const res = await dispatch(updatePaymentStatus({ id, status }));
            if (updatePaymentStatus.fulfilled.match(res)) {
                toast.success(`Payment marked as ${status}`);
            } else {
                toast.error('Failed to update status');
            }
        }
    };

    const filteredPayments = payments.filter(p => filterStatus === 'all' || p.status === filterStatus);

    return (
        <Layout>
            <PageHeader
                title="Supplier Payments"
                description="Track and manage all outgoing payments to suppliers"
                breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Purchases', link: '/purchase' }, { label: 'Payments' }]}
                actions={
                    <button
                        onClick={() => navigate('/purchase/payments/add')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} />
                        Record Payment
                    </button>
                }
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex gap-2">
                        {['all', 'pending', 'cleared', 'bounced'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${filterStatus === status
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Payment No</th>
                                <th className="px-6 py-4">Structure</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No records found</td></tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                                            {payment.paymentNo}
                                            {payment.referenceNo && <div className="text-xs text-slate-400">{payment.referenceNo}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{payment.supplierId?.businessName || 'Unknown Supplier'}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                                                {payment.paymentMode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                                            ₹{payment.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${payment.status === 'cleared' ? 'bg-emerald-100 text-emerald-600' :
                                                payment.status === 'bounced' ? 'bg-red-100 text-red-600' :
                                                    payment.status === 'cancelled' ? 'bg-slate-200 text-slate-600' :
                                                        'bg-amber-100 text-amber-600'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {payment.paymentMode === 'Cheque' && payment.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(payment._id!, 'cleared')}
                                                            className="text-xs text-emerald-600 font-bold hover:underline"
                                                        >
                                                            Clear
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(payment._id!, 'bounced')}
                                                            className="text-xs text-red-600 font-bold hover:underline"
                                                        >
                                                            Bounce
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentOutList;
