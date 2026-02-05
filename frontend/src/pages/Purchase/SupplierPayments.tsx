
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import StatsCard from "../../components/shared/Display/StatsCard";
import {
    CreditCard, Plus, Search, Filter, ArrowRight, Clock,
    CheckCircle, AlertCircle, DollarSign, FileText, ChevronRight,
    Search as SearchIcon, Calendar, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import api from "../../services/api";
import { PurchasePayment, PaymentStatus } from "../../types/purchase";
import { toast } from 'react-toastify';

const SupplierPayments: React.FC = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<PurchasePayment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchPayments = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/api/purchase-payments');
                setPayments(data || []);
            } catch (err) {
                console.error("Failed to fetch payments", err);
                // Mock data for UI development
                setPayments([
                    {
                        id: '1',
                        payment_number: 'PAY-2024-001',
                        payment_date: '2024-03-24',
                        vendor_name: 'Tech Supplies Corp',
                        vendor_id: 'v1',
                        method: 'Bank Transfer',
                        status: 'Cleared',
                        total_amount: 45000,
                        currency: 'INR',
                        exchange_rate: 1,
                        reference_id: 'TXN99823412',
                        allocations: [],
                        attachments: [],
                        created_at: '2024-03-24T10:00:00Z'
                    },
                    {
                        id: '2',
                        payment_number: 'PAY-2024-002',
                        payment_date: '2024-03-22',
                        vendor_name: 'Office Mart',
                        vendor_id: 'v2',
                        method: 'Cheque',
                        status: 'Pending',
                        total_amount: 12500,
                        currency: 'INR',
                        exchange_rate: 1,
                        reference_id: 'CHQ-882190',
                        allocations: [],
                        attachments: [],
                        created_at: '2024-03-22T14:30:00Z'
                    },
                    {
                        id: '3',
                        payment_number: 'PAY-2024-003',
                        payment_date: '2024-03-21',
                        vendor_name: 'Global Logics',
                        vendor_id: 'v3',
                        method: 'Cash',
                        status: 'Cleared',
                        total_amount: 5000,
                        currency: 'INR',
                        exchange_rate: 1,
                        allocations: [],
                        attachments: [],
                        created_at: '2024-03-21T09:15:00Z'
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const getStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case 'Cleared':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Cleared</span>;
            case 'Pending':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
            case 'Failed':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>;
            case 'Reversed':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200 uppercase tracking-wider">Reversed</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-50 text-neutral-400 uppercase tracking-wider">{status}</span>;
        }
    };

    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const matchesSearch =
                p.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.reference_id || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [payments, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const totalAmount = payments.filter(p => p.status !== 'Reversed').reduce((sum, p) => sum + p.total_amount, 0);
        const pendingAmount = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.total_amount, 0);

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
                    description="Process settlements for vendor bills, manage payment advice, and track clearing status."
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
                        iconColor="text-indigo-600"
                    />
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by Payment #, Vendor, or Ref ID..."
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
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden text-neutral-900 dark:text-neutral-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b dark:border-neutral-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Payment Details</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Vendor / Supplier</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Method & Reference</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-right">Amount Settled</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-center">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredPayments.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/purchase/payments/view/${p.id}`)}
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
                                                <span className="font-bold text-neutral-600 dark:text-neutral-400">{p.method}</span>
                                                {p.reference_id && <span className="text-[9px] font-mono text-brand-600 uppercase tracking-tighter">Ref: {p.reference_id}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-black text-neutral-900 dark:text-white">{formatCurrency(p.total_amount)}</span>
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
                                ))}
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
