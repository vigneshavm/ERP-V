import { logger } from '@/shared/lib/logger';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "@/shared/api/api";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import {
    RotateCcw,
    Plus,
    Search,
    ChevronRight,
    Trash2,
    Package,
    AlertCircle,
    CheckCircle,
    Clock,
    CreditCard,
    Banknote,
    TrendingDown,
    Filter,
    ArrowUpRight,
    SearchX,
    ShieldAlert,
    Undo2,
    Boxes
} from 'lucide-react';

const ReturnedItems = () => {
    const navigate = useNavigate();
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refundMethodFilter, setRefundMethodFilter] = useState('all');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const itemsPerPage = 20;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user?.token;

    useEffect(() => {
        fetchReturns();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, refundMethodFilter]);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/returns`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReturns(response.data.data || []);
        } catch (error) {
            logger.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (returnId: string) => {
        try {
            await api.delete(`/returns/${returnId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeleteConfirm(null);
            fetchReturns();
        } catch (error) {
            logger.error('Error deleting return:', error);
        }
    };

    const toggleRowExpansion = (returnId: any) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(returnId)) {
            newExpanded.delete(returnId);
        } else {
            newExpanded.add(returnId);
        }
        setExpandedRows(newExpanded);
    };

    const getStatusConfig = (status: string) => {
        const configs: any = {
            'processed': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle, label: 'Processed' },
            'pending': { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock, label: 'Pending Verification' },
            'refunded': { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: CreditCard, label: 'Capital Refunded' }
        };
        return configs[status] || { bg: 'bg-neutral-500/10', text: 'text-neutral-500', icon: Package, label: status };
    };

    const filteredReturns = returns.filter(ret => {
        const matchesSearch =
            ret.returnId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ret.invoice?.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
        const matchesRefundMethod = refundMethodFilter === 'all' || ret.refundMethod === refundMethodFilter;
        return matchesSearch && matchesStatus && matchesRefundMethod;
    });

    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedReturns = filteredReturns.slice(startIndex, endIndex);

    // Calculate metrics
    const totalAmount = filteredReturns.reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);
    const fullReturns = filteredReturns.filter(ret => ret.returnType === 'full').length;
    const partialReturns = filteredReturns.filter(ret => ret.returnType === 'partial').length;

    if (loading && returns.length === 0) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                        <RotateCcw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-rose-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Initializing Reversal Ledger...</p>
                </PageShell>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-rose-500/20">Operational Reversal</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Returns & Refunds Matrix</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Inventory Returns <RotateCcw className="w-8 h-8 text-rose-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Monitoring and reconciliation of inbound customer stock reversals.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                         <button
                            onClick={() => navigate('/sales/return')}
                            className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Execute Return</span>
                        </button>
                    </div>
                </div>

                {/* Reversal KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Cycles', value: filteredReturns.length, icon: RotateCcw, color: 'rose', sub: 'Reversal Global' },
                        { label: 'Capital Loss', value: `₹${totalAmount.toLocaleString()}`, icon: Banknote, color: 'rose', status: 'Value Flux' },
                        { label: 'Full Nodes', value: fullReturns, icon: Package, color: 'purple', trend: 'Complete Reset' },
                        { label: 'Partial Segments', value: partialReturns, icon: AlertCircle, color: 'blue', alert: partialReturns > 10 }
                    ].map((kpi, i) => (
                        <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <kpi.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{kpi.label}</p>
                                    <h3 className={`text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic whitespace-nowrap`}>
                                        {kpi.value}
                                    </h3>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    {kpi.sub && (
                                        <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{kpi.sub}</p>
                                    )}
                                    {kpi.trend && (
                                        <div className="flex items-center gap-1.5 text-purple-500 font-black uppercase tracking-widest text-[8px]">
                                            <TrendingDown className="w-2.5 h-2.5" /> {kpi.trend}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full bg-${kpi.color}-500 animate-pulse`} />
                                        <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${kpi.alert ? 'text-rose-500' : 'text-neutral-400'}`}>
                                            {kpi.status || (kpi.alert ? 'Critical Drift' : 'State Nominal')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations Layer */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    {/* Reversal Filter Matrix */}
                    <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
                        <div className="relative w-full lg:max-w-xl group/search">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-rose-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Intercept Return ID, Invoice or Entity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-neutral-900 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                                <Filter className="w-4 h-4 text-neutral-400 ml-3" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                                >
                                    <option value="all">Global States</option>
                                    <option value="processed">Processed</option>
                                    <option value="pending">Pending</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                                <CreditCard className="w-4 h-4 text-neutral-400 ml-3" />
                                <select
                                    value={refundMethodFilter}
                                    onChange={(e) => setRefundMethodFilter(e.target.value)}
                                    className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                                >
                                    <option value="all">Refund Proto</option>
                                    <option value="credit">Credit</option>
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank</option>
                                    <option value="original_payment">Original</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Reversal Ledger Display */}
                    <div className="overflow-x-auto px-2">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-2">Return Sequence</th>
                                    <th className="px-8 py-2">Fiscal Origin</th>
                                    <th className="px-8 py-2 text-center">Protocol Type</th>
                                    <th className="px-8 py-2 text-right">Refund Velocity</th>
                                    <th className="px-8 py-2">State Node</th>
                                    <th className="px-8 py-2 text-right">Commands</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedReturns.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] mb-6 text-neutral-200 animate-in zoom-in duration-500">
                                                    <SearchX className="w-16 h-16" />
                                                </div>
                                                <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Reversal Null</h3>
                                                <p className="text-sm font-bold text-neutral-500 mt-2 italic max-w-sm">
                                                    No stock reversals detected in current temporal bracket.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedReturns.map((returnItem) => {
                                        const config = getStatusConfig(returnItem.status);
                                        const StatusIcon = config.icon;
                                        const isExpanded = expandedRows.has(returnItem._id);
                                        
                                        return (
                                            <>
                                                <tr key={returnItem._id} className="group/row cursor-default">
                                                    <td className="px-2 py-1">
                                                        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all relative overflow-hidden h-full">
                                                            <button
                                                                onClick={() => toggleRowExpansion(returnItem._id)}
                                                                className="flex items-center gap-3 text-lg font-black text-rose-600 dark:text-rose-400 uppercase tracking-tighter italic hover:opacity-70 transition-opacity"
                                                            >
                                                                <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`} />
                                                                {returnItem.returnId}
                                                            </button>
                                                            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic pl-8">
                                                                {new Date(returnItem.returnDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all h-full">
                                                            <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-1">
                                                                {returnItem.customerName}
                                                            </p>
                                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic leading-none block mt-1">
                                                                INV: {returnItem.invoice?.invoiceNo || 'DIRECT'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-center">
                                                        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${returnItem.returnType === 'full' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                                {returnItem.returnType} RESET
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-right">
                                                        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-neutral-900 dark:text-main italic text-lg">
                                                            ₹{returnItem.totalReturnAmount?.toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${config.bg} ${config.text} border-current/10`}>
                                                                <StatusIcon className="w-3.5 h-3.5" />
                                                                {config.label}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-right">
                                                        <div className="flex justify-end gap-3 pr-4">
                                                            <button
                                                                onClick={() => setDeleteConfirm(returnItem._id)}
                                                                className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 group/trash"
                                                            >
                                                                <Trash2 className="w-5 h-5 group-hover/trash:scale-110 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="animate-in slide-in-from-top-2 duration-500">
                                                        <td colSpan={6} className="px-4 pb-4">
                                                            <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950 rounded-[2.5rem] p-10 border border-default dark:border-neutral-800 shadow-inner space-y-8">
                                                                <div className="flex items-center justify-between px-2">
                                                                    <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                                                        <Boxes className="w-4 h-4 text-rose-500" /> Catalog Reversal Sub-Matrix
                                                                    </h4>
                                                                    <div className="px-4 py-1 bg-white dark:bg-neutral-900 rounded-lg border border-default dark:border-neutral-800 text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                                                        {returnItem.items?.length} Extraction Nodes
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left border-separate border-spacing-y-2">
                                                                        <thead>
                                                                            <tr className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">
                                                                                <th className="px-6 py-2">Catalog Product</th>
                                                                                <th className="px-6 py-2 text-center">Unit Count</th>
                                                                                <th className="px-6 py-2 text-right">Base Rate</th>
                                                                                <th className="px-6 py-2 text-center">Material State</th>
                                                                                <th className="px-6 py-2">Causal Agent</th>
                                                                                <th className="px-6 py-2 text-right">Relocation Value</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {returnItem.items?.map((item: any, idx: number) => (
                                                                                <tr key={idx} className="group/subrow">
                                                                                    <td className="px-0 py-0.5">
                                                                                        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-default dark:border-neutral-800 font-black text-xs uppercase tracking-tight italic">
                                                                                            {item.productName}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-0 py-0.5 text-center">
                                                                                        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-default dark:border-neutral-800 font-black text-xs italic text-rose-500">
                                                                                            {item.returnedQty} Units
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-0 py-0.5 text-right">
                                                                                        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-default dark:border-neutral-800 font-mono font-bold text-xs">
                                                                                            ₹{item.rate?.toLocaleString()}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-0 py-0.5 text-center">
                                                                                        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-default dark:border-neutral-800">
                                                                                            <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg ${item.condition === 'damaged' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                                                                {item.condition?.replace('_', ' ')}
                                                                                            </span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-0 py-0.5">
                                                                                        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-default dark:border-neutral-800 text-[10px] font-medium text-neutral-500 italic uppercase tracking-tight">
                                                                                            {item.reason || 'UNSPECIFIED'}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-0 py-0.5 text-right">
                                                                                        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-default dark:border-neutral-800 font-black text-xs text-rose-500 italic">
                                                                                            ₹{item.lineTotal?.toLocaleString()}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                {returnItem.notes && (
                                                                    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                                                                        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                                                        <div>
                                                                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 italic">Supplemental Observation</p>
                                                                            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 italic leading-relaxed uppercase tracking-tight">
                                                                                {returnItem.notes}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-end gap-6 pt-4 border-t border-default dark:border-neutral-800">
                                                                    <div className="text-right">
                                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-1 italic">Extraction Protocol Verification</p>
                                                                        <p className="text-2xl font-black text-rose-600 italic tracking-tighter">TOTAL REVERSAL: ₹{returnItem.totalReturnAmount?.toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Layer */}
                    {totalPages > 1 && (
                        <div className="p-8 mt-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2rem] border border-default dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] italic">
                                Viewing <span className="text-neutral-900 dark:text-main">{startIndex + 1}</span> - <span className="text-neutral-900 dark:text-main">{Math.min(endIndex, filteredReturns.length)}</span> of <span className="text-neutral-900 dark:text-main">{filteredReturns.length}</span> Active Cycles
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-3 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Temporal Shift Back
                                </button>
                                <div className="text-xs font-black text-rose-500 font-mono italic">
                                    {currentPage} / {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-3 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Temporal Shift Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Branded verification footprint */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <Undo2 className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Temporal Reversal Verified • Sequence Integrity {filteredReturns.length} Nodes</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>

            {/* Reversal Erasure Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 rounded-[3rem] p-12 max-w-md w-full mx-4 shadow-2xl border border-rose-500/20 group/modal">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-8 group-hover/modal:scale-110 transition-transform">
                            <ShieldAlert className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter uppercase mb-6 italic">Erasure Protocol</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-10 text-lg leading-relaxed italic">
                            Instructing the system to purge this return record. All inventory restoration and fiscal reversals will be permanentely nullified across the ledger.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-8 py-5 border border-default rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                            >
                                Abort Sequence
                            </button>
                            <button
                                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                                className="flex-1 px-8 py-5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                Execute Purge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ReturnedItems;
