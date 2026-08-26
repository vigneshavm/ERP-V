import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../services/api";
import Layout from "../../../components/shared/Layout/Layout";
import {
    RotateCcw,
    Plus,
    Search,
    ChevronRight,
    ChevronLeft,
    Trash2,
    Package,
    AlertCircle,
    CheckCircle,
    Clock,
    CreditCard,
    Banknote,
    TrendingDown,
    ShieldAlert,
    BarChart2,
    Download
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
    const itemsPerPage = 10;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user?.token;
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchReturns();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, refundMethodFilter]);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const response = await api.get(`${API_URL}/api/returns`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReturns(response.data || []);
        } catch (error) {
            console.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (returnId: string) => {
        try {
            await api.delete(`${API_URL}/api/returns/${returnId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeleteConfirm(null);
            fetchReturns();
        } catch (error) {
            console.error('Error deleting return:', error);
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

    const filteredReturns = useMemo(() => {
        return returns.filter(ret => {
            const matchesSearch =
                ret.returnId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ret.invoice?.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                ret.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
            const matchesRefundMethod = refundMethodFilter === 'all' || ret.refundMethod === refundMethodFilter;
            return matchesSearch && matchesStatus && matchesRefundMethod;
        });
    }, [returns, searchTerm, statusFilter, refundMethodFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredReturns.length / itemsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedReturns = filteredReturns.slice(startIndex, startIndex + itemsPerPage);

    const metrics = useMemo(() => {
        const total = filteredReturns.reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);
        const full = filteredReturns.filter(ret => ret.returnType === 'full').length;
        const partial = filteredReturns.filter(ret => ret.returnType === 'partial').length;
        return { total, full, partial };
    }, [filteredReturns]);

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-secondary opacity-70 font-black uppercase tracking-widest text-[10px]">Synchronizing Reverse Logistics...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex-1 w-full bg-app text-main font-sans selection:bg-rose-500/30 relative">
                {/* Ambient Background Blobs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-15%] left-[5%] w-[55%] h-[55%] bg-rose-500/10 rounded-full blur-[160px] animate-aura opacity-60" />
                    <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[140px] animate-aura opacity-50" style={{ animationDelay: '7s' }} />
                    <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-danger/5 rounded-full blur-[100px] animate-aura opacity-40" style={{ animationDelay: '3s' }} />
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                    {/* Header */}
                    <header className="flex justify-between items-end">
                        <div className="relative pl-5">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-danger rounded-full shadow-[0_0_15px_rgba(var(--color-danger),0.5)]" />
                            <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                                Sales <span className="text-danger">Returns</span>
                                <span className="px-3 py-1 bg-danger/10 border border-danger/20 text-danger rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> Ledger Reversal
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-secondary">Monitoring Inventory Backflow</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-card border border-default text-xs font-black uppercase tracking-widest text-muted hover:text-main hover:border-danger/30 transition-all">
                                <Download className="w-4 h-4" /> Export Report
                            </button>
                            <button 
                                onClick={() => navigate('/sales/return')}
                                className="flex items-center gap-2 px-6 py-2.5 bg-danger text-white rounded-sm hover:bg-danger/90 shadow-lg shadow-danger/20 transition-all text-xs font-black uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" /> New Return
                            </button>
                        </div>
                    </header>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Return Volume', val: `₹${metrics.total.toLocaleString()}`, icon: TrendingDown, color: 'danger', trend: 'Value' },
                            { label: 'Total Claims', val: filteredReturns.length, icon: ShieldAlert, color: 'warning', trend: 'Count' },
                            { label: 'Full Returns', val: metrics.full, icon: Package, color: 'success', trend: `${filteredReturns.length > 0 ? ((metrics.full / filteredReturns.length) * 100).toFixed(0) : 0}%` },
                            { label: 'Partial Returns', val: metrics.partial, icon: AlertCircle, color: 'info', trend: `${filteredReturns.length > 0 ? ((metrics.partial / filteredReturns.length) * 100).toFixed(0) : 0}%` }
                        ].map((stat, i) => (
                            <div key={i} className="glass-panel border border-default rounded-sm p-6 group hover:border-danger/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 bg-${stat.color}/10 text-${stat.color} rounded-sm`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[10px] font-black text-main bg-app px-2 py-1 rounded-full border border-default`}>
                                        {stat.trend}
                                    </span>
                                </div>
                                <p className="text-3xl font-black text-main tracking-tighter mb-1">{stat.val}</p>
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="glass-panel p-5 rounded-sm border border-default flex flex-wrap gap-5 items-center">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input 
                                type="text" 
                                placeholder="Search return ID, invoice, or customer..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-card border border-default rounded-sm py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-danger/50 focus:ring-2 focus:ring-danger/10 transition-all text-main placeholder:text-secondary"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest shrink-0">Status</span>
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-app border border-default rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-main focus:outline-none focus:border-danger/50 transition-all cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="processed">Processed</option>
                                    <option value="pending">Pending</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest shrink-0">Method</span>
                                <select 
                                    value={refundMethodFilter}
                                    onChange={(e) => setRefundMethodFilter(e.target.value)}
                                    className="bg-app border border-default rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-main focus:outline-none focus:border-danger/50 transition-all cursor-pointer"
                                >
                                    <option value="all">All Methods</option>
                                    <option value="credit">Credit</option>
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="glass-panel rounded-sm border border-default overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface/50 sticky top-0 z-20 border-b border-default">
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-secondary">
                                        <th className="px-6 py-4">Return ID</th>
                                        <th className="px-6 py-4">Date / Customer</th>
                                        <th className="px-6 py-4">Invoice Ref</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {paginatedReturns.length > 0 ? (
                                        paginatedReturns.map((rec) => (
                                            <tr key={rec._id} className="hover:bg-danger/[0.03] transition-all group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-sm bg-danger/10 border border-danger/20 flex items-center justify-center">
                                                            <RotateCcw className="w-4 h-4 text-danger" />
                                                        </div>
                                                        <span className="font-mono text-sm font-bold text-main tracking-tighter">
                                                            {rec.returnId}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-main text-sm">{rec.customerName}</div>
                                                    <div className="text-[10px] text-secondary font-black uppercase tracking-widest mt-0.5">
                                                        {new Date(rec.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <button 
                                                        onClick={() => navigate(`/pos/invoice/${rec.invoice?._id}`)}
                                                        className="text-xs font-bold text-primary hover:underline"
                                                    >
                                                        {rec.invoice?.invoiceNo || 'N/A'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest ${
                                                        rec.returnType === 'full' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {rec.returnType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="text-lg font-display font-black tracking-tighter text-main tabular-nums">₹{rec.totalReturnAmount?.toLocaleString()}</div>
                                                    <div className="text-[9px] text-secondary font-black uppercase tracking-widest mt-1">via {rec.refundMethod || 'Original'}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center">
                                                        <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                                                            rec.status === 'processed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                                                            rec.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                                                            'bg-blue-100 text-blue-800 border-blue-200'
                                                        }`}>
                                                            {rec.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => toggleRowExpansion(rec._id)}
                                                            className="p-2 rounded-sm bg-card border border-default text-muted hover:text-main transition-all"
                                                        >
                                                            <ChevronRight className={`w-4 h-4 transition-transform ${expandedRows.has(rec._id) ? 'rotate-90' : ''}`} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeleteConfirm(rec._id)}
                                                            className="p-2 rounded-sm bg-card border border-default text-danger/50 hover:text-danger transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-card rounded-full border border-default">
                                                        <RotateCcw className="w-8 h-8 text-muted" />
                                                    </div>
                                                    <p className="text-sm font-medium text-muted">No returns found matching your criteria.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-xs font-bold text-secondary">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredReturns.length)} of {filteredReturns.length} entries
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={safePage === 1}
                                    className="p-2 rounded-sm bg-card border border-default text-main hover:bg-surface disabled:opacity-50 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 rounded-sm text-xs font-bold transition-all ${
                                            safePage === p 
                                            ? 'bg-danger text-white shadow-sm border border-danger' 
                                            : 'bg-card border border-default text-main hover:bg-surface'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={safePage === totalPages}
                                    className="p-2 rounded-sm bg-card border border-default text-main hover:bg-surface disabled:opacity-50 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass-panel rounded-sm shadow-2xl max-w-sm w-full p-8 border border-danger/20 animate-scale-in">
                        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Trash2 className="w-8 h-8 text-danger" />
                        </div>
                        <h3 className="text-xl font-display font-black text-main text-center mb-2">Confirm Erasure?</h3>
                        <p className="text-xs text-secondary font-bold text-center mb-8 uppercase tracking-widest leading-loose">
                            This will reverse all inventory and ledger allocations. This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-6 py-3 border border-default rounded-sm text-xs font-black uppercase tracking-widest text-main hover:bg-card transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                                className="flex-1 px-6 py-3 bg-danger text-white rounded-sm text-xs font-black uppercase tracking-widest hover:bg-danger/90 shadow-lg shadow-danger/20 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ReturnedItems;
