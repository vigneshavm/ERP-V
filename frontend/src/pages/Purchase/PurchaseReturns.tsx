
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import StatsCard from "../../components/shared/Display/StatsCard";
import {
    RotateCcw, Plus, Search, Filter, ArrowRight, Clock,
    CheckCircle, AlertCircle, Truck, DollarSign, FileText, ChevronRight,
    Search as SearchIcon
} from 'lucide-react';
import api from "../../services/api";
import { PurchaseReturn, PurchaseReturnStatus } from "../../types/purchase";
import { toast } from 'react-toastify';

const PurchaseReturns: React.FC = () => {
    const navigate = useNavigate();
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchReturns = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/api/purchase-returns');
                setReturns(data || []);
            } catch (err) {
                console.error("Failed to fetch returns", err);
                // toast.error("Failed to load purchase returns");
                // Mocking data if API fails
                setReturns([
                    {
                        id: '1',
                        return_number: 'PR-2024-001',
                        return_date: '2024-03-20',
                        vendor_name: 'Tech supplies Corp',
                        vendor_id: 'v1',
                        grn_number: 'GRN-9982',
                        grn_id: 'g1',
                        status: 'Initiated',
                        reason: 'Defective',
                        total_amount: 15400,
                        tax_amount: 2772,
                        items: [],
                        attachments: [],
                        created_at: '2024-03-20T10:00:00Z'
                    },
                    {
                        id: '2',
                        return_number: 'PR-2024-002',
                        return_date: '2024-03-18',
                        vendor_name: 'Office Mart',
                        vendor_id: 'v2',
                        grn_number: 'GRN-9941',
                        grn_id: 'g2',
                        status: 'Credited',
                        reason: 'Wrong Item',
                        total_amount: 3200,
                        tax_amount: 576,
                        items: [],
                        attachments: [],
                        created_at: '2024-03-18T10:00:00Z'
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReturns();
    }, []);

    const getStatusBadge = (status: PurchaseReturnStatus) => {
        switch (status) {
            case 'Initiated':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">Initiated</span>;
            case 'In-Transit':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">In-Transit</span>;
            case 'Received by Vendor':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">At Vendor</span>;
            case 'Processed':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">Processed</span>;
            case 'Credited':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Credited</span>;
            case 'Cancelled':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200 uppercase tracking-wider">Cancelled</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-50 text-neutral-400 uppercase tracking-wider">{status}</span>;
        }
    };

    const filteredReturns = useMemo(() => {
        return returns.filter(r => {
            const matchesSearch =
                r.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.grn_number.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [returns, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const totalAmount = returns.reduce((sum, r) => sum + r.total_amount, 0);
        const pendingAmount = returns.filter(r => r.status !== 'Credited').reduce((sum, r) => sum + r.total_amount, 0);
        const creditedAmount = returns.filter(r => r.status === 'Credited').reduce((sum, r) => sum + r.total_amount, 0);

        return {
            total: returns.length,
            totalAmount,
            pendingAmount,
            creditedAmount
        };
    }, [returns]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    return (
        <Layout>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <PageHeader
                    title="Purchase Returns"
                    description="Track return authorizations, shipping status, and debit note credits from vendors."
                    actions={
                        <button
                            onClick={() => navigate('/purchase/returns/new')}
                            className="btn btn-primary bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/20 px-6"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Initiate Return
                        </button>
                    }
                />

                {/* KPI Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Returns"
                        value={stats.total}
                        icon={<RotateCcw className="w-full h-full" />}
                        iconBgColor="bg-brand-50"
                        iconColor="text-brand-600"
                    />
                    <StatsCard
                        title="Total Refund Value"
                        value={formatCurrency(stats.totalAmount)}
                        icon={<DollarSign className="w-full h-full" />}
                        iconBgColor="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />
                    <StatsCard
                        title="Pending Credits"
                        value={formatCurrency(stats.pendingAmount)}
                        icon={<Clock className="w-full h-full" />}
                        iconBgColor="bg-amber-50"
                        iconColor="text-amber-600"
                    />
                    <StatsCard
                        title="Processed (Credited)"
                        value={stats.total - returns.filter(r => r.status !== 'Credited').length}
                        icon={<CheckCircle className="w-full h-full" />}
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
                            placeholder="Search by Return No, Vendor, or GRN..."
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
                            <option value="Initiated">Initiated</option>
                            <option value="In-Transit">In-Transit</option>
                            <option value="Received by Vendor">At Vendor</option>
                            <option value="Credited">Credited</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <button className="p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b dark:border-neutral-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Return Details</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Vendor / Supplier</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Orig. Document</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Reason</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-right">Refund Amount</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-center">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredReturns.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/purchase/returns/view/${r.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-neutral-900 dark:text-white">{r.return_number}</span>
                                                <span className="text-[10px] text-neutral-500 font-medium">{new Date(r.return_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{r.vendor_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md inline-block w-fit">GRN: {r.grn_number}</span>
                                                {r.po_number && <span className="text-[9px] text-neutral-400 font-medium">PO: {r.po_number}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.reason === 'Defective' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-neutral-50 text-neutral-600 border-neutral-100'}`}>
                                                {r.reason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-neutral-900 dark:text-white">{formatCurrency(r.total_amount)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(r.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-neutral-400 group-hover:text-brand-600 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReturns.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <RotateCcw className="w-12 h-12 mb-3" />
                                                <p className="font-bold text-sm uppercase tracking-widest">No Returns Found</p>
                                                <p className="text-xs">Start by initiating a return against a GRN</p>
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

export default PurchaseReturns;
