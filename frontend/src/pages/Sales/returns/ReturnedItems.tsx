import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../services/api";
import Layout from "../../../components/shared/Layout/Layout";
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
    Building2
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

    const getStatusConfig = (status: string) => {
        const configs: any = {
            'processed': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
            'pending': { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
            'refunded': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CreditCard }
        };
        return configs[status] || { color: 'bg-surface/50 text-main border-default/30', icon: Package };
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

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-secondary opacity-70 font-medium">Loading returns...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-main tracking-tight">Returns & Refunds</h1>
                        <p className="text-sm text-secondary opacity-70 mt-1">Track and manage customer returns</p>
                    </div>
                    <button
                        onClick={() => navigate('/sales/return')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-sm transition-all font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Return</span>
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 flex flex-col justify-between hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Total Returns</p>
                                <h3 className="text-2xl font-bold text-main mt-1 group-hover:text-primary transition-colors">{filteredReturns.length}</h3>
                            </div>
                            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                                <RotateCcw className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full bg-surface/40 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full w-full"></div>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 flex flex-col justify-between hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Total Amount</p>
                                <h3 className="text-2xl font-bold text-main mt-1 group-hover:text-danger transition-colors">₹{totalAmount.toFixed(0)}</h3>
                            </div>
                            <div className="p-2 bg-rose-50 rounded-lg text-danger group-hover:bg-rose-100 transition-colors">
                                <Banknote className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-danger font-medium bg-rose-50 inline-block px-2 py-1 rounded">
                            Value returned
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 flex flex-col justify-between hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Full Returns</p>
                                <h3 className="text-2xl font-bold text-main mt-1 group-hover:text-purple-600 transition-colors">{fullReturns}</h3>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                                <Package className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-secondary opacity-70">
                            <strong>{filteredReturns.length > 0 ? ((fullReturns / filteredReturns.length) * 100).toFixed(0) : 0}%</strong> of returns
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 flex flex-col justify-between hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Partial Returns</p>
                                <h3 className="text-2xl font-bold text-main mt-1 group-hover:text-info transition-colors">{partialReturns}</h3>
                            </div>
                            <div className="p-2 bg-info/10 rounded-lg text-info group-hover:bg-blue-100 transition-colors">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-secondary opacity-70">
                            <strong>{filteredReturns.length > 0 ? ((partialReturns / filteredReturns.length) * 100).toFixed(0) : 0}%</strong> of returns
                        </div>
                    </div>
                </div>

                {/* Filter Island */}
                <div className="glass-panel rounded-xl shadow-sm border border-default/30 p-5">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full lg:max-w-md group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-secondary opacity-50 group-focus-within:text-primary hover:text-primary-hover transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search return ID, invoice, customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-default/40 rounded-lg leading-5 glass-panel placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-shadow shadow-sm"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 border border-default/40 glass-panel text-main opacity-90 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="processed">Processed</option>
                                <option value="pending">Pending</option>
                                <option value="refunded">Refunded</option>
                            </select>
                            <select
                                value={refundMethodFilter}
                                onChange={(e) => setRefundMethodFilter(e.target.value)}
                                className="px-4 py-2.5 border border-default/40 glass-panel text-main opacity-90 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm text-sm"
                            >
                                <option value="all">All Methods</option>
                                <option value="credit">Credit</option>
                                <option value="cash">Cash</option>
                                <option value="bank">Bank</option>
                                <option value="original_payment">Original Payment</option>
                            </select>
                            {(searchTerm || statusFilter !== 'all' || refundMethodFilter !== 'all') && (
                                <button
                                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRefundMethodFilter('all'); }}
                                    className="text-sm text-secondary opacity-70 hover:text-primary font-medium px-2 transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="glass-panel rounded-xl shadow-sm border border-default/30 overflow-hidden">
                    {filteredReturns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="bg-surface/50 p-4 rounded-full mb-4">
                                <RotateCcw className="w-8 h-8 text-secondary opacity-50" />
                            </div>
                            <h3 className="text-lg font-bold text-main">No returns found</h3>
                            <p className="text-secondary opacity-70 mt-1 max-w-sm">No returns match your current filters or get started by creating a new return.</p>
                            <button
                                onClick={() => navigate('/sales/return')}
                                className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium shadow-sm"
                            >
                                Create First Return
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface/30 border-b border-default/30">
                                            <th className="px-6 py-4 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Return ID</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Invoice</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider text-right">Amount</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider text-center">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-default/20">
                                        {paginatedReturns.map((returnItem) => {
                                            const statusConfig = getStatusConfig(returnItem.status);
                                            const isExpanded = expandedRows.has(returnItem._id);
                                            return (
                                                <>
                                                    <tr key={returnItem._id} className="hover:bg-surface/40 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => toggleRowExpansion(returnItem._id)}
                                                                className="flex items-center gap-2 font-bold text-primary hover:text-indigo-800"
                                                            >
                                                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                {returnItem.returnId}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-secondary">
                                                            {new Date(returnItem.returnDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => navigate(`/pos/invoice/${returnItem.invoice?._id}`)}
                                                                className="text-sm text-primary hover:underline"
                                                            >
                                                                {returnItem.invoice?.invoiceNo || 'N/A'}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-main">{returnItem.customerName}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${returnItem.returnType === 'full' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {returnItem.returnType}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-main">
                                                            ₹{returnItem.totalReturnAmount?.toFixed(2) || '0.00'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${statusConfig.color}`}>
                                                                {returnItem.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => setDeleteConfirm(returnItem._id)}
                                                                className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={8} className="px-6 py-4 bg-surface/30">
                                                                <div className="space-y-4">
                                                                    <h4 className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Returned Items</h4>
                                                                    <div className="glass-panel rounded-lg border border-default/30 overflow-hidden">
                                                                        <table className="w-full">
                                                                            <thead className="bg-surface/40 border-b border-default/30">
                                                                                <tr className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">
                                                                                    <th className="px-4 py-2 text-left">Product</th>
                                                                                    <th className="px-4 py-2 text-right">Qty</th>
                                                                                    <th className="px-4 py-2 text-right">Rate</th>
                                                                                    <th className="px-4 py-2 text-center">Condition</th>
                                                                                    <th className="px-4 py-2 text-left">Reason</th>
                                                                                    <th className="px-4 py-2 text-right">Total</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-default/20">
                                                                                {returnItem.items?.map((item: any, idx: number) => (
                                                                                    <tr key={idx}>
                                                                                        <td className="px-4 py-2 text-sm font-medium text-main">{item.productName}</td>
                                                                                        <td className="px-4 py-2 text-sm text-right">{item.returnedQty}</td>
                                                                                        <td className="px-4 py-2 text-sm text-right">₹{item.rate?.toFixed(2)}</td>
                                                                                        <td className="px-4 py-2 text-center">
                                                                                            <span className={`px-2 py-0.5 text-xs rounded-full ${item.condition === 'damaged' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                                                }`}>
                                                                                                {item.condition?.replace('_', ' ')}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-sm text-secondary">{item.reason || '-'}</td>
                                                                                        <td className="px-4 py-2 text-sm text-right font-bold">₹{item.lineTotal?.toFixed(2)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    {returnItem.notes && (
                                                                        <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                                                                            <strong>Notes:</strong> {returnItem.notes}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-default/30 bg-surface/30 flex items-center justify-between">
                                    <div className="text-sm text-secondary opacity-70">
                                        Showing <span className="font-medium text-main opacity-90">{startIndex + 1}</span> to <span className="font-medium text-main opacity-90">{Math.min(endIndex, filteredReturns.length)}</span> of <span className="font-medium text-main opacity-90">{filteredReturns.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 glass-panel border border-default/40 rounded-lg text-sm font-medium text-secondary hover:bg-surface/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 glass-panel border border-default/40 rounded-lg text-sm font-medium text-secondary hover:bg-surface/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass-panel rounded-xl shadow-2xl max-w-sm w-full p-6 border border-default/20 animate-scale-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 className="w-6 h-6 text-danger" />
                        </div>
                        <h3 className="text-lg font-bold text-main text-center mb-2">Delete Return?</h3>
                        <p className="text-sm text-secondary opacity-70 text-center mb-6">
                            This will reverse all inventory and customer ledger changes. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-default/40 rounded-lg text-main opacity-90 font-medium hover:bg-surface/40 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors"
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

