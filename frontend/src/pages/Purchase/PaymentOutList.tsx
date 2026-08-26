import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { getPayments, updatePaymentStatus } from '../../redux/slices/paymentOutSlice';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, MoreVertical, Filter, Download, ArrowUpRight, Zap, Clock, ShieldCheck, CheckCircle2, XCircle, Search, Info } from 'lucide-react';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { toast } from 'react-toastify';

const PaymentOutList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { payments, loading } = useSelector((state: RootState) => state.paymentOut);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredPayments = payments.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesSearch = p.paymentNo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.supplierId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: payments.length,
        cleared: payments.filter(p => p.status === 'cleared').length,
        pending: payments.filter(p => p.status === 'pending').length,
        totalValue: payments.reduce((sum, p) => sum + p.amount, 0)
    };

    const getStatusBadge = (status: string) => {
        const baseClass = "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5";
        switch (status?.toLowerCase()) {
            case 'cleared':
                return <span className={`${baseClass} bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-success`}><CheckCircle2 className="w-3 h-3" /> Cleared</span>;
            case 'pending':
                return <span className={`${baseClass} bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-warning`}><Clock className="w-3 h-3" /> Pending</span>;
            case 'bounced':
                return <span className={`${baseClass} bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-danger`}><XCircle className="w-3 h-3" /> Bounced</span>;
            default:
                return <span className={`${baseClass} bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400`}>{status}</span>;
        }
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-20">
                <PageHeader
                    title="Institutional Settlement Ledger"
                    description="Execute and track outgoing fiscal nodes for supplier reconciliation."
                    breadcrumbs={[{ label: 'Procurement', link: '/purchase' }, { label: 'Settlement Archive' }]}
                    actions={
                        <button
                            onClick={() => navigate('/purchase/payments/add')}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-3 hover:bg-primary/90 transition hover:scale-105 active:scale-95"
                        >
                            <Plus size={16} /> Record Settlement Node
                        </button>
                    }
                />

                {/* KPI Pulse Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Settlement Nodes', val: stats.total, icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Fiscal Outflow', val: `₹${stats.totalValue.toLocaleString()}`, icon: ArrowUpRight, color: 'text-danger', bg: 'bg-rose-50' },
                        { label: 'Pending Nodes', val: stats.pending, icon: Clock, color: 'text-warning', bg: 'bg-amber-50' },
                        { label: 'Verified (Cleared)', val: stats.cleared, icon: ShieldCheck, color: 'text-primary', bg: 'bg-indigo-50' }
                    ].map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className={`p-4 ${card.bg} ${card.color} rounded-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-2">{card.label}</p>
                                <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase tabular-nums">{card.val}</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        </div>
                    ))}
                </div>

                {/* Audit Control Matrix */}
                <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative w-full md:w-[500px]">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Node Search</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search Payment ID, Vendor, or Ref..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-end gap-6 w-full md:w-auto">
                        <div className="flex-1 md:w-64">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Fiscal State</label>
                            <div className="flex gap-2 p-1.5 bg-neutral-50 dark:bg-neutral-900 rounded-sm border border-neutral-100 dark:border-neutral-800">
                                {['all', 'pending', 'cleared', 'bounced'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterStatus === status
                                            ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm'
                                            : 'text-neutral-400 hover:text-neutral-600'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm text-neutral-400 hover:text-primary transition-all active:scale-95">
                            <Filter className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Settlement Ledger Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5">Settlement ID</th>
                                    <th className="px-8 py-5">Institutional Vendor</th>
                                    <th className="px-8 py-5">Fiscal Date</th>
                                    <th className="px-8 py-5 text-center">Protocol Mode</th>
                                    <th className="px-8 py-5 text-right">Quantum (INR)</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-24 opacity-40 animate-pulse">Synchronizing Ledger...</td></tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30 grayscale max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                    <Info className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-widest text-center">No Records Detected</p>
                                                    <p className="text-xs font-bold mt-2 italic leading-relaxed text-center">No settlement nodes found matching the current search context.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <tr key={payment._id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all cursor-default">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">#{payment.paymentNo}</p>
                                                {payment.referenceNo && <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1 opacity-60">Ref: {payment.referenceNo}</p>}
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">{payment.supplierId?.businessName || 'Unknown Entity'}</p>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                    {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-900 text-[9px] font-black text-neutral-500 uppercase tracking-widest rounded-full">
                                                    {payment.paymentMode}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right whitespace-nowrap text-sm font-black tabular-nums text-neutral-900 dark:text-white">
                                                ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    {getStatusBadge(payment.status || '')}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-3">
                                                    {payment.paymentMode === 'Cheque' && payment.status === 'pending' && (
                                                        <div className="flex items-center gap-2 pr-4 border-r border-neutral-100 dark:border-neutral-800">
                                                            <button
                                                                onClick={() => handleStatusUpdate(payment._id!, 'cleared')}
                                                                className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                                            >
                                                                Clear
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(payment._id!, 'bounced')}
                                                                className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                                            >
                                                                Bounce
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button className="p-2.5 text-neutral-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentOutList;
