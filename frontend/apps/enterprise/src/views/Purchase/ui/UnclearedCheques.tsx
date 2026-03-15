import { logger } from '@/shared/lib/logger';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import { updatePaymentStatus } from '@/app/store/slices/paymentOutSlice'; // We need to ensure this action exists and calls the patch endpoint
import api from '@/shared/api/api';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import { CheckCircle, XCircle, Clock, Calendar, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const UnclearedCheques: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [cheques, setCheques] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCheques = async () => {
        setLoading(true);
        try {
            // Fetch all payments and filter for pending cheques
            // Ideally backend should support ?status=pending&mode=Cheque filtering
            const { data } = await api.get('/purchase-payments');
            if (data && data.success) {
                const pending = data.data.filter((p: any) =>
                    p.paymentMode === 'Cheque' && p.status === 'pending'
                );
                setCheques(pending);
            }
        } catch (err) {
            logger.error("Failed to fetch cheques", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheques();
    }, []);

    const handleStatusUpdate = async (id: string, status: 'cleared' | 'bounced', reason?: string) => {
        if (!window.confirm(`Are you sure you want to mark this cheque as ${status.toUpperCase()}?`)) return;

        try {
            await api.patch(`/api/purchase-payments/${id}/status`, { status, bounceReason: reason });
            toast.success(`Cheque marked as ${status}`);
            fetchCheques(); // Refresh list
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to update status`);
        }
    };

    // Derived state for filtering
    const filteredCheques = cheques.filter(c =>
        c.supplierId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.paymentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPending = filteredCheques.reduce((sum, c) => sum + c.amount, 0);

    return (
        <Layout>
            <PageHeader
                title="Uncleared Cheques (PDC)"
                description="Manage post-dated cheques and their clearance status"
                breadcrumbs={[{ label: 'Payments', link: '/purchase/payments' }, { label: 'PDC Vault' }]}
            />

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Stats / Search Bar */}
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-neutral-500 uppercase">Total in Vault</p>
                            <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">₹{totalPending.toLocaleString()}</h2>
                        </div>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by Vendor, Chq No, Payment ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Cheque List */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-8 text-center text-neutral-500">Loading vault...</div>
                    ) : filteredCheques.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <CheckCircle className="w-12 h-12 text-green-500/20 text-green-500" />
                            <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">All Clear!</h3>
                            <p className="text-neutral-500 text-sm">No uncleared cheques found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Issue Date</th>
                                        <th className="px-6 py-4">Cheque Date (Due)</th>
                                        <th className="px-6 py-4">Details</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {filteredCheques.map(cheque => {
                                        const isDue = new Date(cheque.chequeDate) <= new Date();
                                        const daysToClear = Math.ceil((new Date(cheque.chequeDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

                                        return (
                                            <tr key={cheque._id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="px-6 py-4 text-neutral-500">
                                                    {new Date(cheque.paymentDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className={`w-4 h-4 ${isDue ? 'text-red-500' : 'text-indigo-500'}`} />
                                                        <span className={`font-bold ${isDue ? 'text-red-700 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                            {new Date(cheque.chequeDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {!isDue && <span className="text-xs text-neutral-400 mt-1 block">In {daysToClear} days</span>}
                                                    {isDue && <span className="text-xs text-red-500 font-bold mt-1 block flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Due Now</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-neutral-900 dark:text-white">{cheque.supplierId?.businessName || 'Unknown Vendor'}</div>
                                                    <div className="text-xs text-neutral-500 flex items-center gap-2 mt-1">
                                                        <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600">{cheque.referenceNo}</span>
                                                        <span>•</span>
                                                        <span>{cheque.bankName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-bold text-lg">₹{cheque.amount.toLocaleString()}</div>
                                                    <div className="text-xs text-neutral-400">{cheque.paymentNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(cheque._id, 'cleared')}
                                                            title="Mark as Cleared"
                                                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt("Enter reason for bounce (e.g. Insufficient Funds):");
                                                                if (reason) handleStatusUpdate(cheque._id, 'bounced', reason);
                                                            }}
                                                            title="Mark as Bounced"
                                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default UnclearedCheques;
