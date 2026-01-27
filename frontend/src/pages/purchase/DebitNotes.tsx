import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useBranchResolver } from '../../hooks/useBranchResolver';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import {
    Search,
    Calendar,
    FileText,
    TrendingDown,
    Download,
    Plus,
    Eye,
    Truck,
    RotateCcw,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Trash2
} from 'lucide-react';
import { debitNoteService, DebitNote, DebitNoteItem } from '../../services/debitNoteService';
import { toast } from 'react-toastify';


const REASON_LABELS: Record<string, string> = {
    RETURN: 'Goods Return',
    PRICE_DIFF: 'Price Difference',
    QUALITY: 'Quality Issue',
    SHORTAGE: 'Short Shipment',
    OTHER: 'Other'
};

const DebitNotes: React.FC = () => {
    const { orders } = useSelector((state: RootState) => state.purchase);
    const { vendors } = useSelector((state: RootState) => state.vendor);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { getBranchName } = useBranchResolver();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [reasonFilter, setReasonFilter] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState<Partial<DebitNote>>({
        reason: 'RETURN',
        items: [{ name: '', qty: 1, amount: 0 }],
        notes: ''
    });

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

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newNote.vendorId) {
            toast.error('Please select a vendor');
            return;
        }

        const selectedVendor = vendors.find(v => v._id === newNote.vendorId);
        const finalNote = {
            ...newNote,
            vendorName: selectedVendor?.name || '',
            totalAmount: newNote.items?.reduce((sum, item) => sum + item.amount, 0) || 0
        };

        try {
            await debitNoteService.createDebitNote(finalNote);
            toast.success('Debit note created successfully');
            setShowCreateModal(false);
            fetchDebitNotes();
            setNewNote({
                reason: 'RETURN',
                items: [{ name: '', qty: 1, amount: 0 }],
                notes: ''
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create debit note');
        }
    };

    const addItem = () => {
        setNewNote({
            ...newNote,
            items: [...(newNote.items || []), { name: '', qty: 1, amount: 0 }]
        });
    };

    const removeItem = (index: number) => {
        const items = [...(newNote.items || [])];
        items.splice(index, 1);
        setNewNote({ ...newNote, items });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const items = [...(newNote.items || [])];
        items[index] = { ...items[index], [field]: value };
        setNewNote({ ...newNote, items });
    };

    // Apply filters
    const filteredNotes = useMemo(() => {
        return debitNotes.filter(note => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!note.vendorName.toLowerCase().includes(search) &&
                    !note.id.toLowerCase().includes(search)) {
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
    const approvedAmount = filteredNotes.filter(n => n.status === 'APPROVED').reduce((acc, n) => acc + n.totalAmount, 0);
    const pendingCount = filteredNotes.filter(n => n.status === 'PENDING').length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="px-2 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Approved
                </span>;
            case 'PENDING':
                return <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                </span>;
            case 'DRAFT':
                return <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-bold rounded-full flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Draft
                </span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-error/10 text-error text-xs font-bold rounded-full flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Rejected
                </span>;
            default:
                return null;
        }
    };

    const getReasonBadge = (reason: string) => {
        const colors: Record<string, string> = {
            RETURN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            PRICE_DIFF: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            QUALITY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            SHORTAGE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
                    description={`Track returns and claims against suppliers • ${getBranchName(currentBranch)}`}
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

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-secondary uppercase tracking-wide">Total Notes</p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{filteredNotes.length}</p>
                            </div>
                            <div className="p-3 bg-error/10 rounded-xl">
                                <FileText className="w-6 h-6 text-error" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Amount</p>
                                <p className="text-2xl font-bold text-error mt-1">₹{totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-error/10 rounded-xl">
                                <TrendingDown className="w-6 h-6 text-error" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-secondary uppercase tracking-wide">Approved Claims</p>
                                <p className="text-2xl font-bold text-success mt-1">₹{approvedAmount.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-success/10 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-secondary uppercase tracking-wide">Pending Approval</p>
                                <p className="text-2xl font-bold text-warning mt-1">{pendingCount}</p>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-xl">
                                <Clock className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                    </div>
                </div>

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
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
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
                                            <td className="p-4 font-mono text-xs text-neutral-500">{note.poReference || '-'}</td>
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
                {showCreateModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Create Debit Note</h2>
                                    <p className="text-xs text-neutral-500 font-medium">Issue a claim or return to a supplier</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                                >
                                    <XCircle className="w-6 h-6 text-neutral-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateNote} className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Vendor / Supplier</label>
                                        <select
                                            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-error/20"
                                            value={newNote.vendorId}
                                            onChange={(e) => setNewNote({ ...newNote, vendorId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Vendor</option>
                                            {vendors.map(v => (
                                                <option key={v._id} value={v._id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Reason</label>
                                        <select
                                            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-error/20"
                                            value={newNote.reason}
                                            onChange={(e) => setNewNote({ ...newNote, reason: e.target.value as any })}
                                            required
                                        >
                                            {Object.entries(REASON_LABELS).map(([val, label]) => (
                                                <option key={val} value={val}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Items / Adjustments</label>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="text-xs font-black text-error uppercase tracking-widest hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Item
                                        </button>
                                    </div>

                                    {newNote.items?.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Item name or description"
                                                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm text-center"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value))}
                                                    required
                                                />
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm text-right"
                                                    value={item.amount}
                                                    onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value))}
                                                    required
                                                />
                                            </div>
                                            {newNote.items!.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    className="p-2 text-neutral-400 hover:text-error transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 block">Notes / Observations</label>
                                    <textarea
                                        className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm focus:ring-2 focus:ring-error/20"
                                        rows={3}
                                        value={newNote.notes}
                                        onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                                        placeholder="Add any additional details here..."
                                    ></textarea>
                                </div>

                                <div className="pt-6 border-t border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                                    <div className="text-lg font-black text-error">
                                        Total: ₹{newNote.items?.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="px-6 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-200"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-2 bg-error text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-error/90 shadow-lg shadow-error/20 transform active:scale-95 transition-all"
                                        >
                                            Deploy Debit Note
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DebitNotes;
