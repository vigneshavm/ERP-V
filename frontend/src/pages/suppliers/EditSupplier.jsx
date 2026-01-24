import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, updateSupplier, reset } from '../../redux/slices/supplierSlice';
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
  Save
} from 'lucide-react';

const EditSupplier = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { supplier, isLoading, isSuccess, isError, message } = useSelector(
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
    dispatch(getSupplierById(id));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (supplier) {
      setFormData({
        businessName: supplier.businessName || '',
        contactPersonName: supplier.contactPersonName || '',
        contactNo: supplier.contactNo || '',
        email: supplier.email || '',
        physicalAddress: supplier.physicalAddress || '',
        gstNo: supplier.gstNo || '',
        supplierType: supplier.supplierType || 'manufacturer',
        openingBalance: supplier.openingBalance || 0,
        balanceType: supplier.balanceType || 'payable',
        creditPeriod: supplier.creditPeriod || 0,
        status: supplier.status || 'active',
      });
    }
  }, [supplier]);

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
    await dispatch(updateSupplier({ id, supplierData: formData }));
  };

  if (isLoading && !supplier) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400">Loading Source Data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const FormSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
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
        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
      />
    </div>
  );

  return (
    <Layout>
      <PageHeader
        title="Update Partner"
        description={`Modifying registration profile for ${supplier?.businessName || 'Strategic Partner'}`}
        breadcrumbs={[{ label: 'Suppliers', link: '/suppliers' }, { label: 'Edit Profile' }]}
      />

      <div className="max-w-5xl">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Identity & Contact */}
          <FormSection title="Modified Identity" icon={Building2}>
            <InputField
              label="Enterprise Legal Name"
              id="businessName"
              name="businessName"
              value={businessName}
              onChange={onChange}
              required
              placeholder="Current registered name"
            />
            <InputField
              label="Mandated Contact Node"
              id="contactPersonName"
              name="contactPersonName"
              value={contactPersonName}
              onChange={onChange}
              required
              placeholder="Primary point of contact"
            />
            <InputField
              label="Direct Tele-Line"
              id="contactNo"
              name="contactNo"
              type="tel"
              value={contactNo}
              onChange={onChange}
              required
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="Updated contact number"
            />
            <InputField
              label="Enterprise Email Registry"
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={onChange}
              required
              placeholder="New email endpoint"
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
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                placeholder="Update facility location details..."
              />
            </div>
          </FormSection>

          {/* Financial Governance */}
          <FormSection title="Financial Calibration" icon={CreditCard}>
            <InputField
              label="Tax Reference (GSTIN)"
              id="gstNo"
              name="gstNo"
              value={gstNo}
              onChange={onChange}
              required
              pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
              maxLength={15}
              placeholder="15-character GST registration"
            />
            <div className="space-y-2">
              <label htmlFor="supplierType" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Partner Tier</label>
              <select
                id="supplierType"
                name="supplierType"
                value={supplierType}
                onChange={onChange}
                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>
            <InputField
              label="Current Adjusted Balance"
              id="openingBalance"
              name="openingBalance"
              type="number"
              value={openingBalance}
              onChange={onChange}
              placeholder="Reflected amount"
            />
            <div className="space-y-2">
              <label htmlFor="status" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Lifecycle</label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={onChange}
                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="active">Active Operational</option>
                <option value="inactive">Suspended / Inactive</option>
              </select>
            </div>
          </FormSection>

          {/* Modification Advisory */}
          <div className="p-6 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800 rounded-[2rem] flex items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-black text-violet-800 dark:text-violet-200 uppercase tracking-wider">Audit Notification</p>
              <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium mt-1 leading-relaxed">
                Updating this profile will trigger a system-wide audit log. All downstream transactions and purchase orders mapped to this partner will immediately reflect these changes.
              </p>
            </div>
          </div>

          {/* Submission Controls */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/suppliers')}
              className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-10 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-200 dark:shadow-none hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Synchronizing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Commit Profile Updates
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditSupplier;