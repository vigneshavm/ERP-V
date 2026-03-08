import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Filter, Download, Printer, Eye,
    MoreHorizontal, Calendar, IndianRupee, History,
    CreditCard, X, Activity, Zap, ShieldCheck, 
    ArrowUpRight, Layers, ChevronLeft, ChevronRight
} from 'lucide-react';
import { setActiveTab } from "@/redux/slices/uiSlice";
import { RootState } from "@/redux/store";
import { getTable } from "@/services/dataSource";
import Layout from "@/components/shared/Layout/Layout";

// Enhanced interface for the 2036 Settlement Registry
interface PaymentRecord {
    id: string;
    receiptNo: string;
    date: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    modes: string[];
    reference: string;
    excessAmount?: number;
    allocatedCount?: number;
}

const PaymentInList: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const data = await getTable<any>('payments', {});
                if (data) {
                    setPayments(data.map((p: any) => ({
                        id: p.id || p._id,
                        receiptNo: p.receiptNumber || `RCP-${(p.id || p._id || '').slice(-5)}`,
                        date: p.paymentDate || p.date,
                        customerName: p.customer?.name || p.customer_name || 'Walk-in Proxy',
                        customerPhone: p.customer?.phone || p.customer_phone || '',
                        amount: p.totalAmount || p.amount || 0,
                        modes: p.paymentMethods?.map((pm: any) => pm.method) || [p.mode || 'Cash'],
                        reference: p.reference || '-',
                        excessAmount: p.excessAmount || 0,
                        allocatedCount: p.allocatedInvoices?.length || 0
                    })));
                }
            } catch (error) {
                console.error('Lattice Sync Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const filteredPayments = useMemo(() => {
        if (!searchQuery) return payments;
        const q = searchQuery.toLowerCase();
        return payments.filter(p =>
            p.receiptNo.toLowerCase().includes(q) ||
            p.customerName.toLowerCase().includes(q) ||
            p.customerPhone.includes(q)
        );
    }, [searchQuery, payments]);

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const metrics = useMemo(() => ({
        totalValue: payments.reduce((sum, p) => sum + p.amount, 0),
        count: payments.length,
        creditCount: payments.filter(p => (p.excessAmount || 0) > 0).length
    }), [payments]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    const MetricPanel = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
        <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel p-6 border border-white/5 relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 ${colorClass.replace('text', 'bg')}/5 rounded-full blur-[40px] -mr-8 -mt-8`}></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">{title}</p>
                    <h3 className="text-3xl font-display font-black text-main tracking-tighter">{value}</h3>
                    {subtext && <p className="text-[9px] font-bold mt-2 text-secondary uppercase tracking-widest opacity-60 font-mono">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl ${colorClass.replace('text', 'bg')}/10 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </motion.div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden">
                {/* Abstract Visual Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -ml-32 -mb-32"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-8 pb-20">
                    {/* Header Block */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em]">
                                <ShieldCheck className="w-4 h-4" />
                                Secured Settlement Registry / 2036
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter uppercase">
                                Liquidity <span className="text-emerald-500 italic font-medium">Capture</span>
                            </h1>
                            <p className="text-secondary text-sm font-medium opacity-60">High-fidelity capital allocation and historical settlement tracking.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => window.print()} className="p-3 glass-panel border border-white/10 hover:border-white/20 transition-all text-secondary hover:text-main">
                                <Printer className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => dispatch(setActiveTab('PAYMENT_IN'))}
                                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all flex items-center gap-3 group"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                Record Inflow
                            </button>
                        </div>
                    </div>

                    {/* Metrics Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricPanel title="Global Inflow" value={formatCurrency(metrics.totalValue)} icon={IndianRupee} colorClass="text-emerald-500" subtext="Aggregated settlement volume" />
                        <MetricPanel title="Resolved Nodes" value={metrics.count} icon={Activity} colorClass="text-primary" subtext="Total transaction indices" />
                        <MetricPanel title="Credit Exposure" value={metrics.creditCount} icon={CreditCard} colorClass="text-amber-500" subtext="Unallocated capital fragments" />
                    </div>

                    {/* Registry Controller */}
                    <div className="space-y-4">
                        <div className="glass-panel p-2 border border-white/5 flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[300px] relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40" />
                                <input 
                                    type="text"
                                    placeholder="Search registry indices or entity signatures..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-main focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-secondary/20"
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <button className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                                    <Filter className="w-4 h-4" /> Filter Temporal
                                </button>
                                <button className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                                    <Download className="w-4 h-4" /> Export Lattice
                                </button>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List Partition */}
                        <div className="glass-panel border border-white/5 overflow-hidden">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Querying Settlement Lattice...</p>
                                </div>
                            ) : filteredPayments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                                    <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center opacity-20 text-emerald-500">
                                        <History className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-black text-main uppercase tracking-tight">Registry Silence</h3>
                                        <p className="text-secondary text-sm font-medium opacity-40 mt-1">No liquidity capture events recorded in the current filter space.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-white/5">
                                                <th className="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Signature</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Entity</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Allocation Mapping</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Protocol</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-[0.3em] text-right">Magnitude</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-[0.3em] text-right">Observation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            <AnimatePresence mode="popLayout">
                                                {paginatedPayments.map((payment, idx) => (
                                                    <motion.tr 
                                                        layout
                                                        key={payment.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        onClick={() => navigate(`/sales/payment-in/${payment.id}`)}
                                                        className="group hover:bg-white/5 transition-all cursor-pointer"
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="font-display font-black text-emerald-500 tracking-tighter uppercase">{payment.receiptNo}</div>
                                                            <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-[0.2em] mt-1">{new Date(payment.date).toLocaleDateString("en-IN")}</div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-500">
                                                                    {payment.customerName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-black text-main uppercase tracking-tight">{payment.customerName}</div>
                                                                    <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest mt-0.5 font-mono">{payment.customerPhone}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-2">
                                                                {payment.allocatedCount && payment.allocatedCount > 0 ? (
                                                                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest">
                                                                        {payment.allocatedCount} Target{payment.allocatedCount > 1 ? 's' : ''}
                                                                    </div>
                                                                ) : (
                                                                    <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                                                                        Advance Lock
                                                                    </div>
                                                                )}
                                                                {(payment.excessAmount || 0) > 0 && (
                                                                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                                                                        Overflow +
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-wrap gap-1">
                                                                {payment.modes.map((mode, mIdx) => (
                                                                    <span key={mIdx} className="px-2 py-1 bg-white/5 border border-white/5 text-secondary/60 text-[8px] font-black uppercase tracking-widest rounded-md">
                                                                        {mode}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right font-display font-black text-main tracking-tighter text-xl">
                                                            {formatCurrency(payment.amount)}
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                                <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500 transition-all flex items-center justify-center hover:shadow-lg hover:shadow-emerald-900/40">
                                                                    <ArrowUpRight className="w-5 h-5 text-white" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Logic */}
                            {totalPages > 1 && (
                                <div className="px-6 py-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
                                    <div className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] opacity-40 font-mono">
                                        Frame <span className="text-main">{currentPage}</span> / {totalPages} — Range [{ (currentPage - 1) * itemsPerPage + 1 }...{ Math.min(currentPage * itemsPerPage, filteredPayments.length) }]
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-10 h-10 glass-panel border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-10 h-10 glass-panel border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border-radius: 1.5rem; }
                .font-display { font-family: 'Outfit', sans-serif; }
            `}</style>
        </Layout>
    );
};

export default PaymentInList;
