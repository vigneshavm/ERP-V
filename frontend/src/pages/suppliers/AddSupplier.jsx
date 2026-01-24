import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addSupplier, reset } from '../../redux/slices/supplierSlice';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShieldCheck,
  Briefcase,
  Zap,
  CheckCircle2
} from 'lucide-react';

const AddSupplier = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.suppliers
  );

  const [formData, setFormData] = useState({
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
  });

  const [shouldNavigate, setShouldNavigate] = useState(false);

  const { businessName, contactPersonName, contactNo, email, physicalAddress, gstNo, supplierType, openingBalance, balanceType, creditPeriod, status } = formData;

  useEffect(() => {
    if (shouldNavigate && isSuccess) {
      navigate('/suppliers');
      dispatch(reset());
    }
  }, [shouldNavigate, isSuccess, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setShouldNavigate(true);
    await dispatch(addSupplier(formData));
  };

  const FormSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">{title}</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, id, name, type = "text", value, onChange, placeholder, required = false, pattern, maxLength, title }) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        pattern={pattern}
        maxLength={maxLength}
        title={title}
        placeholder={placeholder}
        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
      />
    </div>
  );

  return (
    <Layout>
      <PageHeader
        title="Onboard Supplier"
        description="Initialize a new strategic partner record in the global procurement database"
        breadcrumbs={[{ label: 'Suppliers', link: '/suppliers' }, { label: 'Add New' }]}
      />

      <div className="max-w-5xl">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Identity & Contact */}
          <FormSection title="Enterprise Identity" icon={Building2}>
            <InputField
              label="Legal Business Name"
              id="businessName"
              name="businessName"
              value={businessName}
              onChange={onChange}
              required
              placeholder="e.g. Paramount Logistics Pvt Ltd"
            />
            <InputField
              label="Key Contact Representative"
              id="contactPersonName"
              name="contactPersonName"
              value={contactPersonName}
              onChange={onChange}
              required
              placeholder="Full name of representative"
            />
            <InputField
              label="Mobile Registry"
              id="contactNo"
              name="contactNo"
              type="tel"
              value={contactNo}
              onChange={onChange}
              required
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="10-digit mobile number"
            />
            <InputField
              label="Corporate Email Node"
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={onChange}
              required
              placeholder="billing@partner.com"
            />
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="physicalAddress" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Operational Facility Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="physicalAddress"
                name="physicalAddress"
                value={physicalAddress}
                onChange={onChange}
                required
                rows={3}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                placeholder="Complete registered office address..."
              />
            </div>
          </FormSection>

          {/* Financial Governance */}
          <FormSection title="Financial Governance" icon={CreditCard}>
            <InputField
              label="Tax Identification (GST)"
              id="gstNo"
              name="gstNo"
              value={gstNo}
              onChange={onChange}
              required
              pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
              maxLength={15}
              placeholder="15-digit GSTIN"
            />
            <div className="space-y-2">
              <label htmlFor="supplierType" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Partner Classification</label>
              <select
                id="supplierType"
                name="supplierType"
                value={supplierType}
                onChange={onChange}
                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>
            <InputField
              label="Opening Ledger Balance"
              id="openingBalance"
              name="openingBalance"
              type="number"
              value={openingBalance}
              onChange={onChange}
              placeholder="0.00"
            />
            <div className="space-y-2">
              <label htmlFor="balanceType" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Balance Exposure</label>
              <select
                id="balanceType"
                name="balanceType"
                value={balanceType}
                onChange={onChange}
                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="payable">Payable (Credit)</option>
                <option value="receivable">Receivable (Debit)</option>
              </select>
            </div>
            <InputField
              label="Allowed Credit Window (Days)"
              id="creditPeriod"
              name="creditPeriod"
              type="number"
              value={creditPeriod}
              onChange={onChange}
              placeholder="30"
            />
            <div className="space-y-2">
              <label htmlFor="status" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={onChange}
                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="active">Active Operational</option>
                <option value="inactive">Suspended / Inactive</option>
              </select>
            </div>
          </FormSection>

          {/* System Advisor */}
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-[2rem] flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-black text-indigo-800 dark:text-indigo-200 uppercase tracking-wider">System Advisory</p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 leading-relaxed">
                Initializing this record will grant procurement authorization to all mapped terminal users. Financial balances will immediately reflect in the corporate ledger.
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
              Abort Onboarding
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Finalize Partner Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddSupplier;