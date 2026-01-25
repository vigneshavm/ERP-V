import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addSupplier, updateSupplier, reset } from '../../redux/slices/supplierSlice';
import { AppDispatch, RootState } from '../../redux/store';
import {
    Building2,
    CreditCard,
    Zap,
    CheckCircle2,
    Save
} from 'lucide-react';
import { FormSection, InputField, TextareaField, SelectField } from './SupplierFormComponents';

export interface SupplierFormData {
    businessName: string;
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
}

const initialFormData: SupplierFormData = {
    businessName: '',
    contactPersonName: '',
    contactNo: '',
    email: '',
    physicalAddress: '',
    gstNo: '',
    supplierType: 'manufacturer',
    openingBalance: 0,
    balanceType: 'payable',
    creditPeriod: 0,
    status: 'active',
};

interface SupplierFormProps {
    mode: 'add' | 'edit';
    supplierId?: string;
    initialData?: Partial<SupplierFormData>;
}

const supplierTypeOptions = [
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'distributor', label: 'Distributor' },
];

const balanceTypeOptions = [
    { value: 'payable', label: 'Payable (Credit)' },
    { value: 'receivable', label: 'Receivable (Debit)' },
];

const statusOptions = [
    { value: 'active', label: 'Active Operational' },
    { value: 'inactive', label: 'Suspended / Inactive' },
];

const SupplierForm: React.FC<SupplierFormProps> = ({ mode, supplierId, initialData }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isSuccess } = useSelector((state: RootState) => state.suppliers);

    const [formData, setFormData] = useState<SupplierFormData>({
        ...initialFormData,
        ...initialData,
    });

    const [shouldNavigate, setShouldNavigate] = useState(false);

    const color = mode === 'add' ? 'indigo' : 'violet';

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    useEffect(() => {
        if (shouldNavigate && isSuccess) {
            navigate('/suppliers');
            dispatch(reset());
        }
    }, [shouldNavigate, isSuccess, navigate, dispatch]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShouldNavigate(true);
        if (mode === 'add') {
            await dispatch(addSupplier(formData) as any);
        } else if (supplierId) {
            await dispatch(updateSupplier({ id: supplierId, supplierData: formData }) as any);
        }
    };

    const advisoryConfig = {
        add: {
            title: 'System Advisory',
            text: 'Initializing this record will grant procurement authorization to all mapped terminal users. Financial balances will immediately reflect in the corporate ledger.',
        },
        edit: {
            title: 'Audit Notification',
            text: 'Updating this profile will trigger a system-wide audit log. All downstream transactions and purchase orders mapped to this partner will immediately reflect these changes.',
        },
    };

    return (
        <div className="max-w-5xl">
            <form onSubmit={onSubmit} className="space-y-6">
                {/* Identity & Contact */}
                <FormSection title={mode === 'add' ? 'Enterprise Identity' : 'Modified Identity'} icon={Building2} color={color}>
                    <InputField
                        label={mode === 'add' ? 'Legal Business Name' : 'Enterprise Legal Name'}
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={onChange}
                        required
                        placeholder={mode === 'add' ? 'e.g. Paramount Logistics Pvt Ltd' : 'Current registered name'}
                        color={color}
                    />
                    <InputField
                        label={mode === 'add' ? 'Key Contact Representative' : 'Mandated Contact Node'}
                        id="contactPersonName"
                        name="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={onChange}
                        required
                        placeholder={mode === 'add' ? 'Full name of representative' : 'Primary point of contact'}
                        color={color}
                    />
                    <InputField
                        label={mode === 'add' ? 'Mobile Registry' : 'Direct Tele-Line'}
                        id="contactNo"
                        name="contactNo"
                        type="tel"
                        value={formData.contactNo}
                        onChange={onChange}
                        required
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder={mode === 'add' ? '10-digit mobile number' : 'Updated contact number'}
                        color={color}
                    />
                    <InputField
                        label={mode === 'add' ? 'Corporate Email Node' : 'Enterprise Email Registry'}
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={onChange}
                        required
                        placeholder={mode === 'add' ? 'billing@partner.com' : 'New email endpoint'}
                        color={color}
                    />
                    <TextareaField
                        label="Operational Facility Address"
                        id="physicalAddress"
                        name="physicalAddress"
                        value={formData.physicalAddress}
                        onChange={onChange}
                        required
                        placeholder={mode === 'add' ? 'Complete registered office address...' : 'Update facility location details...'}
                        color={color}
                    />
                </FormSection>

                {/* Financial Governance */}
                <FormSection title={mode === 'add' ? 'Financial Governance' : 'Financial Calibration'} icon={CreditCard} color={color}>
                    <InputField
                        label={mode === 'add' ? 'Tax Identification (GST)' : 'Tax Reference (GSTIN)'}
                        id="gstNo"
                        name="gstNo"
                        value={formData.gstNo}
                        onChange={onChange}
                        required
                        pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                        maxLength={15}
                        placeholder={mode === 'add' ? '15-digit GSTIN' : '15-character GST registration'}
                        color={color}
                    />
                    <SelectField
                        label={mode === 'add' ? 'Partner Classification' : 'Partner Tier'}
                        id="supplierType"
                        name="supplierType"
                        value={formData.supplierType}
                        onChange={onChange}
                        options={supplierTypeOptions}
                        color={color}
                    />
                    <InputField
                        label={mode === 'add' ? 'Opening Ledger Balance' : 'Current Adjusted Balance'}
                        id="openingBalance"
                        name="openingBalance"
                        type="number"
                        value={formData.openingBalance}
                        onChange={onChange}
                        placeholder={mode === 'add' ? '0.00' : 'Reflected amount'}
                        color={color}
                    />
                    {mode === 'add' && (
                        <SelectField
                            label="Balance Exposure"
                            id="balanceType"
                            name="balanceType"
                            value={formData.balanceType}
                            onChange={onChange}
                            options={balanceTypeOptions}
                            color={color}
                        />
                    )}
                    {mode === 'add' && (
                        <InputField
                            label="Allowed Credit Window (Days)"
                            id="creditPeriod"
                            name="creditPeriod"
                            type="number"
                            value={formData.creditPeriod}
                            onChange={onChange}
                            placeholder="30"
                            color={color}
                        />
                    )}
                    <SelectField
                        label={mode === 'add' ? 'Lifecycle Status' : 'Operational Lifecycle'}
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={onChange}
                        options={statusOptions}
                        color={color}
                    />
                </FormSection>

                {/* System Advisor */}
                <div className={`p-6 ${color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800'} border rounded-[2rem] flex items-start gap-4 animate-in fade-in ${mode === 'add' ? 'slide-in-from-left-4' : 'slide-in-from-right-4'} duration-700`}>
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                        <Zap className={`w-5 h-5 ${color === 'indigo' ? 'text-indigo-600' : 'text-violet-600'}`} />
                    </div>
                    <div>
                        <p className={`text-xs font-black ${color === 'indigo' ? 'text-indigo-800 dark:text-indigo-200' : 'text-violet-800 dark:text-violet-200'} uppercase tracking-wider`}>
                            {advisoryConfig[mode].title}
                        </p>
                        <p className={`text-[11px] ${color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-violet-600 dark:text-violet-400'} font-medium mt-1 leading-relaxed`}>
                            {advisoryConfig[mode].text}
                        </p>
                    </div>
                </div>

                {/* Form Controls */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/suppliers')}
                        className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        {mode === 'add' ? 'Abort Onboarding' : 'Discard Changes'}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-10 py-4 ${color === 'indigo' ? 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700' : 'bg-violet-600 shadow-violet-200 hover:bg-violet-700'} text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl dark:shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                {mode === 'add' ? 'Processing...' : 'Synchronizing...'}
                            </>
                        ) : (
                            <>
                                {mode === 'add' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {mode === 'add' ? 'Finalize Partner Record' : 'Commit Profile Updates'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SupplierForm;
