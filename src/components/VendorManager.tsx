
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
    fetchVendors,
    recordVendorTransaction,
    addVendor,
    updateVendor,
    deleteVendor,
    resetVendors
} from '../store/vendorSlice';
import { Vendor, VendorTransaction } from '../types/vendor';
import {
    Users, Plus, Search, Filter, ArrowUpRight, ArrowDownLeft,
    FileText, Phone, MapPin, Landmark, History, ChevronRight,
    Loader2, AlertCircle, Trash2, Pencil, CheckCircle2, IndianRupee, ArrowLeft, PlusCircle, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setSelectedVendor } from '../store/vendorSlice';
import { setActiveTab } from '../store/uiSlice';
import { supabase } from '../lib/supabase';

const VendorManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { vendors, isLoading, error } = useSelector((state: RootState) => state.vendor);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendorForModal, setSelectedVendorForModal] = useState<Vendor | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [vendorHistory, setVendorHistory] = useState<VendorTransaction[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [paymentData, setPaymentData] = useState({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchVendors());
        return () => {
            dispatch(resetVendors());
        };
    }, [dispatch]);


    const fetchHistory = async (vendorId: string) => {
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('vendor_transactions')
                .select('*')
                .eq('vendor_id', vendorId)
                .order('date', { ascending: false });
            if (error) throw error;
            setVendorHistory(data.map(tx => ({
                id: tx.id,
                tenantId: tx.tenant_id,
                vendorId: tx.vendor_id,
                type: tx.type,
                amount: tx.amount,
                balanceAfter: tx.balance_after,
                date: tx.date,
                description: tx.description,
                referenceId: tx.reference_id
            })));
            setIsHistoryOpen(true);
        } catch (err: any) {
            console.error('Failed to fetch history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const resetForm = () => {
        setPaymentData({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
        setSelectedVendorForModal(null);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendorForModal || paymentData.amount <= 0) return;

        try {
            await dispatch(recordVendorTransaction(
                selectedVendorForModal.id,
                'PAYMENT',
                paymentData.amount,
                paymentData.description || 'Vendor Payment',
                undefined
            ));
            setIsPaymentOpen(false);
            resetForm();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.phone?.includes(searchTerm) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = vendors.filter(v => v.status === 'Active').length;
    const inactiveCount = vendors.filter(v => v.status === 'Inactive').length;

    const handleDeleteClick = (vendor: Vendor) => {
        setVendorToDelete(vendor);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!vendorToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteVendor(vendorToDelete.id));
            setIsDeleteModalOpen(false);
            setVendorToDelete(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Vendor Management
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Track wholesalers, bills, and payables.</p>
                </div>
                <button
                    onClick={() => {
                        dispatch(setSelectedVendor(null));
                        dispatch(setActiveTab('VENDOR_FORM'));
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-5 h-5" /> Add New Vendor
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Suppliers</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{vendors.length}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Active Suppliers</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{activeCount}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-slate-400">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inactive Suppliers</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{inactiveCount}</h3>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search vendors by name, phone, or GSTIN..."
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4">Business / Supplier Name</th>
                                <th className="px-6 py-4">Contact Person</th>
                                <th className="px-6 py-4">Phone / Email</th>
                                <th className="px-6 py-4">Balance Status</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium tracking-tight">Accessing supplier registry...</p>
                                    </td>
                                </tr>
                            ) : filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">No Suppliers Found</h4>
                                        <p className="text-slate-500 text-sm mt-1">Try adjusting your search or add a new supplier.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVendors.map(vendor => (
                                    <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{vendor.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {vendor.id.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{vendor.contactPerson || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    <Phone className="w-3 h-3" /> {vendor.phone || 'NA'}
                                                </div>
                                                {vendor.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <FileText className="w-3 h-3" /> {vendor.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-black ${vendor.currentBalance >= 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                    ₹{Math.abs(vendor.currentBalance).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {vendor.currentBalance >= 0 ? 'Payable' : 'Advance'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${vendor.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {vendor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/suppliers/${vendor.id}`)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedVendorForModal(vendor); setIsPaymentOpen(true); }}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                    title="Record Payment"
                                                >
                                                    <IndianRupee className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        dispatch(setSelectedVendor(vendor));
                                                        dispatch(setActiveTab('VENDOR_FORM'));
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    title="Edit Supplier"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => fetchHistory(vendor.id)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                    title="View Ledger"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(vendor)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Delete Supplier"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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


            {/* Payment Modal */}
            {isPaymentOpen && selectedVendorForModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tight">Record Payment</h3>
                            <button onClick={() => setIsPaymentOpen(false)} className="text-white/60 hover:text-white transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Paying To</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedVendorForModal.name}</p>
                                <p className="text-sm font-bold text-red-600 mt-1">Outstanding: ₹{selectedVendorForModal.currentBalance.toLocaleString()}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Amount</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-white font-black text-xl"
                                        placeholder="0.00"
                                        value={paymentData.amount || ''}
                                        onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-white"
                                    value={paymentData.date}
                                    onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Notes / Reference</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-white text-sm"
                                    placeholder="e.g. Paid via UPI / Cheque #12345"
                                    value={paymentData.description}
                                    onChange={e => setPaymentData({ ...paymentData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsPaymentOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center shadow-lg">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Financial Ledger</h3>
                                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Transaction history for selected vendor</p>
                            </div>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-slate-900">
                            {vendorHistory.length === 0 ? (
                                <div className="py-20 text-center">
                                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold">No transactions recorded yet.</p>
                                </div>
                            ) : (
                                <table className="w-full border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <th className="px-4 text-left">Date</th>
                                            <th className="px-4 text-left">Type</th>
                                            <th className="px-4 text-left">Description</th>
                                            <th className="px-4 text-right">Debit / Credit</th>
                                            <th className="px-4 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendorHistory.map(tx => (
                                            <tr key={tx.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm group border border-slate-100 dark:border-slate-700/50">
                                                <td className="px-4 py-4 rounded-l-xl text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tx.type === 'PURCHASE' ? 'bg-amber-100 text-amber-700' :
                                                        tx.type === 'PAYMENT' ? 'bg-sky-100 text-sky-700' :
                                                            tx.type === 'RETURN' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {tx.description}
                                                    {tx.referenceId && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {tx.referenceId}</p>}
                                                </td>
                                                <td className={`px-4 py-4 text-right font-black ${tx.amount > 0 ? 'text-orange-600' : 'text-sky-600'}`}>
                                                    {tx.amount > 0 ? `+ ₹${tx.amount.toLocaleString()}` : `- ₹${Math.abs(tx.amount).toLocaleString()}`}
                                                </td>
                                                <td className="px-4 py-4 rounded-r-xl text-right font-black text-slate-900 dark:text-white">
                                                    ₹{tx.balanceAfter.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && vendorToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Delete Supplier?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                You are about to remove <span className="font-black text-rose-600">{vendorToDelete.name}</span>. This action is critical and cannot be easily undone.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorManager;
