import { logger } from '@/shared/lib/logger';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import { Plus, Check, X, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import api from "@/shared/api/api";
import { toast } from 'react-toastify';

const RateRevisionList: React.FC = () => {
    const navigate = useNavigate();
    const [revisions, setRevisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRevisions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/purchases/rate-revisions');
            if (data.success) {
                setRevisions(data.data);
            }
        } catch (error) {
            logger.error(error as string | Error);
            toast.error("Failed to load revisions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevisions();
    }, []);

    const handleApprove = async (id: string) => {
        if (!window.confirm("Approve this revision? This will create a Debit Note and update Inventory Cost.")) return;
        try {
            await api.post(`/purchases/rate-revisions/${id}/approve`);
            toast.success("Revision Approved Successfully");
            fetchRevisions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Approval Failed");
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm("Reject this revision?")) return;
        try {
            await api.post(`/purchases/rate-revisions/${id}/reject`);
            toast.info("Revision Rejected");
            fetchRevisions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Rejection Failed");
        }
    };

    return (
        <Layout>
            <PageHeader
                title="Rate Revisions"
                description="Manage retrospective rate changes and margin adjustments"
                breadcrumbs={[{ label: 'Purchase', link: '/purchase' }, { label: 'Rate Revisions' }]}
                actions={
                    <button
                        onClick={() => navigate('/purchase/rate-revisions/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} />
                        New Request
                    </button>
                }
            />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-neutral-500">Loading revisions...</div>
                    ) : revisions.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <Clock className="w-12 h-12 text-neutral-300" />
                            <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">No Revisions Found</h3>
                            <p className="text-neutral-500 text-sm">Create a new request to adjust past purchase rates.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Item & Batch</th>
                                        <th className="px-6 py-4">Supplier</th>
                                        <th className="px-6 py-4 text-center">Rate Change</th>
                                        <th className="px-6 py-4 text-right">Impact</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {revisions.map((rev) => (
                                        <tr key={rev._id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4 text-neutral-500">
                                                {new Date(rev.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-neutral-900 dark:text-white">{rev.itemId?.name || 'Unknown Item'}</div>
                                                <div className="text-xs text-neutral-500 font-mono mt-1">Batch: {rev.batchNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">
                                                {rev.supplierId?.businessName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-neutral-500 line-through">₹{rev.oldRate}</span>
                                                    <ArrowRight size={14} className="text-neutral-400" />
                                                    <span className="font-bold text-indigo-600">₹{rev.newRate}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-bold text-red-600">+₹{rev.diffAmount?.toLocaleString()}</div>
                                                <div className="text-xs text-neutral-400">for {rev.affectedQty} qty</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${rev.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    rev.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {rev.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {rev.status === 'PENDING' && (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(rev._id)}
                                                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(rev._id)}
                                                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                                {rev.status === 'APPROVED' && (
                                                    <div className="text-center text-xs text-green-600 flex items-center justify-center gap-1">
                                                        <Check size={12} /> Done
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default RateRevisionList;
