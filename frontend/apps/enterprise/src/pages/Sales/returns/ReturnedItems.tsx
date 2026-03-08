import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    Building2,
    Activity,
    ShieldCheck,
    ArrowUpRight,
    Filter,
    Layers,
    History,
    Zap
} from 'lucide-react';

const ReturnedItems = () => {
    const navigate = useNavigate();
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refundMethodFilter, setRefundMethodFilter] = useState('all');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user?.token;
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchReturns();
    }, []);

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

    const filteredReturns = returns.filter(ret => {
        const matchesSearch =
            (ret.returnId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ret.invoice?.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ret.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
        const matchesRefundMethod = refundMethodFilter === 'all' || ret.refundMethod === refundMethodFilter;
        return matchesSearch && matchesStatus && matchesRefundMethod;
    });

    const totalAmount = filteredReturns.reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);

    const GlassPanel = ({ children, title, icon: Icon, className = "" }: any) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel border border-white/5 shadow-2xl overflow-hidden ${className}`}
        >
            {title && (
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
                        {Icon && <Icon className="w-4 h-4" />}
                        {title}
                    </h3>
                </div>
            )}
            <div className="p-6">{children}</div>
        </motion.div>
    );

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Syncing Reversal Registry...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48 opacity-30"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-rose-500 font-black text-[10px] uppercase tracking-[0.4em]">
                                <ShieldCheck className="w-4 h-4" />
                                Operational Protocol: 2036.04
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter uppercase">
                                Returns <span className="text-rose-500 italic">Registry</span>
                            </h1>
                            <p className="text-secondary text-sm font-medium opacity-60">High-precision tracking of inventory reversals and capital redistributions.</p>
                        </div>

                        <button
                            onClick={() => navigate('/sales/return')}
                            className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-rose-900/40 hover:bg-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4"
                        >
                            <Plus className="w-5 h-5" />
                            Initiate Reversal
                        </button>
                    </div>

                    {/* KPI Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Aggregate Reversal', value: `₹${totalAmount.toLocaleString()}`, icon: Banknote, color: 'rose' },
                            { label: 'Registry Magnitude', value: filteredReturns.length, icon: RotateCcw, color: 'indigo' },
                            { label: 'Protocol Integrity', value: '99.9%', icon: ShieldCheck, color: 'emerald' }
                        ].map((kpi, idx) => (
                            <GlassPanel key={idx} className="relative group overflow-hidden">
                                <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700`}>
                                    <kpi.icon className="w-24 h-24" />
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">{kpi.label}</div>
                                    <div className="text-3xl font-display font-black text-main tracking-tighter">{kpi.value}</div>
                                    <div className={`text-[8px] font-black uppercase tracking-widest text-${kpi.color}-500 flex items-center gap-2`}>
                                        <Activity className="w-3 h-3" />
                                        Real-time Metrics Synchronized
                                    </div>
                                </div>
                            </GlassPanel>
                        ))}
                    </div>

                    {/* Control Hub */}
                    <GlassPanel className="p-4">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full lg:w-auto overflow-hidden group/search">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/40 group-focus-within/search:text-rose-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SCAN FOR REVERSAL HASH OR INVOICE MARKS..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-[10px] font-black tracking-[0.2em] text-main placeholder:text-secondary/20 focus:outline-none focus:border-rose-500/40 focus:ring-4 focus:ring-rose-500/5 transition-all"
                                />
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-secondary uppercase tracking-widest focus:outline-none focus:border-rose-500/40 appearance-none flex-1 lg:flex-none cursor-pointer"
                                >
                                    <option value="all" className="bg-neutral-900">All Status Flags</option>
                                    <option value="processed" className="bg-neutral-900">Processed</option>
                                    <option value="pending" className="bg-neutral-900">Pending</option>
                                </select>
                                <select
                                    value={refundMethodFilter}
                                    onChange={(e) => setRefundMethodFilter(e.target.value)}
                                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-secondary uppercase tracking-widest focus:outline-none focus:border-rose-500/40 appearance-none flex-1 lg:flex-none cursor-pointer"
                                >
                                    <option value="all" className="bg-neutral-900">All Vectors</option>
                                    <option value="credit" className="bg-neutral-900">Ledger Credit</option>
                                    <option value="cash" className="bg-neutral-900">Cash Reserve</option>
                                </select>
                            </div>
                        </div>
                    </GlassPanel>

                    {/* Registry Table */}
                    <GlassPanel className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Protocol Index</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Source Manifest</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Counterparty</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Rejection Volume</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Operational</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredReturns.map((ret, idx) => {
                                        const isExpanded = expandedRows.has(ret._id);
                                        return (
                                            <React.Fragment key={ret._id}>
                                                <tr className="group hover:bg-white-[0.03] transition-colors">
                                                    <td className="px-8 py-6">
                                                        <button 
                                                            onClick={() => toggleRowExpansion(ret._id)}
                                                            className="flex items-center gap-3 text-xs font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-tight"
                                                        >
                                                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                            {ret.returnId}
                                                        </button>
                                                        <div className="text-[8px] font-black text-secondary/20 uppercase tracking-widest mt-1 ml-7">
                                                            SYN: {new Date(ret.returnDate).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-[10px] font-black text-main uppercase tracking-widest">{ret.invoice?.invoiceNo || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest">{ret.customerName}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="text-sm font-black text-main font-mono">₹{ret.totalReturnAmount?.toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                            ret.status === 'processed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                        }`}>
                                                            {ret.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button 
                                                            onClick={() => setDeleteConfirm(ret._id)}
                                                            className="p-3 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.tr 
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                        >
                                                            <td colSpan={6} className="px-12 py-6 bg-white/5 border-b border-white/5">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                    <div className="space-y-4">
                                                                        <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Asset Composition</div>
                                                                        <div className="space-y-2">
                                                                            {ret.items?.map((item: any, i: number) => (
                                                                                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                                                                    <div>
                                                                                        <div className="text-[10px] font-black text-main uppercase tracking-tight">{item.productName}</div>
                                                                                        <div className="text-[8px] font-black text-secondary/40 uppercase tracking-widest">{item.returnedQty} UNITS @ ₹{item.rate}</div>
                                                                                    </div>
                                                                                    <div className="text-xs font-black text-rose-500 font-mono">₹{item.lineTotal?.toLocaleString()}</div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Vector Intelligence</div>
                                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Reversal Vector:</span>
                                                                                <span className="text-[10px] font-black text-main uppercase tracking-widest">{ret.refundMethod}</span>
                                                                            </div>
                                                                            <div className="h-px bg-white/5"></div>
                                                                            <div className="text-[10px] font-medium text-secondary opacity-60 leading-relaxed italic">
                                                                                {ret.notes || "No protocol annotations provided."}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </GlassPanel>
                </div>
            </div>

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm glass-panel border border-rose-500/20 p-8 shadow-2xl relative z-10 text-center">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-display font-black text-main uppercase tracking-tight mb-2">Registry Purge?</h2>
                            <p className="text-xs text-secondary opacity-60 mb-8 lowercase tracking-wide">This action will synchronize the ledger and retrieve associated assets permanently.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest hover:text-main transition-all">Cancel</button>
                                <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 shadow-xl shadow-rose-900/20 transition-all">Confirm Purge</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border-radius: 2rem; }
                .font-display { font-family: 'Outfit', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(244, 63, 94, 0.2); border-radius: 20px; }
            `}</style>
        </Layout>
    );
};

export default ReturnedItems;
