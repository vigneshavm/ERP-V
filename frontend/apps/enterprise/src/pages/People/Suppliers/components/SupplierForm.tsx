import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    User,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Wallet,
    Briefcase,
    ShieldCheck,
    Globe,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { FormSection, InputWrapper } from './SupplierUI';
import { addSupplier, updateSupplier, reset } from "@/entities/contact/model/supplierSlice";
import { AppDispatch, RootState } from "@/app/store/store";
import { toast } from 'react-toastify';

interface SupplierFormProps {
    mode: 'add' | 'edit';
    supplierId?: string;
    initialData?: any;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ mode, supplierId, initialData }) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { isLoading, isSuccess, isError, message } = useSelector((state: RootState) => state.suppliers);

    const [formData, setFormData] = useState({
        businessName: '',
        contactPersonName: '',
        contactNo: '',
        email: '',
        physicalAddress: '',
        state: '',
        gstNo: '',
        supplierType: 'manufacturer',
        openingBalance: 0,
        balanceType: 'payable',
        creditPeriod: 0,
        status: 'active',
        supplierGroup: '',
        groupId: '',
        bankAccounts: [],
        isOneTime: false,
        defaultPaymentMode: 'NEFT',
    });

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                ...formData,
                ...initialData
            });
        }
    }, [mode, initialData]);

    useEffect(() => {
        if (isSuccess) {
            toast.success(`Supplier ${mode === 'add' ? 'created' : 'updated'} successfully`);
            navigate('/suppliers');
            dispatch(reset());
        }
        if (isError && message) {
            toast.error(message);
            dispatch(reset());
        }
    }, [isSuccess, isError, message, mode, navigate, dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'add') {
            dispatch(addSupplier(formData));
        } else if (supplierId) {
            dispatch(updateSupplier({ id: supplierId, supplierData: formData }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FormSection title="Core Identity" description="Primary business and contact markers">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputWrapper label="Business Legal Name" icon={Building2} required>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            required
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm"
                            placeholder="e.g. Acme Corp Logistics"
                        />
                    </InputWrapper>

                    <InputWrapper label="Primary Contact Person" icon={User}>
                        <input
                            type="text"
                            name="contactPersonName"
                            value={formData.contactPersonName}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm"
                            placeholder="Full Name"
                        />
                    </InputWrapper>

                    <InputWrapper label="Communication Node (Phone)" icon={Phone} required>
                        <input
                            type="tel"
                            name="contactNo"
                            value={formData.contactNo}
                            onChange={handleChange}
                            required
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm"
                            placeholder="10-digit mobile number"
                        />
                    </InputWrapper>

                    <InputWrapper label="Digital Endpoint (Email)" icon={Mail}>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm"
                            placeholder="supplier@endpoint.com"
                        />
                    </InputWrapper>
                </div>
            </FormSection>

            <FormSection title="Logistics & Compliance" description="Physical warehouse and tax identifiers">
                <div className="space-y-6">
                    <InputWrapper label="Physical Warehouse Address" icon={MapPin}>
                        <textarea
                            name="physicalAddress"
                            value={formData.physicalAddress}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm leading-relaxed"
                            placeholder="Full street address, building, and zone..."
                        />
                    </InputWrapper>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputWrapper label="Tax Identity (GSTIN)" icon={ShieldCheck}>
                            <input
                                type="text"
                                name="gstNo"
                                value={formData.gstNo}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm uppercase"
                                placeholder="15-digit GST number"
                            />
                        </InputWrapper>

                        <InputWrapper label="Enterprise Category" icon={Briefcase}>
                            <select
                                name="supplierType"
                                value={formData.supplierType}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm appearance-none"
                            >
                                <option value="manufacturer">Manufacturer</option>
                                <option value="distributor">Distributor</option>
                                <option value="wholesaler">Wholesaler</option>
                                <option value="retailer">Retailer</option>
                                <option value="service_provider">Service Provider</option>
                            </select>
                        </InputWrapper>
                    </div>
                </div>
            </FormSection>

            <FormSection title="Financial Manifest" description="Opening state and credit agreements">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <InputWrapper label="Opening Liquidity" icon={Wallet}>
                        <input
                            type="number"
                            name="openingBalance"
                            value={formData.openingBalance}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm"
                        />
                    </InputWrapper>

                    <InputWrapper label="Balance Polarity" icon={Globe}>
                        <select
                            name="balanceType"
                            value={formData.balanceType}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm appearance-none"
                        >
                            <option value="payable">Payable (Credit)</option>
                            <option value="receivable">Receivable (Debit)</option>
                        </select>
                    </InputWrapper>

                    <InputWrapper label="Credit Window (Days)" icon={CreditCard}>
                        <input
                            type="number"
                            name="creditPeriod"
                            value={formData.creditPeriod}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-sm"
                        />
                    </InputWrapper>
                </div>
            </FormSection>

            <div className="flex justify-end gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => navigate('/suppliers')}
                    className="px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <XCircle className="w-4 h-4" /> Abort Protocol
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-10 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4" />
                    )}
                    {mode === 'add' ? 'Commit Supplier' : 'Update Global Profile'}
                </button>
            </div>
        </form>
    );
};

export default SupplierForm;
