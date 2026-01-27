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
import SupplierInvoiceUpload from './SupplierInvoiceUpload';

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

    const color = 'emerald';

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

    const handleDataExtracted = (data: any) => {
        setFormData(prev => ({
            ...prev,
            ...data
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
            {mode === 'add' && <SupplierInvoiceUpload onDataExtracted={handleDataExtracted} />}

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
                        maxLength={15}
                        pattern="[0-9\-]{10,15}"
                        placeholder={mode === 'add' ? '10-digit mobile or landline (e.g. 0462-2322406)' : 'Updated contact number'}
                        color={color}
                    />
                    <InputField
                        label={mode === 'add' ? 'Corporate Email Node' : 'Enterprise Email Registry'}
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={onChange}
                        placeholder={mode === 'add' ? 'billing@partner.com' : 'New email endpoint'}
                        color={color}
                    />
                    <TextareaField
                        label="Operational Facility Address"
                        id="physicalAddress"
                        name="physicalAddress"
                        value={formData.physicalAddress}
                        onChange={onChange}
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
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 border rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-widest">
                            {advisoryConfig[mode].title}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 leading-relaxed">
                            {advisoryConfig[mode].text}
                        </p>
                    </div>
                </div>

                {/* Form Controls */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/suppliers')}
                        className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all"
                    >
                        {mode === 'add' ? 'Cancel' : 'Discard'}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg dark:shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                {mode === 'add' ? 'Onboarding...' : 'Syncing...'}
                            </>
                        ) : (
                            <>
                                {mode === 'add' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {mode === 'add' ? 'Complete Onboarding' : 'Save Changes'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SupplierForm;
