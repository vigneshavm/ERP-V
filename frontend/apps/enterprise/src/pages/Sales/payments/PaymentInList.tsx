import { logger } from '@/shared/lib/logger';
import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Filter, Download, Printer, Eye,
    MoreHorizontal, Calendar, IndianRupee, History,
    CreditCard, X, TrendingUp, ArrowUpRight, ShieldCheck,
    Wallet, Banknote, Sparkles
} from 'lucide-react';
import { RootState } from "@/app/store/store";
import { getTable } from "@/shared/api/dataSource";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";

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
                logger.error('Error fetching payments:', error);
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

    // Dashboard Metrics
    const metrics = useMemo(() => {
        const totalValue = payments.reduce((sum, p) => sum + p.amount, 0);
        const creditCount = payments.filter(p => (p.excessAmount || 0) > 0).length;
        return {
            totalValue,
            count: payments.length,
            creditCount
        };
    }, [payments]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR', 
            maximumFractionDigits: 0 
        }).format(amount);
    };

    if (loading && (!payments || payments.length === 0)) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                        <Wallet className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Syncing Fiscal Matrix...</p>
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
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">Fiscal Node</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Inbound Cash Flow</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Collections Center <Wallet className="w-8 h-8 text-emerald-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Advanced reconciliation of customer liquidity injections.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="p-4 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-2xl text-neutral-500 hover:bg-neutral-50 transition-all shadow-sm"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/sales/payment-in')}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Record Inflow</span>
                        </button>
                    </div>
                </div>

                {/* Fiscal KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Total Collections', value: formatCurrency(metrics.totalValue), icon: IndianRupee, color: 'emerald', sub: 'Liquidity Optimal' },
                        { label: 'Global Cycles', value: metrics.count, icon: History, color: 'blue', status: 'Cycle Nominal' },
                        { label: 'Excess/Credit Gap', value: metrics.creditCount, icon: CreditCard, color: 'amber', alert: metrics.creditCount > 0 }
                    ].map((kpi, i) => (
                        <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <kpi.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{kpi.label}</p>
                                    <h3 className={`text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic`}>
                                        {kpi.value}
                                    </h3>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    {kpi.sub && (
                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{kpi.sub}</p>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full bg-${kpi.color}-500 animate-pulse`} />
                                        <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${kpi.alert ? 'text-amber-500' : 'text-neutral-400'}`}>
                                            {kpi.status || (kpi.alert ? 'Reconciliation Spike' : 'Matrix Stable')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Fiscal Operations Matrix */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    {/* Command Search & Filter Island */}
                    <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
                        <div className="relative w-full lg:max-w-xl group/search">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Intercept Receipt # or Customer Identity..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-neutral-900 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                             {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-6 py-3 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-rose-500 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <X className="w-3.5 h-3.5" /> Abort Filter
                                </button>
                            )}
                            <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 transition-all shadow-sm flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5" /> Matrix Filters
                            </button>
                            <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 transition-all shadow-sm flex items-center gap-2">
                                <Download className="w-3.5 h-3.5" /> Export Data
                            </button>
                        </div>
                    </div>

                    {/* Collection Table */}
                    <div className="overflow-x-auto px-2">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-2">Receipt Identification</th>
                                    <th className="px-8 py-2">Entity Participant</th>
                                    <th className="px-8 py-2">Fiscal Allocation</th>
                                    <th className="px-8 py-2">Inflow Mode</th>
                                    <th className="px-8 py-2 text-right">Settled Amount</th>
                                    <th className="px-8 py-2 text-right">Commands</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] mb-6 text-neutral-200 animate-in zoom-in duration-500">
                                                    <Banknote className="w-16 h-16" />
                                                </div>
                                                <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Fiscal Null</h3>
                                                <p className="text-sm font-bold text-neutral-500 mt-2 italic max-w-sm">
                                                    Zero collection signals detected in current matrix range.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <tr 
                                            key={payment.id}
                                            className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-default"
                                        >
                                            <td className="px-2 py-1">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-emerald-500/20 group-hover/row:shadow-xl group-hover/row:shadow-emerald-500/5 transition-all relative overflow-hidden"
                                                     onClick={() => navigate(`/sales/payment-in/${payment.id}`)}
                                                >
                                                    <div className="relative z-10">
                                                        <button className="text-lg font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter italic hover:opacity-70 transition-opacity">
                                                            {payment.receiptNo}
                                                        </button>
                                                        <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(payment.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/row:opacity-10 transition-opacity">
                                                        <IndianRupee className="w-12 h-12" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-1">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs mr-4 border border-emerald-500/20">
                                                            {payment.customerName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-1">{payment.customerName}</div>
                                                            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">{payment.customerPhone}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-1">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all flex items-center gap-2">
                                                    {payment.allocatedCount && payment.allocatedCount > 0 ? (
                                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                                            {payment.allocatedCount} Allocations
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                                            Advance Node
                                                        </span>
                                                    )}
                                                    {(payment.excessAmount || 0) > 0 && (
                                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                                            +Credit Pulse
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {payment.modes.map((mode, idx) => (
                                                            <span key={idx} className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-default dark:border-neutral-700 text-[10px] font-black uppercase tracking-widest rounded-lg italic">
                                                                {mode}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-emerald-600 dark:text-emerald-400 italic text-xl">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                <div className="flex justify-end gap-3 pr-4">
                                                    <button
                                                        onClick={() => navigate(`/sales/payment-in/${payment.id}`)}
                                                        className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 group/eye"
                                                    >
                                                        <Eye className="w-5 h-5 group-hover/eye:scale-110 transition-transform" />
                                                    </button>
                                                    <button 
                                                        onClick={() => window.print()}
                                                        className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 group/print"
                                                    >
                                                        <Printer className="w-5 h-5 group-hover/print:scale-110 transition-transform" />
                                                    </button>
                                                    <button className="p-4 bg-neutral-50 dark:bg-neutral-800/30 text-neutral-400 rounded-2xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all shadow-sm active:scale-95">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fiscal Matrix Footer */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Fiscal Integrity Verified • Collection Stream: {payments.length} Nodes</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>
        </Layout>
    );
};

export default PaymentInList;
