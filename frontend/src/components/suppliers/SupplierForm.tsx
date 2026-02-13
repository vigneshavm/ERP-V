import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../redux/store';
import { addSupplier, updateSupplier, getSupplierById } from '../../redux/slices/supplierSlice';
import { getSupplierGroups } from '../../redux/slices/supplierGroupSlice';
import { Save, X, Plus, Trash2, CreditCard, Landmark } from 'lucide-react';
import { toast } from 'react-toastify';

interface SupplierFormData {
    businessName: string;
    supplierGroup: string;
    contactPersonName: string;
    contactNo: string;
    email: string;
    physicalAddress: string;
    state: string;
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

/* ─── shared field classes ──────────────────────────────── */
const inputCls =
    'w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm text-slate-800 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-slate-300 dark:placeholder:text-neutral-600';
const labelCls =
    'block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1';
const requiredDot = <span className="text-rose-500 ml-0.5">*</span>;

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
        state: '',
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
        if (mode === 'edit' && supplierId && !supplier && !initialData) {
            dispatch(getSupplierById(supplierId));
        }
        dispatch(getSupplierGroups());
    }, [mode, supplierId, dispatch, supplier, initialData]);

    useEffect(() => {
        if (mode === 'edit' && supplier) {
            setFormData({
                businessName: supplier.businessName || '',
                supplierGroup: supplier.supplierGroup || '',
                contactPersonName: supplier.contactPersonName || '',
                contactNo: supplier.contactNo || '',
                email: supplier.email || '',
                physicalAddress: supplier.physicalAddress || '',
                state: supplier.state || '',
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
                toast.success('Supplier added successfully');
            } else if (mode === 'edit' && supplierId) {
                await dispatch(updateSupplier({ id: supplierId, supplierData: formData })).unwrap();
                toast.success('Supplier updated');
            }
            navigate('/suppliers');
        } catch (error: any) {
            console.error('Failed to save supplier:', error);
            toast.error(error || 'Failed to save supplier');
        }
    };

    /* ─── Section Header Component ─────────────────────── */
    const SectionTitle = ({ title }: { title: string }) => (
        <div className="border-b border-slate-100 dark:border-neutral-700 pb-2 mb-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-200">{title}</h3>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* ═══ GENERAL DETAILS ═══ */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 shadow-sm p-6">
                <SectionTitle title="General Details" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div>
                        <label className={labelCls}>Supplier Name{requiredDot}</label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            required
                            className={inputCls}
                            placeholder="Enter supplier / business name"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Mobile Number</label>
                        <input
                            type="text"
                            name="contactNo"
                            value={formData.contactNo}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="Enter mobile number"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="Enter email"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Opening Balance</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-neutral-900 border border-r-0 border-slate-200 dark:border-neutral-700 rounded-l-lg text-sm text-slate-400">₹</span>
                            <input
                                type="number"
                                name="openingBalance"
                                value={formData.openingBalance}
                                onChange={handleChange}
                                className={`${inputCls} rounded-l-none border-l-0`}
                                placeholder="0"
                            />
                            <select
                                name="balanceType"
                                value={formData.balanceType}
                                onChange={handleChange}
                                className="px-2 bg-slate-50 dark:bg-neutral-900 border border-l-0 border-slate-200 dark:border-neutral-700 rounded-r-lg text-xs text-slate-600 dark:text-neutral-300 outline-none"
                            >
                                <option value="payable">To Pay</option>
                                <option value="receivable">To Collect</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Row 2: GSTIN, PAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mt-4">
                    <div>
                        <label className={labelCls}>GSTIN</label>
                        <input
                            type="text"
                            name="gstNo"
                            value={formData.gstNo}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="ex: 29XXXXX9438X1X"
                        />
                        <p className="text-[10px] text-indigo-400 mt-1 font-medium">Auto-populate supplier details from GSTIN</p>
                    </div>
                    <div>
                        <label className={labelCls}>PAN Number</label>
                        <input
                            type="text"
                            name="panNo"
                            value={formData.panNo}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="Enter PAN number"
                        />
                    </div>
                </div>

                {/* Divider */}
                <hr className="border-slate-100 dark:border-neutral-700 my-5" />

                {/* Row 3: Classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div>
                        <label className={labelCls}>Supplier Type{requiredDot}</label>
                        <select
                            name="supplierType"
                            value={formData.supplierType}
                            onChange={handleChange}
                            className={inputCls}
                        >
                            <option value="manufacturer">Manufacturer</option>
                            <option value="wholesaler">Wholesaler</option>
                            <option value="distributor">Distributor</option>
                            <option value="retailer">Retailer</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Supplier Category</label>
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
                            className={inputCls}
                        >
                            <option value="">Select Category</option>
                            {groups.map(g => (
                                <option key={g._id} value={g._id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Contact Person</label>
                        <input
                            type="text"
                            name="contactPersonName"
                            value={formData.contactPersonName}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="Contact person name"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Credit Period (Days)</label>
                        <input
                            type="number"
                            name="creditPeriod"
                            value={formData.creditPeriod}
                            onChange={handleChange}
                            className={inputCls}
                        />
                    </div>
                </div>

                {/* One-time toggle */}
                <div className="flex items-center gap-3 mt-5 p-3 bg-slate-50 dark:bg-neutral-900 rounded-lg border border-slate-100 dark:border-neutral-700">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, isOneTime: !prev.isOneTime }))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.isOneTime ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-neutral-600'}`}
                    >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${formData.isOneTime ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                    </button>
                    <span className="text-xs font-medium text-slate-600 dark:text-neutral-300">One-time Supplier</span>
                </div>
            </div>

            {/* ═══ ADDRESS ═══ */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 shadow-sm p-6">
                <SectionTitle title="Address" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>Address</label>
                        <textarea
                            name="physicalAddress"
                            value={formData.physicalAddress}
                            onChange={handleChange}
                            className={`${inputCls} resize-none`}
                            placeholder="Enter full address"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>State</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="e.g. Maharashtra"
                        />
                        <p className="text-[10px] text-amber-500 mt-1 font-medium">Important for GST (IGST vs SGST/CGST)</p>
                    </div>
                </div>
            </div>

            {/* ═══ PAYMENT MODE ═══ */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 shadow-sm p-6">
                <SectionTitle title="Payment Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <div>
                        <label className={labelCls}>Default Payment Mode</label>
                        <select
                            name="defaultPaymentMode"
                            value={formData.defaultPaymentMode}
                            onChange={handleChange}
                            className={inputCls}
                        >
                            <option value="NEFT">NEFT</option>
                            <option value="RTGS">RTGS</option>
                            <option value="IMPS">IMPS</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Cash">Cash</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ═══ BANKING DETAILS ═══ */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 shadow-sm p-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-700 pb-2 mb-5">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-200">Bank Accounts</h3>
                    <button
                        type="button"
                        onClick={addBankAccount}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Account
                    </button>
                </div>

                {formData.bankAccounts.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-neutral-700 rounded-lg">
                        <Landmark className="w-8 h-8 text-slate-200 dark:text-neutral-700 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 dark:text-neutral-500">No bank accounts added yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {formData.bankAccounts.map((account, index) => (
                            <div key={index} className="p-4 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 rounded-lg relative group">
                                <button
                                    type="button"
                                    onClick={() => removeBankAccount(index)}
                                    className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3">
                                    <div>
                                        <label className={labelCls}>Account Name</label>
                                        <input type="text" value={account.accountName} onChange={(e) => updateBankAccount(index, 'accountName', e.target.value)} className={inputCls} placeholder="Account holder name" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Account Number</label>
                                        <input type="text" value={account.accountNumber} onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)} className={inputCls} placeholder="A/C Number" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Bank Name</label>
                                        <input type="text" value={account.bankName} onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)} className={inputCls} placeholder="Bank name" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Branch</label>
                                        <input type="text" value={account.branch} onChange={(e) => updateBankAccount(index, 'branch', e.target.value)} className={inputCls} placeholder="Branch" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>IFSC Code</label>
                                        <input type="text" value={account.ifsc} onChange={(e) => updateBankAccount(index, 'ifsc', e.target.value)} className={`${inputCls} uppercase`} placeholder="IFSC" />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => updateBankAccount(index, 'isDefault', true)}
                                            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${account.isDefault
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-white dark:bg-neutral-800 text-slate-400 hover:text-slate-600 border border-slate-200 dark:border-neutral-700'
                                                }`}
                                        >
                                            <CreditCard className="w-3.5 h-3.5" />
                                            {account.isDefault ? 'Primary' : 'Set Primary'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ FOOTER ACTIONS ═══ */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => navigate('/suppliers')}
                    className="px-5 py-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60"
                >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Supplier'}
                </button>
            </div>
        </form>
    );
};

export default SupplierForm;
