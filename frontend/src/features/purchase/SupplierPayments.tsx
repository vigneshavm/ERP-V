
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import StatsCard from "../../components/shared/Display/StatsCard";
import {
    CreditCard, Filter, Clock,
    CheckCircle, AlertCircle, DollarSign, ChevronRight,
    Search as SearchIcon, Calendar, ArrowUpRight
} from 'lucide-react';
import api from "../../services/api";
import { PurchasePayment, PurchasePaymentStatus as PaymentStatus } from "../../types/purchase";
import StatusBadge from '@/components/shared/UI/StatusBadge';

const SupplierPayments: React.FC = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<PurchasePayment[]>([]);
    const [_isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchPayments = async () => {
            setIsLoading(true);
            setLoadError('');
            try {
                const response = await api.get('/api/purchase-payments');
                const raw = response.data;
                // Normalize: handle array, { data: [] }, { payments: [] }, { results: [] }, or null
                const list = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.data)
                    ? raw.data
                    : Array.isArray(raw?.payments)
                    ? raw.payments
                    : Array.isArray(raw?.results)
                    ? raw.results
                    : [];
                setPayments(list);
            } catch (err) {
                console.error("Failed to fetch payments", err);
                // No sample fallback: show that loading failed rather than payments that don't exist.
                setPayments([]);
                const e = err as { response?: { data?: { message?: string } } };
                setLoadError(e?.response?.data?.message || 'Could not load supplier payments. Check your connection and refresh.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const getStatusBadge = (status: PaymentStatus) => <StatusBadge status={status} />;

    const formatPaymentMethod = (method: PurchasePayment['method']) => {
        switch (method) {
            case 'bank_transfer':
                return 'Bank Transfer';
            case 'credit_card':
                return 'Credit Card';
            case 'cheque':
                return 'Cheque';
            case 'cash':
                return 'Cash';
            case 'other':
                return 'Other';
            default:
                return method;
        }
    };

    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const matchesSearch =
                (p.payment_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.reference_id || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [payments, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const totalAmount = payments.filter(p => p.status !== 'Reversed').reduce((sum, p) => sum + (Number(p.total_amount) || Number((p as any).totalAmount) || Number((p as any).amount) || 0), 0);
        const pendingAmount = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (Number(p.total_amount) || Number((p as any).totalAmount) || Number((p as any).amount) || 0), 0);

        return {
            totalCount: payments.length,
            totalSettled: totalAmount - pendingAmount,
            pendingAmount,
            clearedCount: payments.filter(p => p.status === 'Cleared').length
        };
    }, [payments]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    return (
        <Layout>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <PageHeader
                    title="Supplier Payments"
                    description="Process settlements for supplier bills, manage payment advice, and track clearing status."
                    actions={
                        <button
                            onClick={() => navigate('/purchase/payment-out')}
                            className="btn btn-primary bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/20 px-6"
                        >
                            <CreditCard className="w-4 h-4" />
                            Record Payment
                        </button>
                    }
                />
                {loadError && (
                    <div role="alert" className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {loadError}
                    </div>
                )}

                {/* KPI Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Outflow"
                        value={formatCurrency(stats.totalSettled + stats.pendingAmount)}
                        icon={<ArrowUpRight className="w-full h-full text-red-500" />}
                        iconBgColor="bg-red-50"
                        iconColor="text-red-600"
                    />
                    <StatsCard
                        title="Cleared (MTD)"
                        value={formatCurrency(stats.totalSettled)}
                        icon={<CheckCircle className="w-full h-full" />}
                        iconBgColor="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />
                    <StatsCard
                        title="Pending Clearance"
                        value={formatCurrency(stats.pendingAmount)}
                        icon={<Clock className="w-full h-full" />}
                        iconBgColor="bg-amber-50"
                        iconColor="text-amber-600"
                    />
                    <StatsCard
                        title="Payment Success"
                        value={`${Math.round((stats.clearedCount / (stats.totalCount || 1)) * 100)}%`}
                        icon={<DollarSign className="w-full h-full" />}
                        iconBgColor="bg-indigo-50"
                        iconColor="text-primary"
                    />
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by Payment #, Supplier, or Ref ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm min-w-[140px]"
                        >
                            <option value="all">All Status</option>
                            <option value="Cleared">Cleared</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                            <option value="Reversed">Reversed</option>
                        </select>
                        <button className="p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden text-neutral-900 dark:text-neutral-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b dark:border-neutral-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Payment Details</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Supplier</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Method & Reference</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-right">Amount Settled</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-center">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredPayments.map((p, index) => {
                                    const paymentId = p.id || (p as any)._id || `payment-${index}`;
                                    return (
                                    <tr
                                        key={paymentId}
                                        className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/purchase/payments/view/${p.id || (p as any)._id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-neutral-900 dark:text-white">{p.payment_number}</span>
                                                <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {new Date(p.payment_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{p.vendor_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-neutral-600 dark:text-neutral-400">{formatPaymentMethod(p.method)}</span>
                                                {p.reference_id && <span className="text-[9px] font-mono text-brand-600 uppercase tracking-tighter">Ref: {p.reference_id}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-black text-neutral-900 dark:text-white">{formatCurrency(Number(p.total_amount) || Number((p as any).totalAmount) || Number((p as any).amount) || 0)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(p.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-neutral-400 group-hover:text-brand-600 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })}
                                {filteredPayments.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <CreditCard className="w-12 h-12 mb-3" />
                                                <p className="font-bold text-sm uppercase tracking-widest">No Payments Found</p>
                                                <p className="text-xs">Process settlements to see them here</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SupplierPayments;
