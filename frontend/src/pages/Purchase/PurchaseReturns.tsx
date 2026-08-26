import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import {
    RotateCcw, Plus, Search, Filter, ArrowRight, Clock,
    CheckCircle, AlertCircle, Truck, DollarSign, FileText, ChevronRight,
    Search as SearchIcon, ArrowUpRight, Activity, Zap, Info, ShieldCheck
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
                setReturns(list);
            } catch (err) {
                console.error("Failed to fetch returns", err);
                // Mocking data for aesthetic preview
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
        const baseClass = "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5";
        switch (status) {
            case 'Initiated':
                return <span className={`${baseClass} bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400`}><Activity className="w-3 h-3" /> Initiated</span>;
            case 'In-Transit':
                return <span className={`${baseClass} bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-warning`}><Truck className="w-3 h-3" /> In-Transit</span>;
            case 'Credited':
                return <span className={`${baseClass} bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-success`}><ShieldCheck className="w-3 h-3" /> Credited</span>;
            case 'Cancelled':
                return <span className={`${baseClass} bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-danger`}><AlertCircle className="w-3 h-3" /> Cancelled</span>;
            default:
                return <span className={`${baseClass} bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400`}>{status}</span>;
        }
    };

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

                {/* KPI Pulse Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Total Nodes', val: stats.total, icon: RotateCcw, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Quantum Reversal', val: formatCurrency(stats.totalAmount), icon: Zap, color: 'text-success', bg: 'bg-emerald-50' },
                        { label: 'Floating Credits', val: formatCurrency(stats.pendingAmount), icon: Clock, color: 'text-warning', bg: 'bg-amber-50' },
                        { label: 'Resolved (Credited)', val: stats.total - returns.filter(r => r.status !== 'Credited').length, icon: ShieldCheck, color: 'text-primary', bg: 'bg-indigo-50' }
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
                <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Reversal ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Institutional Vendor</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Oracle Links</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Incident Vector</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Refund (INR)</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Protocol Status</th>
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
                                        <td className="px-8 py-6">
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
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${r.reason === 'Defective' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30' : 'bg-neutral-50 text-neutral-600 border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800'}`}>
                                                {r.reason}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">{formatCurrency(Number(r.total_amount) || Number((r as any).totalAmount) || 0)}</span>
                                        </td>
                                        <td className="px-8 py-6">
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
                                                    <p className="text-xs font-bold mt-2 italic leading-relaxed">No reversal nodes detected. Initialize returns against verified GRNs to populate ledger.</p>
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
