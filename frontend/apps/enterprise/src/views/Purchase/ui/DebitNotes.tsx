import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import { useBranchResolver } from "@/hooks/useBranchResolver";
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
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
} from 'lucide-react';
import { getAllBills } from "@/entities/finance/model/billSlice";
import { fetchPurchaseOrders } from "@/entities/purchase/model/purchaseSlice";
import { AppDispatch } from "@/app/store/store";
import { useDispatch } from 'react-redux';
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

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    DRAFT: { label: 'Drafted', icon: FileText, color: 'text-neutral-600', bg: 'bg-neutral-100' },
    SENT: { label: 'Sent', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    ACKNOWLEDGED: { label: 'Acknowledged', icon: CheckCircle, color: 'text-info', bg: 'bg-info/10' },
    SETTLED: { label: 'Settled', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' }
};

const DebitNotes: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { orders, grns } = useSelector((state: RootState) => state.purchase);
    const { bills } = useSelector((state: RootState) => state.bill);
    const { suppliers: vendors } = useSelector((state: RootState) => state.suppliers);
    const {  currentBranch  } = useAuthStore();
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
    }, [dispatch]);

    useEffect(() => {
        fetchDebitNotes();
    }, []);

    const fetchDebitNotes = async () => {
        try {
            const data = await debitNoteService.getDebitNotes();
            setDebitNotes(data);
        } catch (error: any) {
            toast.error('Failed to fetch debit notes');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
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

    // Summary
    const totalAmount = filteredNotes.reduce((acc, n) => acc + n.totalAmount, 0);
    const approvedAmount = filteredNotes.filter(n => n.status === 'SETTLED').reduce((acc, n) => acc + n.totalAmount, 0);
    const pendingCount = filteredNotes.filter(n => n.status === 'SENT').length;

    const getStatusBadge = (status: string) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
        const Icon = config.icon;
        return (
            <span className={`px-2 py-1 ${config.bg} ${config.color} text-xs font-bold rounded-full flex items-center gap-1`}>
                <Icon className="w-3 h-3" /> {config.label}
            </span>
        );
    };

    const getReasonBadge = (reason: string) => {
        const colors: Record<string, string> = {
            SHORT_DELIVERY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            QUALITY_ISSUE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            RETURN_SHIPPING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            SERVICE_CHARGE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            PRICE_DIFFERENCE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            OTHER: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
        };
        return <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${colors[reason] || colors.OTHER}`}>
            {REASON_LABELS[reason] || reason}
        </span>;
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Debit Notes"
                    description={`Track returns and claims against suppliers • ${getBranchName(currentBranchId)}`}
                    actions={
                        <>
                            <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                                <Download className="w-4 h-4" /> Export
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-error text-white rounded-lg text-sm font-bold hover:bg-error/90 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Create Debit Note
                            </button>
                        </>
                    }
                />

                <DebitNoteStats
                    totalCount={filteredNotes.length}
                    totalAmount={totalAmount}
                    approvedAmount={approvedAmount}
                    pendingCount={pendingCount}
                />

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">Search</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="DN # or Vendor..."
                                className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">From</label>
                        <input
                            type="date"
                            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">To</label>
                        <input
                            type="date"
                            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">Status</label>
                        <select
                            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="SENT">Sent</option>
                            <option value="ACKNOWLEDGED">Acknowledged</option>
                            <option value="SETTLED">Settled</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-secondary font-bold uppercase mb-1 block">Reason</label>
                        <select
                            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={reasonFilter}
                            onChange={e => setReasonFilter(e.target.value)}
                        >
                            <option value="ALL">All Reasons</option>
                            <option value="RETURN">Goods Return</option>
                            <option value="PRICE_DIFF">Price Difference</option>
                            <option value="QUALITY">Quality Issue</option>
                            <option value="SHORTAGE">Short Shipment</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <button
                        onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setReasonFilter('ALL'); setDateFrom(''); setDateTo(''); }}
                        className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold"
                    >
                        Clear
                    </button>
                </div>

                {/* Debit Notes Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-secondary uppercase text-xs font-medium">
                                <tr>
                                    <th className="p-4">DN #</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Vendor</th>
                                    <th className="p-4">PO Ref</th>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4 text-right">Amount</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {loading ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
                                            <p>Loading debit notes...</p>
                                        </div>
                                    </td></tr>
                                ) : filteredNotes.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <RotateCcw className="w-8 h-8 text-neutral-300" />
                                            <p>No debit notes found</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    filteredNotes.map(note => (
                                        <tr key={note._id || note.noteId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                            <td className="p-4 font-mono text-xs text-error font-medium">{note.noteId}</td>
                                            <td className="p-4 text-neutral-600 dark:text-neutral-400">
                                                {new Date(note.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Truck className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium text-neutral-900 dark:text-white">{note.vendorName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-neutral-500">{note.originalBillNumber || note.originalGrnNumber || '-'}</td>
                                            <td className="p-4">{getReasonBadge(note.reason)}</td>
                                            <td className="p-4 text-right font-bold text-error">₹{note.totalAmount.toLocaleString()}</td>
                                            <td className="p-4 text-center">{getStatusBadge(note.status)}</td>
                                            <td className="p-4 text-center">
                                                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg" title="View">
                                                    <Eye className="w-4 h-4 text-primary" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                        {filteredNotes.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">No debit notes</div>
                        ) : (
                            filteredNotes.map(note => (
                                <div key={note._id || note.noteId} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-mono text-xs text-error font-medium">{note.noteId}</p>
                                            <p className="font-bold text-neutral-900 dark:text-white">{note.vendorName}</p>
                                        </div>
                                        {getStatusBadge(note.status)}
                                    </div>
                                    <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg mt-2">
                                        <div className="flex items-center gap-2">
                                            {getReasonBadge(note.reason)}
                                        </div>
                                        <p className="font-bold text-error">₹{note.totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Create Modal */}
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
            </div>
        </Layout>
    );
};

export default DebitNotes;
