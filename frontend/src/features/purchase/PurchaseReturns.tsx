import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import {
    RotateCcw, Filter, Clock, AlertCircle, Truck, ChevronRight,
    Search as SearchIcon, ArrowUpRight, Activity, Zap, ShieldCheck
} from 'lucide-react';
import api from "../../services/api";
import { PurchaseReturn, PurchaseReturnStatus } from "../../types/purchase";
import StatusBadge from '@/components/shared/UI/StatusBadge';

const PurchaseReturns: React.FC = () => {
    const navigate = useNavigate();
    const [loadError, setLoadError] = useState('');
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [_isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchReturns = async () => {
            setIsLoading(true);
            setLoadError('');
            try {
                const response = await api.get('/api/purchase-returns');
                const raw = response.data;
                const list = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.data)
                    ? raw.data
                    : Array.isArray(raw?.returns)
                    ? raw.returns
                    : Array.isArray(raw?.results)
                    ? raw.results
                    : [];
                // Backend PurchaseReturn docs are camelCase (returnId/supplier/returnDate/
                // totalAmount) with no return-level `reason` (it's per-item) -- normalize into
                // this page's snake_case display shape rather than showing raw/blank fields.
                setReturns(list.map((r: any) => ({
                    id: r._id || r.id,
                    return_number: r.returnId,
                    return_date: r.returnDate,
                    vendor_id: r.supplier?._id || r.supplier,
                    vendor_name: r.supplier?.businessName || 'Unknown Supplier',
                    grn_id: r.grnId?._id || r.grnId,
                    grn_number: r.grnId?.grnNumber || (r.grnId ? '' : 'Not GRN-linked'),
                    po_number: undefined,
                    reason: r.items?.[0]?.reason || 'Others',
                    // The backend model has no status/workflow field yet (a return is a single
                    // atomic action today, not a multi-step lifecycle) -- refundMethod is the
                    // closest available signal: cash/bank settle immediately, credit/adjust
                    // leaves a standing debit note against the supplier.
                    status: (r.refundMethod === 'cash' || r.refundMethod === 'bank_transfer') ? 'Credited' : 'Initiated',
                    items: r.items || [],
                    total_amount: r.totalAmount,
                    tax_amount: r.taxAmount,
                    attachments: [],
                    created_at: r.createdAt
                })));
            } catch (err) {
                console.error("Failed to fetch returns", err);
                // No sample fallback: show that loading failed rather than records that don't exist.
                setReturns([]);
                setLoadError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not load purchase returns. Check your connection and refresh.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchReturns();
    }, []);

    const getStatusBadge = (status: PurchaseReturnStatus) => <StatusBadge status={status} />;

    const filteredReturns = useMemo(() => {
        return returns.filter(r => {
            const matchesSearch =
                r.return_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.grn_number?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [returns, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const totalAmount = returns.reduce((sum, r) => sum + (Number(r.total_amount) || Number((r as any).totalAmount) || 0), 0);
        const pendingAmount = returns.filter(r => r.status !== 'Credited').reduce((sum, r) => sum + (Number(r.total_amount) || Number((r as any).totalAmount) || 0), 0);
        const creditedAmount = returns.filter(r => r.status === 'Credited').reduce((sum, r) => sum + (Number(r.total_amount) || Number((r as any).totalAmount) || 0), 0);

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
            <div className="pt-8 space-y-10 pb-20">
                <PageHeader
                    title="Procurement Reversal Ledger"
                    description="Execute reverse logistics nodes and track institutional debit-note credits."
                    breadcrumbs={[
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Returns Archive' }
                    ]}
                    actions={
                        <button
                            onClick={() => navigate('/purchase/returns/new')}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <RotateCcw className="w-4 h-4" /> Initiate Reversal Node
                        </button>
                    }
                />
                {loadError && (
                    <div role="alert" className="rounded-md border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger dark:border-danger/50 dark:bg-danger-soft dark:text-danger">{loadError}</div>
                )}

                {/* KPI Pulse Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Total Nodes', val: stats.total, icon: RotateCcw, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Quantum Reversal', val: formatCurrency(stats.totalAmount), icon: Zap, color: 'text-success', bg: 'bg-success-soft' },
                        { label: 'Floating Credits', val: formatCurrency(stats.pendingAmount), icon: Clock, color: 'text-warning', bg: 'bg-warning-soft' },
                        { label: 'Resolved (Credited)', val: stats.total - returns.filter(r => r.status !== 'Credited').length, icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary-soft' }
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
                                <p className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase tabular-nums">{card.val}</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        </div>
                    ))}
                </div>

                {/* Audit Control Matrix */}
                <div className="ui-panel p-8 flex flex-col md:flex-row gap-6 justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative w-full md:w-[500px]">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Archive Search</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search Return ID, Vendor, or GRN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-end gap-6 w-full md:w-auto">
                        <div className="flex-1 md:w-64">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Operational State</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-6 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                            >
                                <option value="all">All States</option>
                                <option value="Initiated">Initiated</option>
                                <option value="In-Transit">In-Transit</option>
                                <option value="Received by Vendor">At Vendor</option>
                                <option value="Credited">Credited</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <button className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm text-neutral-400 hover:text-primary transition-all active:scale-95">
                            <Filter className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Reversal Ledger */}
                <div className="ui-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Reversal ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Supplier</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">References</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Reason</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Refund (INR)</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredReturns.map((r, index) => {
                                    const returnId = r.id || (r as any)._id || `return-${index}`;
                                    return (
                                    <tr
                                        key={returnId}
                                        className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all cursor-pointer"
                                        onClick={() => navigate(`/purchase/returns/view/${r.id || (r as any)._id}`)}
                                    >
                                        <td className="px-8 py-6 text-left">
                                            <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">#{r.return_number}</p>
                                            <p className="text-[10px] font-black text-neutral-400 mt-1 uppercase tracking-widest italic">{new Date(r.return_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">{r.vendor_name}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full w-fit uppercase tracking-widest border border-primary/10">GRN: {r.grn_number}</span>
                                                {r.po_number && <span className="text-[9px] text-neutral-400 font-black uppercase tracking-widest opacity-60">PO: {r.po_number}</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${r.reason === 'Defective' ? 'bg-danger-soft text-danger border-danger-line dark:bg-danger-soft dark:border-danger/30' : 'bg-neutral-50 text-neutral-600 border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800'}`}>
                                                {r.reason}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">{formatCurrency(Number(r.total_amount) || Number((r as any).totalAmount) || 0)}</span>
                                        </td>
                                        <td className="table-cell-center">
                                            <div className="flex justify-center">
                                                {getStatusBadge(r.status)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-3 text-neutral-300 group-hover:text-primary group-hover:bg-primary/5 rounded-sm transition-all active:scale-95">
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })}
                                {filteredReturns.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-6 opacity-30 grayscale max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                    <RotateCcw className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-widest">Archive Empty</p>
                                                    <p className="text-xs font-bold mt-2 italic leading-relaxed">No returns found. Create a return against a verified GRN to populate this list.</p>
                                                </div>
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
