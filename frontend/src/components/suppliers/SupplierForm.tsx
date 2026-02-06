import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../redux/store';
import { addSupplier, updateSupplier, getSupplierById } from '../../redux/slices/supplierSlice';
import { getSupplierGroups } from '../../redux/slices/supplierGroupSlice';
import { Save, X, Building2, User, Phone, Wallet, Tag, CreditCard, Trash2, Plus, Landmark, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

interface SupplierFormData {
    businessName: string;
    supplierGroup: string;
    contactPersonName: string;
    contactNo: string;
    email: string;
    physicalAddress: string;
    gstNo: string;
    panNo: string;
    supplierType: string;
    openingBalance: number;
    balanceType: string;
    creditPeriod: number;
    status: string;
    defaultPaymentMode: string;
    isOneTime: boolean;
    bankAccounts: {
        accountName: string;
        accountNumber: string;
        bankName: string;
        branch: string;
        ifsc: string;
        isDefault: boolean;
    }[];
    groupId?: string;
    [key: string]: any;
}

interface SupplierFormProps {
    mode: 'add' | 'edit';
    supplierId?: string;
    initialData?: any;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ mode, supplierId, initialData }) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { supplier, isLoading } = useSelector((state: RootState) => state.suppliers);

    const [formData, setFormData] = useState<SupplierFormData>((initialData as SupplierFormData) || {
        businessName: '',
        supplierGroup: '',
        contactPersonName: '',
        contactNo: '',
        email: '',
        physicalAddress: '',
        gstNo: '',
        panNo: '',
        supplierType: 'manufacturer',
        openingBalance: 0,
        balanceType: 'payable',
        creditPeriod: 30,
        status: 'active',
        defaultPaymentMode: 'NEFT',
        isOneTime: false,
        bankAccounts: [],
        groupId: ''
    });

    const { groups } = useSelector((state: RootState) => state.supplierGroups);

    useEffect(() => {
        // Only fetch if we are editing, have an ID, AND don't have the supplier loaded or initialData
        // This prevents double-fetching if the parent (EditSupplier) already fetched it.
        if (mode === 'edit' && supplierId && !supplier && !initialData) {
            dispatch(getSupplierById(supplierId));
        }
        dispatch(getSupplierGroups());
    }, [mode, supplierId, dispatch, supplier, initialData]);

    useEffect(() => {
        // Update form if Redux supplier changes (and we didn't have initialData or it outdated)
        if (mode === 'edit' && supplier) {
            setFormData({
                businessName: supplier.businessName || '',
                supplierGroup: supplier.supplierGroup || '',
                contactPersonName: supplier.contactPersonName || '',
                contactNo: supplier.contactNo || '',
                email: supplier.email || '',
                physicalAddress: supplier.physicalAddress || '',
                gstNo: supplier.gstNo || '',
                panNo: supplier.panNo || '',
                supplierType: supplier.supplierType || 'manufacturer',
                openingBalance: supplier.openingBalance || 0,
                balanceType: (supplier.balanceType as any) || 'payable',
                creditPeriod: supplier.creditPeriod || 30,
                status: supplier.status || 'active',
                defaultPaymentMode: supplier.defaultPaymentMode || 'NEFT',
                isOneTime: !!supplier.isOneTime,
                bankAccounts: supplier.bankAccounts || [],
                groupId: (supplier.groupId as any)?._id || supplier.groupId || ''
            });
        }
    }, [supplier, mode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'openingBalance' || name === 'creditPeriod' ? Number(value) : value
        }));
    };

    const addBankAccount = () => {
        setFormData(prev => ({
            ...prev,
            bankAccounts: [
                ...prev.bankAccounts,
                { accountName: '', accountNumber: '', bankName: '', branch: '', ifsc: '', isDefault: prev.bankAccounts.length === 0 }
            ]
        }));
    };

    const removeBankAccount = (index: number) => {
        setFormData(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.filter((_, i) => i !== index)
        }));
    };

    const updateBankAccount = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newAccounts = [...prev.bankAccounts];
            if (field === 'isDefault' && value === true) {
                // Set all others to false if this is becoming default
                newAccounts.forEach((acc, i) => acc.isDefault = i === index);
            } else {
                newAccounts[index] = { ...newAccounts[index], [field]: value };
            }
            return { ...prev, bankAccounts: newAccounts };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (mode === 'add') {
                await dispatch(addSupplier(formData)).unwrap();
                toast.success('Supplier onboarded successfully');
            } else if (mode === 'edit' && supplierId) {
                await dispatch(updateSupplier({ id: supplierId, supplierData: formData })).unwrap();
                toast.success('Supplier record updated');
            }
            navigate('/suppliers');
        } catch (error: any) {
            console.error('Failed to save supplier:', error);
            toast.error(error || 'Failed to save supplier record');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">

                {/* Section 1: Business Identity */}
                <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Business Identity</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business / Entity Name</label>
                            <input
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-white"
                                placeholder="e.g. Tata Steel Ltd."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Strategic Group</label>
                            <select
                                name="groupId"
                                value={formData.groupId}
                                onChange={(e) => {
                                    const selectedGroup = groups.find(g => g._id === e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        groupId: e.target.value,
                                        supplierGroup: selectedGroup ? selectedGroup.name : prev.supplierGroup
                                    }));
                                }}
                                className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 dark:text-indigo-300"
                            >
                                <option value="">Select Predefined Group...</option>
                                {groups.map(g => (
                                    <option key={g._id} value={g._id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Label / Brand</label>
                            <input
                                type="text"
                                name="supplierGroup"
                                value={formData.supplierGroup}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-white"
                                placeholder="e.g. Tata Group"
                            />
                            <p className="text-[10px] text-slate-400 font-medium ml-1">Optional override for analytics grouping</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classification</label>
                            <select
                                name="supplierType"
                                value={formData.supplierType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-white"
                            >
                                <option value="manufacturer">Manufacturer</option>
                                <option value="wholesaler">Wholesaler</option>
                                <option value="distributor">Distributor</option>
                                <option value="retailer">Retailer</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Number</label>
                            <input
                                type="text"
                                name="gstNo"
                                value={formData.gstNo}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-white"
                                placeholder="GSTIN..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PAN Number</label>
                            <input
                                type="text"
                                name="panNo"
                                value={formData.panNo}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-white"
                                placeholder="PAN..."
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <div className="flex items-center gap-4 p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.isOneTime ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">One-time Supplier / Urgent Onboarding</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Enable for urgent purchases without full KYC</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isOneTime: !prev.isOneTime }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${formData.isOneTime ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isOneTime ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Contact Info */}
                <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Contact Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Person</label>
                            <input
                                type="text"
                                name="contactPersonName"
                                value={formData.contactPersonName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 dark:text-white"
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone / Mobile</label>
                            <input
                                type="text"
                                name="contactNo"
                                value={formData.contactNo}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 dark:text-white"
                                placeholder="+91..."
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 dark:text-white"
                                placeholder="email@company.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Financials */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Financial Configuration</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opening Balance</label>
                            <input
                                type="number"
                                name="openingBalance"
                                value={formData.openingBalance}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Balance Type</label>
                            <select
                                name="balanceType"
                                value={formData.balanceType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700 dark:text-white"
                            >
                                <option value="payable">Payable (You Owe)</option>
                                <option value="receivable">Receivable (They Owe)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credit Period (Days)</label>
                            <input
                                type="number"
                                name="creditPeriod"
                                value={formData.creditPeriod}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Payment Mode</label>
                            <select
                                name="defaultPaymentMode"
                                value={formData.defaultPaymentMode}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700 dark:text-white"
                            >
                                <option value="NEFT">NEFT (Recommended)</option>
                                <option value="RTGS">RTGS</option>
                                <option value="IMPS">IMPS</option>
                                <option value="UPI">UPI</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Cash">Cash / Petty Cash</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 4: Banking Detail */}
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Banking Details</h3>
                        </div>
                        <button
                            type="button"
                            onClick={addBankAccount}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            <Plus className="w-4 h-4" /> Add Account
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.bankAccounts.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-400 italic">No bank accounts added yet.</p>
                            </div>
                        ) : (
                            formData.bankAccounts.map((account, index) => (
                                <div key={index} className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeBankAccount(index)}
                                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Name</label>
                                            <input
                                                type="text"
                                                value={account.accountName}
                                                onChange={(e) => updateBankAccount(index, 'accountName', e.target.value)}
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-white"
                                                placeholder="Payee Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Number</label>
                                            <input
                                                type="text"
                                                value={account.accountNumber}
                                                onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)}
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-white"
                                                placeholder="A/C No."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank & Branch</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={account.bankName}
                                                    onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-white"
                                                    placeholder="Bank"
                                                />
                                                <input
                                                    type="text"
                                                    value={account.branch}
                                                    onChange={(e) => updateBankAccount(index, 'branch', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-white"
                                                    placeholder="Branch"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IFSC Code</label>
                                            <input
                                                type="text"
                                                value={account.ifsc}
                                                onChange={(e) => updateBankAccount(index, 'ifsc', e.target.value)}
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-white uppercase"
                                                placeholder="IFSC"
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => updateBankAccount(index, 'isDefault', true)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${account.isDefault ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                {account.isDefault ? <Save className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                                                {account.isDefault ? 'Primary Account' : 'Set as Primary'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4">
                <button
                    type="button"
                    onClick={() => navigate('/suppliers')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 transition-all"
                >
                    <X className="w-4 h-4" /> Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70"
                >
                    <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Save Supplier'}
                </button>
            </div>
        </form>
    );
};

export default SupplierForm;
