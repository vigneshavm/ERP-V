import { useAuthStore } from '@repo/shared';
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import { useBranchResolver } from "@/hooks/useBranchResolver";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import {
    Search,
    FileText,
    Download,
    Plus,
    Eye,
    Truck,
    RotateCcw,
    CheckCircle,
    Clock,
    Loader2,
    ShieldCheck,
    Database,
    Zap,
    Filter,
    ArrowUpRight,
    TrendingDown,
    Building2,
    CalendarDays,
    ChevronRight,
    Search as SearchIcon
} from 'lucide-react';
import { getAllBills } from "@/entities/finance/model/billSlice";
import { fetchPurchaseOrders } from "@/entities/purchase/model/purchaseSlice";
import { debitNoteService, DebitNote } from "@/entities/finance/api/debitNoteService";
import { toast } from 'react-toastify';
import CreateDebitNoteModal from '../Modals/CreateDebitNoteModal';
import DebitNoteStats from '../Components/DebitNoteStats';

const REASON_LABELS: Record<string, string> = {
    SHORT_DELIVERY: 'Short Delivery',
    QUALITY_ISSUE: 'Quality Issue',
    RETURN_SHIPPING: 'Return Shipping Cost',
    SERVICE_CHARGE: 'Service Charge',
    PRICE_DIFFERENCE: 'Price Difference',
    OTHER: 'Other'
};

const DebitNotes: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { orders, grns } = useSelector((state: RootState) => state.purchase);
    const { bills } = useSelector((state: RootState) => state.bill);
    const { suppliers: vendors } = useSelector((state: RootState) => state.suppliers);
    const { currentBranchId, getBranchName } = useBranchResolver();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [reasonFilter, setReasonFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(getAllBills({}));
        dispatch(fetchPurchaseOrders());
        fetchDebitNotes();
    }, [dispatch]);

    const fetchDebitNotes = async () => {
        setLoading(true);
        try {
            const data = await debitNoteService.getDebitNotes();
            setDebitNotes(data);
        } catch (error: any) {
            toast.error('Failed to fetch debit notes');
            setDebitNotes([]); // Fallback
        } finally {
            setLoading(false);
        }
    };

    const filteredNotes = useMemo(() => {
        return debitNotes.filter(note => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!note.vendorName.toLowerCase().includes(search) &&
                    !note.noteId.toLowerCase().includes(search)) {
                    return false;
                }
            }
            if (statusFilter !== 'ALL' && note.status !== statusFilter) return false;
            if (reasonFilter !== 'ALL' && note.reason !== reasonFilter) return false;
            if (dateFrom && new Date(note.date) < new Date(dateFrom)) return false;
            if (dateTo) {
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                if (new Date(note.date) >= nextDay) return false;
            }
            return true;
        });
    }, [debitNotes, searchTerm, statusFilter, reasonFilter, dateFrom, dateTo]);

    const stats = useMemo(() => {
        const totalAmount = filteredNotes.reduce((acc, n) => acc + n.totalAmount, 0);
        const approvedAmount = filteredNotes.filter(n => n.status === 'SETTLED').reduce((acc, n) => acc + n.totalAmount, 0);
        const pendingCount = filteredNotes.filter(n => n.status === 'SENT').length;
        return { totalAmount, approvedAmount, pendingCount };
    }, [filteredNotes]);

    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase();
        const config: any = {
            'DRAFT': { color: 'neutral', icon: FileText, label: 'Drafted' },
            'SENT': { color: 'blue', icon: Clock, label: 'Transmitted' },
            'ACKNOWLEDGED': { color: 'indigo', icon: ShieldCheck, label: 'Verified' },
            'SETTLED': { color: 'emerald', icon: CheckCircle, label: 'Settled' },
            'REJECTED': { color: 'rose', icon: RotateCcw, label: 'Variance' },
        };
        const { color, icon: Icon, label } = config[s] || config.DRAFT;
        
        return (
            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-${color === 'neutral' ? 'neutral-100 dark:bg-neutral-800 text-neutral-500' : `${color}-500/10 text-${color}-600 dark:text-${color}-400 border border-${color}-500/20`}`}>
                <Icon className="w-3 h-3" /> {label}
            </span>
        );
    };

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Cinematic Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-rose-500/20">Fiscal Recovery</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{getBranchName(currentBranchId)}</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Debit Ledgers <TrendingDown className="w-8 h-8 text-rose-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Managing returns, variances, and capital recovery protocols against suppliers.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <button className="p-3.5 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 text-neutral-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm group">
                            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Initiate Claim</span>
                        </button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <DebitNoteStats
                    totalCount={filteredNotes.length}
                    totalAmount={stats.totalAmount}
                    approvedAmount={stats.approvedAmount}
                    pendingCount={stats.pendingCount}
                />

                {/* Operations Islands */}
                <div className="erp-card rounded-[3rem] p-8 border-none shadow-sm space-y-8 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Filter className="w-64 h-64 text-rose-500" />
                    </div>

                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-sm">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none text-brand-colors">Recovery Command</h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Filtering and Intercepting Claim Protocols</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="relative group/search col-span-1 md:col-span-2">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within/search:text-rose-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Claim # or Vendor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all shadow-inner uppercase tracking-tight italic"
                            />
                        </div>

                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none transition-all shadow-inner appearance-none uppercase tracking-widest italic text-neutral-600 dark:text-neutral-400 cursor-pointer"
                            >
                                <option value="ALL">Universal status</option>
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="ACKNOWLEDGED">Acknowledged</option>
                                <option value="SETTLED">Settled</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <select
                                value={reasonFilter}
                                onChange={(e) => setReasonFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none transition-all shadow-inner appearance-none uppercase tracking-widest italic text-neutral-600 dark:text-neutral-400 cursor-pointer"
                            >
                                <option value="ALL">Universal Reasons</option>
                                {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>

                         <div className="flex gap-4 col-span-1 md:col-span-2">
                            <div className="relative flex-1">
                                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none transition-all shadow-inner uppercase tracking-widest italic text-neutral-600 dark:text-neutral-400"
                                />
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-[1.5rem] text-xs font-bold focus:ring-2 focus:ring-rose-500/10 outline-none transition-all shadow-inner uppercase tracking-widest italic text-neutral-600 dark:text-neutral-400"
                                />
                            </div>
                        </div>

                         <div className="flex lg:flex px-6 py-4 bg-rose-500/10 rounded-full border border-rose-500/10 items-center gap-2 col-span-1 md:col-span-2">
                             <Database className="w-3.5 h-3.5 text-rose-500" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">Sync Active • {filteredNotes.length} Nodes Intercepted</span>
                         </div>
                    </div>
                </div>

                {/* Audit Registry Matrix */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    <div className="overflow-x-auto px-2">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-2">Claim Identity</th>
                                    <th className="px-8 py-2">Target Entity</th>
                                    <th className="px-8 py-2 text-center">Reference Mapping</th>
                                    <th className="px-8 py-2 text-right">Aggregate Value</th>
                                    <th className="px-8 py-2 text-center">Protocol State</th>
                                    <th className="px-8 py-2 text-right">Commands</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin mb-6" />
                                                <p className="text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse italic">Synchronizing Recovery Matrix...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredNotes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] text-neutral-200 mb-6">
                                                    <RotateCcw className="w-16 h-16" />
                                                </div>
                                                <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Claim Null</h3>
                                                <p className="text-sm font-bold text-neutral-500 mt-2 italic">No fiscal claims detected in current registry.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredNotes.map((n) => (
                                        <tr
                                            key={n._id || n.noteId}
                                            className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                                        >
                                            <td className="px-2 py-1">
                                                <div className="bg-white dark:bg-neutral-900 rounded-l-[1.5rem] p-6 border-y border-l border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all">
                                                    <div className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tighter italic leading-none mb-1 group-hover/row:text-rose-500">
                                                        #{n.noteId}
                                                    </div>
                                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">
                                                        Logged {new Date(n.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-0 py-1">
                                                <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all">
                                                    <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-widest italic truncate max-w-[200px]">
                                                        {n.vendorName}
                                                    </div>
                                                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-1 block leading-none italic">Verified Trading Partner</span>
                                                </div>
                                            </td>
                                            <td className="px-0 py-1 text-center">
                                                <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all">
                                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter italic leading-none mb-1">
                                                        {n.originalBillNumber || n.originalGrnNumber || 'MANUAL'}
                                                    </div>
                                                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest leading-none italic">Parent Protocol</span>
                                                </div>
                                            </td>
                                            <td className="px-0 py-1 text-right">
                                                <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all font-mono font-black text-rose-500 italic text-sm">
                                                    ₹ {(n.totalAmount || 0).toLocaleString('en-IN')}
                                                </div>
                                            </td>
                                            <td className="px-0 py-1 text-center">
                                                <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all flex justify-center">
                                                    {getStatusBadge(n.status)}
                                                </div>
                                            </td>
                                            <td className="px-0 py-1 text-right">
                                                <div className="bg-white dark:bg-neutral-900 rounded-r-[1.5rem] p-6 border-y border-r border-default dark:border-neutral-800 group-hover/row:border-rose-500/20 transition-all">
                                                    <button className="p-3 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 group-hover/row:text-rose-500 rounded-xl transition-all shadow-sm">
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Global Verification Footprint */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Recovery Protocol Shield Verified • BizzAI Intelligence Core</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>

                <CreateDebitNoteModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchDebitNotes();
                    }}
                    vendors={vendors}
                    bills={bills}
                    grns={grns}
                    REASON_LABELS={REASON_LABELS}
                />
            </PageShell>
        </Layout>
    );
};

export default DebitNotes;
