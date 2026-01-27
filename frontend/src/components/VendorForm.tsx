
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import {
    addSupplier,
    updateSupplier,
    setSelectedSupplier
} from '../redux/slices/supplierSlice';
import { setActiveTab } from '../redux/slices/uiSlice';
import { Vendor } from '../types/vendor';
import {
    ArrowLeft, Landmark, CheckCircle2, AlertCircle, Save, X, IndianRupee, Loader2
} from 'lucide-react';

const VendorForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { supplier: selectedSupplier, isLoading, isError, message } = useSelector((state: RootState) => state.suppliers);

    const [formData, setFormData] = useState<Partial<Vendor>>({
        businessName: '',
        contactPersonName: '',
        contactNo: '',
        email: '',
        physicalAddress: '',
        gstNo: '',
        supplierType: 'wholesaler',
        openingBalance: 0,
        balanceType: 'payable',
        creditPeriod: 30,
        status: 'active'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (selectedSupplier) {
            setFormData(selectedSupplier as Partial<Vendor>);
        }
    }, [selectedSupplier]);

    const handleBack = () => {
        dispatch(setSelectedSupplier(null));
        // This is a bit of a hack if we don't have a specific setShowForm state in Redux, 
        // but typically the parent handles this by checking setSelectedSupplier(null)
        // For now, let's assume the parent should be notified.
        // We'll use a window event or just let the parent re-render.
        window.location.reload(); // Temporary solution to go back to list
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setIsSubmitting(true);

        try {
            if (selectedSupplier && selectedSupplier._id) {
                await dispatch(updateSupplier({
                    id: selectedSupplier._id,
                    supplierData: formData
                })).unwrap();
            } else {
                await dispatch(addSupplier(formData)).unwrap();
            }
            handleBack();
        } catch (err: any) {
            setLocalError(err.message || 'Failed to save vendor details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={handleBack}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-widest">Discard & Return</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">
                        {selectedSupplier ? 'Modify Vendor Profile' : 'Onboard New Partner'}
                    </h2>
                </div>
            </div>

            {(isError || localError) && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold">
                    <AlertCircle className="w-5 h-5" />
                    <span>{message || localError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Identity & Contact</h3>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Business Name</label>
                            <input
                                type="text"
                                required
                                value={formData.businessName}
                                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-bold"
                                placeholder="Legal Entity Name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Contact Person</label>
                            <input
                                type="text"
                                required
                                value={formData.contactPersonName}
                                onChange={e => setFormData({ ...formData, contactPersonName: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-medium"
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Mobile No</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.contactNo}
                                    onChange={e => setFormData({ ...formData, contactNo: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-medium"
                                    placeholder="+91..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">GSTIN</label>
                                <input
                                    type="text"
                                    value={formData.gstNo}
                                    onChange={e => setFormData({ ...formData, gstNo: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-mono uppercase"
                                    placeholder="27AAAAA0000A1Z5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Terms */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Financial Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Opening Balance</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        value={formData.openingBalance}
                                        onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Balance Type</label>
                                <select
                                    value={formData.balanceType}
                                    onChange={e => setFormData({ ...formData, balanceType: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-bold appearance-none"
                                >
                                    <option value="payable">Payable (Credit)</option>
                                    <option value="receivable">Receivable (Debit)</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Credit Period (Days)</label>
                            <input
                                type="number"
                                value={formData.creditPeriod}
                                onChange={e => setFormData({ ...formData, creditPeriod: Number(e.target.value) })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status</label>
                            <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'active' })}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === 'active'
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'inactive' })}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === 'inactive'
                                            ? 'bg-slate-600 text-white shadow-lg shadow-slate-600/20'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Inactive
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                    >
                        Cancel Changes
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {selectedSupplier ? 'Overwrite Vendor Record' : 'Synchronize New Partner'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VendorForm;
