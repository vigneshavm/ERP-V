import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../redux/store';
import { addSupplier, updateSupplier, getSupplierById } from '../../redux/slices/supplierSlice';
import { Save, X, Building2, User, Phone, Wallet } from 'lucide-react';

interface SupplierFormData {
    businessName: string;
    supplierGroup: string;
    contactPersonName: string;
    contactNo: string;
    email: string;
    physicalAddress: string;
    gstNo: string;
    supplierType: string;
    openingBalance: number;
    balanceType: string;
    creditPeriod: number;
    status: string;
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
        supplierType: 'manufacturer',
        openingBalance: 0,
        balanceType: 'payable',
        creditPeriod: 30,
        status: 'active'
    });

    useEffect(() => {
        // Only fetch if we are editing, have an ID, AND don't have the supplier loaded or initialData
        // This prevents double-fetching if the parent (EditSupplier) already fetched it.
        if (mode === 'edit' && supplierId && !supplier && !initialData) {
            dispatch(getSupplierById(supplierId));
        }
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
                supplierType: supplier.supplierType || 'manufacturer',
                openingBalance: supplier.openingBalance || 0,
                balanceType: (supplier.balanceType as any) || 'payable',
                creditPeriod: supplier.creditPeriod || 30,
                status: supplier.status || 'active'
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (mode === 'add') {
                await dispatch(addSupplier(formData)).unwrap();
            } else if (mode === 'edit' && supplierId) {
                await dispatch(updateSupplier({ id: supplierId, supplierData: formData })).unwrap();
            }
            navigate('/suppliers');
        } catch (error) {
            console.error('Failed to save supplier:', error);
            // Ideally show toast here
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
                            <label className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Brand / Parent Group</label>
                            <input
                                type="text"
                                name="supplierGroup"
                                value={formData.supplierGroup}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 dark:text-indigo-300"
                                placeholder="e.g. Tata Group"
                            />
                            <p className="text-[10px] text-slate-400 font-medium ml-1">Used for grouping analytics (e.g. Trends, Raymonds under one group)</p>
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
