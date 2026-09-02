import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Filter, Download, Printer,
    MoreHorizontal, Calendar, IndianRupee, History,
    CreditCard, X, ChevronLeft, ChevronRight,
    ArrowUpRight, Wallet
} from 'lucide-react';
import { setActiveTab } from "../../../redux/slices/uiSlice";
import { getTable } from "../../../services/dataSource";
import Layout from "../../../components/shared/Layout/index";

// Demo Data Interface
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

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const _token = user?.token;

    // Fetch payments on mount
    React.useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const data = await getTable<any>('payments', {});
                if (data) {
                    setPayments(data.map((p: any) => ({
                        id: p.id || p._id,
                        receiptNo: p.receiptNumber || `RCP-${p.id?.slice(-5) || '00000'}`,
                        date: p.paymentDate || p.date,
                        customerName: p.customer?.name || p.customer_name || 'Customer',
                        customerPhone: p.customer?.phone || p.customer_phone || '',
                        amount: p.totalAmount || p.amount || 0,
                        modes: p.paymentMethods?.map((pm: any) => pm.method) || [p.mode || 'Cash'],
                        reference: p.reference || '-',
                        excessAmount: p.excessAmount || 0,
                        allocatedCount: p.allocatedInvoices?.length || 0
                    })));
                }
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    // Filter payments
    const filteredPayments = useMemo(() => {
        if (!searchQuery) return payments;
        const q = searchQuery.toLowerCase();
        return payments.filter(p =>
            p.receiptNo.toLowerCase().includes(q) ||
            p.customerName.toLowerCase().includes(q) ||
            p.customerPhone.includes(q)
        );
    }, [searchQuery, payments]);

    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

    // Dashboard Metrics
    const metrics = useMemo(() => {
        const totalValue = payments.reduce((sum, p) => sum + p.amount, 0);
        const creditCount = payments.filter(p => (p.excessAmount || 0) > 0).length;
        const todayCollections = payments.slice(0, 5).reduce((sum, p) => sum + p.amount, 0); // Mocking today's collections
        return {
            totalValue,
            count: payments.length,
            creditCount,
            todayCollections
        };
    }, [payments]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-secondary opacity-70 font-black uppercase tracking-widest text-[10px]">Reconciling Ledgers...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex-1 w-full bg-app text-main font-sans selection:bg-primary/30 relative">
                {/* Ambient Background Blobs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-15%] left-[5%] w-[55%] h-[55%] bg-success/10 rounded-full blur-[160px] animate-aura opacity-60" />
                    <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px] animate-aura opacity-50" style={{ animationDelay: '7s' }} />
                    <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] animate-aura opacity-40" style={{ animationDelay: '3s' }} />
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                    {/* Header */}
                    <header className="flex justify-between items-end">
                        <div className="relative pl-5">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.5)]" />
                            <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                                Payment <span className="text-primary">Intelligence</span>
                                <span className="px-3 py-1 bg-success/10 border border-success/20 text-success rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3" /> Collections
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-secondary">Real-Time Revenue Monitoring</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-card border border-default text-xs font-black uppercase tracking-widest text-muted hover:text-main hover:border-primary/30 transition-all">
                                <Download className="w-4 h-4" /> Export Ledger
                            </button>
                            <button 
                                onClick={() => dispatch(setActiveTab('PAYMENT_IN'))}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-xs font-black uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" /> Record Payment
                            </button>
                        </div>
                    </header>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Collections', val: formatCurrency(metrics.totalValue), icon: IndianRupee, color: 'success', trend: '+14.2%' },
                            { label: 'Today Collections', val: formatCurrency(metrics.todayCollections), icon: Wallet, color: 'primary', trend: 'Live' },
                            { label: 'Transactions', val: metrics.count, icon: History, color: 'info', trend: 'Monthly' },
                            { label: 'With Excess', val: metrics.creditCount, icon: CreditCard, color: 'warning', trend: 'Credit' }
                        ].map((stat, i) => (
                            <div key={i} className="glass-panel border border-default rounded-sm p-6 group hover:border-primary/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 bg-${stat.color}/10 text-${stat.color} rounded-sm`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[10px] font-black ${stat.trend.includes('+') ? 'text-success bg-success/10' : 'text-primary bg-primary/10'} px-2 py-1 rounded-full`}>
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
                                placeholder="Search receipt #, customer name, or phone..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-card border border-default rounded-sm py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-main placeholder:text-secondary"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-app border border-default rounded-sm text-[10px] font-black uppercase tracking-widest text-main hover:border-primary/30 transition-all">
                                <Filter className="w-3 h-3" /> Advanced Filters
                            </button>
                            <button 
                                onClick={() => setSearchQuery('')}
                                className={`flex items-center gap-2 px-4 py-2 bg-app border border-default rounded-sm text-[10px] font-black uppercase tracking-widest text-secondary hover:text-main transition-all ${!searchQuery && 'opacity-50 cursor-not-allowed'}`}
                            >
                                <X className="w-3 h-3" /> Clear
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="glass-panel rounded-sm border border-default overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface/50 sticky top-0 z-20 border-b border-default">
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-secondary">
                                        <th className="px-6 py-4">Receipt No</th>
                                        <th className="px-6 py-4">Date / Customer</th>
                                        <th className="px-6 py-4">Allocation</th>
                                        <th className="px-6 py-4">Modes</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {paginatedPayments.length > 0 ? (
                                        paginatedPayments.map((payment) => (
                                            <tr 
                                                key={payment.id} 
                                                className="hover:bg-primary/[0.03] transition-all group cursor-pointer"
                                                onClick={() => navigate(`/sales/payment-in/${payment.id}`)}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                            <IndianRupee className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="font-mono text-sm font-bold text-main tracking-tighter group-hover:text-primary transition-colors">
                                                            {payment.receiptNo}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-main text-sm">{payment.customerName}</div>
                                                    <div className="text-[10px] text-secondary font-black uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        {payment.allocatedCount && payment.allocatedCount > 0 ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest bg-info/10 text-info border border-info/20">
                                                                {payment.allocatedCount} Invoices
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200">
                                                                Advance
                                                            </span>
                                                        )}
                                                        {(payment.excessAmount || 0) > 0 && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest bg-success/10 text-success border border-success/20">
                                                                +Credit
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {payment.modes.map((mode, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-surface/50 text-secondary border border-default/30 text-[9px] uppercase font-black rounded-sm">
                                                                {mode}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="text-lg font-display font-black tracking-tighter text-main tabular-nums">{formatCurrency(payment.amount)}</div>
                                                    <div className="text-[9px] text-success font-black uppercase tracking-widest mt-1">Verified</div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            className="p-2 rounded-sm bg-card border border-default text-muted hover:text-primary transition-all"
                                                            title="Print Receipt"
                                                            onClick={(e) => { e.stopPropagation(); window.print(); }}
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 rounded-sm bg-card border border-default text-muted hover:text-main transition-all">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-card rounded-full border border-default">
                                                        <Search className="w-8 h-8 text-muted" />
                                                    </div>
                                                    <p className="text-sm font-medium text-muted">No payment records found.</p>
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
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
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
                                            ? 'bg-primary text-white shadow-sm border border-primary' 
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
        </Layout>
    );
};

export default PaymentInList;
