import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addCustomer, reset, getAllCustomers } from "../../redux/slices/customerSlice";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import {
    User,
    Phone,
    Mail,
    MapPin,
    UserPlus,
    ShieldCheck,
    AlertCircle,
    Info,
    Search,
    X,
    Briefcase
} from 'lucide-react';
import "react-toastify/dist/ReactToastify.css";

const AddCustomer = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const dropdownRef = useRef(null);

    const { isLoading, isSuccess, isError, message, customers } = useSelector(
        (state) => state.customers
    );

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        referredBy: "",
    });

    const [shouldNavigate, setShouldNavigate] = useState(false);
    const [duplicateField, setDuplicateField] = useState(null);
    const [referralSearch, setReferralSearch] = useState("");
    const [showReferralDropdown, setShowReferralDropdown] = useState(false);
    const [selectedReferrer, setSelectedReferrer] = useState(null);

    const { name, phone, email, address } = formData;

    useEffect(() => {
        dispatch(getAllCustomers());
    }, [dispatch]);

    useEffect(() => {
        if (shouldNavigate && isSuccess) {
            navigate("/customers");
            dispatch(reset());
        }
    }, [shouldNavigate, isSuccess, navigate, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowReferralDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredReferralCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(referralSearch.toLowerCase()) ||
            c.phone.includes(referralSearch)
    );

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSelectReferrer = (customer) => {
        setSelectedReferrer(customer);
        setFormData((prev) => ({ ...prev, referredBy: customer._id }));
        setReferralSearch(customer.name);
        setShowReferralDropdown(false);
    };

    const handleClearReferrer = () => {
        setSelectedReferrer(null);
        setFormData((prev) => ({ ...prev, referredBy: "" }));
        setReferralSearch("");
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setDuplicateField(null);
        const result = await dispatch(addCustomer(formData));
        if (result.type === 'customers/add/fulfilled') {
            toast.success("Customer indexed successfully!");
            setShouldNavigate(true);
        } else if (result.type === 'customers/add/rejected') {
            const errorMsg = result.payload || "Terminal sync failure";
            toast.error(errorMsg);

            if (errorMsg.toLowerCase().includes('phone')) {
                setDuplicateField('phone');
            } else if (errorMsg.toLowerCase().includes('email')) {
                setDuplicateField('email');
            }
        }
    };

    const FormSection = ({ title, description, children }) => (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
                <p className="text-xs font-medium text-slate-400 mt-1">{description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children}
            </div>
        </div>
    );

    const InputWrapper = ({ label, icon: Icon, children, error, required }) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5 focus-within:text-indigo-500 transition-colors">
                {Icon && <Icon className="w-3 h-3 text-slate-300" />}
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative group">
                {children}
            </div>
            {error && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1 animate-pulse">{error}</p>}
        </div>
    );

    return (
        <Layout>
            <PageHeader
                title="Consumer Onboarding"
                description="Register high-value partners into the global marketplace terminal"
                breadcrumbs={[{ label: 'Portfolio', link: '/customers' }, { label: 'New Onboarding' }]}
                actions={
                    <button
                        onClick={() => navigate('/customers')}
                        className="px-6 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                        Abort Sync
                    </button>
                }
            />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Internal Advisory */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Info className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest leading-none mt-1">Onboarding Protocol</p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-2 leading-relaxed italic">All consumer records are multi-indexed by phone number and email to prevent marketplace duplication. Ensure accuracy of contact nodes for logistics integrity.</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-6 pb-20">
                    <FormSection title="Partner Identity" description="Core contact parameters and decision-maker details">
                        <InputWrapper label="Partner Name" icon={User} required>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                placeholder="Full Commercial Name"
                            />
                        </InputWrapper>

                        <InputWrapper label="Communication Node" icon={Phone} required error={duplicateField === 'phone' ? 'Node collision: Phone already exists' : null}>
                            <input
                                type="tel"
                                name="phone"
                                value={phone}
                                onChange={onChange}
                                required
                                pattern="[0-9]{10}"
                                className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm ${duplicateField === 'phone' ? 'border-rose-500 focus:border-rose-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`}
                                placeholder="10-Digit Primary Line"
                            />
                        </InputWrapper>

                        <InputWrapper label="Email Registry" icon={Mail} error={duplicateField === 'email' ? 'Node collision: Email already exists' : null}>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm ${duplicateField === 'email' ? 'border-rose-500 focus:border-rose-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`}
                                placeholder="Official Digital Correspondence"
                            />
                        </InputWrapper>

                        <InputWrapper label="Network Referral" icon={Briefcase}>
                            <div className="relative" ref={dropdownRef}>
                                {selectedReferrer ? (
                                    <div className="w-full px-5 py-3.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl flex items-center justify-between group">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter leading-none mb-1">Referrer Selected</p>
                                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{selectedReferrer.name}</p>
                                        </div>
                                        <button type="button" onClick={handleClearReferrer} className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all">
                                            <X className="w-4 h-4 text-emerald-600" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={referralSearch}
                                            onChange={(e) => {
                                                setReferralSearch(e.target.value);
                                                setShowReferralDropdown(true);
                                            }}
                                            className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                            placeholder="Search existing partners..."
                                        />
                                        {showReferralDropdown && referralSearch.length > 0 && (
                                            <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                                {filteredReferralCustomers.length > 0 ? (
                                                    filteredReferralCustomers.map((c) => (
                                                        <button
                                                            key={c._id}
                                                            type="button"
                                                            onClick={() => handleSelectReferrer(c)}
                                                            className="w-full px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-all text-left"
                                                        >
                                                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{c.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">{c.phone}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center opacity-40">
                                                        <Search className="w-8 h-8 mx-auto mb-2" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No matching partners<br />detected in registry</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </InputWrapper>
                    </FormSection>

                    <FormSection title="Logistics Reachability" description="Physical warehouse and billing coordinates">
                        <div className="md:col-span-2">
                            <InputWrapper label="Primary Reachability Node" icon={MapPin}>
                                <textarea
                                    name="address"
                                    value={address}
                                    onChange={onChange}
                                    rows={3}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm leading-relaxed"
                                    placeholder="Warehouse Access Point / Billing Logistics Center"
                                />
                            </InputWrapper>
                        </div>
                    </FormSection>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/customers')}
                            className="px-8 py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isLoading ? 'Synchronizing Pipeline...' : 'Commit Partnership'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default AddCustomer;
