
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
    fetchVendors,
    recordVendorTransaction,
    addVendor,
    updateVendor
} from '../store/vendorSlice';
import { Vendor, VendorTransaction } from '../types/vendor';
import {
    Users, Plus, Search, Filter, ArrowUpRight, ArrowDownLeft,
    FileText, Phone, MapPin, Landmark, History, ChevronRight,
    Loader2, AlertCircle, Trash2, Pencil, CheckCircle2, IndianRupee
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const VendorManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { vendors, isLoading, error } = useSelector((state: RootState) => state.vendor);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [vendorHistory, setVendorHistory] = useState<VendorTransaction[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [paymentData, setPaymentData] = useState({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gstin: '',
        address: '',
        contactPerson: '',
        openingBalance: 0
    });

    useEffect(() => {
        dispatch(fetchVendors());
    }, [dispatch]);

    const handleSaveVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId) return;

        try {
            const dataToSave = {
                tenant_id: user.tenantId,
                name: formData.name,
                phone: formData.phone,
                gstin: formData.gstin,
                address: formData.address,
                contact_person: formData.contactPerson,
                opening_balance: formData.openingBalance,
                current_balance: selectedVendor ? selectedVendor.currentBalance : formData.openingBalance
            };

            if (selectedVendor) {
                const { data, error } = await supabase
                    .from('vendors')
                    .update(dataToSave)
                    .eq('id', selectedVendor.id)
                    .select()
                    .single();
                if (error) throw error;
                dispatch(updateVendor({
                    ...selectedVendor,
                    ...formData,
                    currentBalance: data.current_balance
                }));
            } else {
                const { data, error } = await supabase
                    .from('vendors')
                    .insert([dataToSave])
                    .select()
                    .single();
                if (error) throw error;
                const newVendor: Vendor = {
                    id: data.id,
                    tenantId: data.tenant_id,
                    name: data.name,
                    phone: data.phone,
                    gstin: data.gstin,
                    address: data.address,
                    contactPerson: data.contact_person,
                    openingBalance: data.opening_balance,
                    currentBalance: data.current_balance,
                    isActive: data.is_active,
                    createdAt: data.created_at
                };
                dispatch(addVendor(newVendor));
            }
            setIsFormOpen(false);
            resetForm();
        } catch (err: any) {
            alert(err.message);
        }
    };

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
        setFormData({ name: '', phone: '', gstin: '', address: '', contactPerson: '', openingBalance: 0 });
        setPaymentData({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
        setSelectedVendor(null);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendor || paymentData.amount <= 0) return;

        try {
            await dispatch(recordVendorTransaction(
                selectedVendor.id,
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
        v.phone?.includes(searchTerm) ||
        v.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-5 h-5" /> Add New Vendor
                </button>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Vendors</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{vendors.length}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-red-500">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Total Payables</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{vendors.reduce((sum, v) => sum + (v.currentBalance > 0 ? v.currentBalance : 0), 0).toLocaleString()}
                    </h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-green-500">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">Advance/Credit</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{Math.abs(vendors.reduce((sum, v) => sum + (v.currentBalance < 0 ? v.currentBalance : 0), 0)).toLocaleString()}
                    </h3>
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

            {/* Vendor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                        <p className="text-slate-500 font-medium">Loading vendors...</p>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white">No Vendors Found</h4>
                        <p className="text-slate-500 mt-2">Add your first supplier to start tracking purchases.</p>
                    </div>
                ) : (
                    filteredVendors.map(vendor => (
                        <div key={vendor.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{vendor.name}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{vendor.contactPerson || 'General Contact'}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setSelectedVendor(vendor);
                                            setFormData({
                                                name: vendor.name,
                                                phone: vendor.phone || '',
                                                gstin: vendor.gstin || '',
                                                address: vendor.address || '',
                                                contactPerson: vendor.contactPerson || '',
                                                openingBalance: vendor.openingBalance
                                            });
                                            setIsFormOpen(true);
                                        }}
                                        className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Phone className="w-4 h-4" />
                                    <span>{vendor.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Landmark className="w-4 h-4" />
                                    <span className="font-mono text-[10px] uppercase">GST: {vendor.gstin || 'Unregistered'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="line-clamp-1">{vendor.address || 'No address'}</span>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl flex items-center justify-between border ${vendor.currentBalance >= 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' : 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20'}`}>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${vendor.currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {vendor.currentBalance >= 0 ? 'Payable Amount' : 'Credit Balance'}
                                    </p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">
                                        ₹{Math.abs(vendor.currentBalance).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setSelectedVendor(vendor); setIsPaymentOpen(true); }}
                                        className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                                    >
                                        <IndianRupee className="w-3 h-3" /> Pay
                                    </button>
                                    <button
                                        onClick={() => fetchHistory(vendor.id)}
                                        className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                                    >
                                        <History className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Vendor Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                {selectedVendor ? 'Edit Vendor' : 'New Vendor Profile'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveVendor} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Business Name</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white font-bold"
                                        placeholder="e.g. Royal Textile Wholesalers"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Contact Person</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white"
                                        placeholder="e.g. Amit Kumar"
                                        value={formData.contactPerson}
                                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white"
                                        placeholder="e.g. 9876543210"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">GSTIN</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono tracking-wider dark:text-white"
                                        placeholder="22AAAAA0000A1Z5"
                                        value={formData.gstin}
                                        onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Opening Balance</label>
                                    <input
                                        type="number"
                                        disabled={!!selectedVendor}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white font-bold disabled:opacity-50"
                                        placeholder="0.00"
                                        value={formData.openingBalance}
                                        onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Business Address</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white text-sm"
                                        placeholder="Store address, city, pin..."
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                                    {selectedVendor ? 'Save Changes' : 'Create Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentOpen && selectedVendor && (
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
                                <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedVendor.name}</p>
                                <p className="text-sm font-bold text-red-600 mt-1">Outstanding: ₹{selectedVendor.currentBalance.toLocaleString()}</p>
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
        </div>
    );
};

export default VendorManager;
