
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchVendorById, resetVendors, setSelectedVendor, fetchVendorHistory } from '../store/vendorSlice';
import { setActiveTab } from '../store/uiSlice';
import {
    ArrowLeft, Pencil, Users, Phone, MapPin, Landmark,
    Mail, Calendar, ShieldCheck, ShieldAlert, History,
    IndianRupee, CreditCard, Activity, Package, AlertCircle,
    Loader2
} from 'lucide-react';

const VendorDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { selectedVendor, transactions, isLoading, error } = useSelector((state: RootState) => state.vendor);

    useEffect(() => {
        if (id) {
            dispatch(fetchVendorById(id));
            dispatch(fetchVendorHistory(id));
        }
    }, [id, dispatch]);

    const handleBack = () => {
        // As per checklist: Back button clears specific supplier and navigates to list
        dispatch(setSelectedVendor(null));
        // If the app is using tabs, we set active tab. If it's using routes, we navigate.
        // We'll do both to be safe during transition.
        dispatch(setActiveTab('VENDORS'));
        navigate('/suppliers');
    };

    const handleEdit = () => {
        dispatch(setActiveTab('VENDOR_FORM'));
        navigate(`/suppliers/${id}/edit`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-500 font-medium tracking-tight">Accessing supplier profile...</p>
            </div>
        );
    }

    if (error || !selectedVendor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Supplier Not Found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                    The supplier node you are looking for might have been decommissioned or the reference ID is invalid.
                </p>
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                    <ArrowLeft className="w-5 h-5" /> Return to Registry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            <Users className="w-3 h-3" />
                            <span>Supplier Registry</span>
                            <span className="text-slate-300">/</span>
                            <span>Details</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            {selectedVendor.name}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${selectedVendor.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {selectedVendor.status}
                            </span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        <Pencil className="w-4 h-4 text-indigo-600" /> Edit Profile
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('PURCHASE'))}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
                    >
                        <Package className="w-4 h-4" /> New Purchase
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-6 rounded-2xl border shadow-sm ${selectedVendor.currentBalance >= 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${selectedVendor.currentBalance >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {selectedVendor.currentBalance >= 0 ? 'Net Payable' : 'Advance Balance'}
                        </p>
                        <Landmark className={selectedVendor.currentBalance >= 0 ? 'text-red-300' : 'text-emerald-300'} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(Math.abs(selectedVendor.currentBalance))}
                    </h3>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Opening Ledger</p>
                        <Activity className="text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedVendor.openingBalance ? formatCurrency(selectedVendor.openingBalance) : '₹0'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{selectedVendor.balanceType || 'No initial debt'}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit Lifecycle</p>
                        <Calendar className="text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedVendor.creditPeriod || 0} <span className="text-sm text-slate-400">Days</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Payment Grace window</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile Status</p>
                        {selectedVendor.status === 'Active' ? <ShieldCheck className="text-emerald-500" /> : <ShieldAlert className="text-amber-500" />}
                    </div>
                    <h3 className={`text-2xl font-black ${selectedVendor.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {selectedVendor.status}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Verified Registry</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Information Sections */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-sm">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Identity & Contact Node</h4>
                            <Users className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Type</label>
                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedVendor.supplierType || 'General Supplier'}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contact Person</label>
                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedVendor.contactPerson || 'Not Specified'}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Official Phone</label>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                    <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedVendor.phone || 'NA'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Official Email</label>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                    <p className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis">{selectedVendor.email || 'NA'}</p>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Registered Address</label>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{selectedVendor.address || 'No physical address recorded.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Docs */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-sm">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Tax & Compliance</h4>
                            <Landmark className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registry ID (GSTIN)</label>
                                <p className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase">
                                    {selectedVendor.gstin || 'UNREGISTERED'}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Created On</label>
                                <p className="font-bold text-slate-900 dark:text-white tracking-tight">
                                    {selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-1 px-4">Registry entry date</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar inside details */}
                <div className="space-y-6 text-sm">
                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full flex flex-col min-h-[400px]">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Recent Ledger</h4>
                            <History className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {transactions.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">No Transactions</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {transactions.slice(0, 5).map(tx => (
                                        <div key={tx.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${tx.type === 'PURCHASE' ? 'bg-orange-100 text-orange-700' :
                                                        tx.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                                    {tx.description || 'System Entry'}
                                                </p>
                                                <p className={`text-xs font-black ${tx.amount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {transactions.length > 5 && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => dispatch(setActiveTab('VENDORS'))}
                                    className="w-full text-indigo-600 font-black uppercase text-[10px] tracking-widest py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                >
                                    View Full Ledger ({transactions.length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorDetails;
