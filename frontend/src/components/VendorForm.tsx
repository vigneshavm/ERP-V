import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
    addVendor,
    updateVendor,
    setSelectedVendor
} from '../store/vendorSlice';
import { setActiveTab } from '../store/uiSlice';
import { Vendor } from '../types/vendor';
import {
    ArrowLeft, Landmark, CheckCircle2, AlertCircle, Save, X, IndianRupee
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const VendorForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { selectedVendor } = useSelector((state: RootState) => state.vendor);

    const [formData, setFormData] = useState<{
        name: string;
        phone: string;
        gstin: string;
        address: string;
        contactPerson: string;
        openingBalance: number;
        supplierType: string;
        balanceType: string;
        creditPeriod: number;
        status: string;
        email: string;
    }>({
        name: '',
        phone: '',
        email: '',
        gstin: '',
        address: '',
        contactPerson: '',
        openingBalance: 0,
        supplierType: '',
        balanceType: '',
        creditPeriod: 0,
        status: 'Active'
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (selectedVendor) {
            setFormData({
                name: selectedVendor.name,
                phone: selectedVendor.phone || '',
                gstin: selectedVendor.gstin || '',
                address: selectedVendor.address || '',
                contactPerson: selectedVendor.contactPerson || '',
                openingBalance: selectedVendor.openingBalance,
                supplierType: selectedVendor.supplierType || '',
                balanceType: selectedVendor.balanceType || '',
                creditPeriod: selectedVendor.creditPeriod || 0,
                status: selectedVendor.status || 'Active',
                email: selectedVendor.email || ''
            });
        }
    }, [selectedVendor]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId) return;

        setIsSaving(true);
        try {
            const dataToSave = {
                tenant_id: user.tenantId,
                name: formData.name,
                phone: formData.phone,
                gstin: formData.gstin,
                address: formData.address,
                contact_person: formData.contactPerson,
                opening_balance: formData.openingBalance,
                current_balance: selectedVendor ? selectedVendor.currentBalance : (formData.balanceType === 'Payable' ? formData.openingBalance : -formData.openingBalance),
                supplier_type: formData.supplierType,
                balance_type: formData.balanceType,
                credit_period: formData.creditPeriod,
                status: formData.status,
                email: formData.email,
                is_active: formData.status === 'Active'
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
                    supplierType: data.supplier_type,
                    balanceType: data.balance_type,
                    creditPeriod: data.credit_period,
                    status: data.status,
                    email: data.email,
                    createdAt: data.created_at
                };
                dispatch(addVendor(newVendor));
            }
            handleBack();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        dispatch(setSelectedVendor(null));
        dispatch(setActiveTab('VENDORS'));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-4 animate-in slide-in-from-right duration-500 pb-12">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {selectedVendor ? 'Edit Vendor Profile' : 'New Vendor Registration'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Supplier Management System</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden shadow-indigo-500/5">
                    <div className="p-6 space-y-6">
                        {/* Section 1: Basic Information */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="w-6 h-[2px] bg-indigo-600/20"></span>
                                Core Registry Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Business Registered Name</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-bold text-base shadow-inner"
                                        placeholder="e.g. Royal Textile Wholesalers Pvt Ltd"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Supplier Category</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white font-bold appearance-none cursor-pointer"
                                        value={formData.supplierType}
                                        onChange={e => setFormData({ ...formData, supplierType: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Manufacturer">Manufacturer</option>
                                        <option value="Wholesaler">Wholesaler</option>
                                        <option value="Distributor">Distributor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tax ID (GSTIN)</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono tracking-[0.15em] dark:text-white uppercase shadow-inner"
                                        placeholder="22AAAAA0000A1Z5"
                                        value={formData.gstin}
                                        onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Contact Details */}
                        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                            <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="w-6 h-[2px] bg-indigo-600/20"></span>
                                Primary Contact Node
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Contact Officer Name</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white font-bold shadow-inner"
                                        placeholder="Full Name"
                                        value={formData.contactPerson}
                                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Communication Line</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white font-bold shadow-inner"
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white font-bold shadow-inner"
                                        placeholder="vendor@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Operational Address</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white font-bold shadow-inner resize-none text-sm"
                                        placeholder="Registered business address..."
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Financial & System */}
                        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                            <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="w-6 h-[2px] bg-indigo-600/20"></span>
                                Financial Ledger Config
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Landmark className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Accounting Init</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Opening Credit/Debit</label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                <input
                                                    type="number"
                                                    disabled={!!selectedVendor}
                                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-white font-black disabled:opacity-50"
                                                    placeholder="0.00"
                                                    value={formData.openingBalance || ''}
                                                    onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Ledger Category {formData.openingBalance !== 0 && '(Mandatory)'}</label>
                                            <select
                                                required={formData.openingBalance !== 0}
                                                disabled={!!selectedVendor}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-700 dark:text-white font-bold disabled:opacity-50 appearance-none cursor-pointer"
                                                value={formData.balanceType}
                                                onChange={e => setFormData({ ...formData, balanceType: e.target.value })}
                                            >
                                                <option value="">Select Indicator</option>
                                                <option value="Payable">Payable (Credit)</option>
                                                <option value="Receivable">Receivable (Debit)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Net Credit Terms (Grace Days)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-white font-bold shadow-inner"
                                                placeholder="0"
                                                value={formData.creditPeriod || ''}
                                                onChange={e => setFormData({ ...formData, creditPeriod: Number(e.target.value) })}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500/50 uppercase tracking-widest pointer-events-none">Days</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Registry Lifecycle Status</label>
                                        <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: 'Active' })}
                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === 'Active' ? 'bg-white dark:bg-slate-800 text-green-600 shadow-sm border border-slate-100 dark:border-slate-700' : 'text-slate-400 hover:text-slate-500'}`}
                                            >
                                                Active
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === 'Inactive' ? 'bg-white dark:bg-slate-800 text-red-600 shadow-sm border border-slate-100 dark:border-slate-700' : 'text-slate-400 hover:text-slate-500'}`}
                                            >
                                                Blacklist
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                            {isSaving ? (
                                <span className="flex items-center gap-1.5 text-amber-500">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                    Ledger Syncing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    Validation Passed
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Processing
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3 h-3" />
                                        {selectedVendor ? 'Commit Updates' : 'Authorize Entry'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {!selectedVendor && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex gap-4 shadow-sm">
                    <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-[11px]">System Protocol: Opening Balances</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 leading-relaxed font-medium">
                            Initial ledger entries are immutable post-authentication. All subsequent adjustments must occur through authorized transaction nodes. Reference the Payable/Receivable indicator accurately.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorForm;
