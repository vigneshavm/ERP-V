import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    getCustomerById,
    updateCustomer,
    reset,
} from "../../redux/slices/customerSlice";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import {
    User,
    Phone,
    Mail,
    MapPin,
    RefreshCcw,
    ShieldCheck,
    AlertCircle,
    Info,
    X,
    Briefcase,
    Zap
} from 'lucide-react';
import "react-toastify/dist/ReactToastify.css";

const EditCustomer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { customer, isLoading, isSuccess, isError, message } = useSelector(
        (state) => state.customers
    );

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });

    const [shouldNavigate, setShouldNavigate] = useState(false);
    const [duplicateField, setDuplicateField] = useState(null);

    const { name, phone, email, address } = formData;

    useEffect(() => {
        dispatch(getCustomerById(id));
        return () => {
            dispatch(reset());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || "",
                phone: customer.phone || "",
                email: customer.email || "",
                address: customer.address || "",
            });
        }
    }, [customer]);

    useEffect(() => {
        if (shouldNavigate && isSuccess && !isLoading) {
            navigate("/customers");
            dispatch(reset());
        }
    }, [shouldNavigate, isSuccess, isLoading, navigate, dispatch]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setDuplicateField(null);
        const result = await dispatch(updateCustomer({ id, customerData: formData }));
        if (result.type === 'customers/update/fulfilled') {
            toast.success("Profile re-indexed successfully!");
            setShouldNavigate(true);
        } else if (result.type === 'customers/update/rejected') {
            const errorMsg = result.payload || "Modification failure";
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

    if (isLoading && !customer) {
        return (
            <Layout>
                <div className="flex justify-center items-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-400">Fetching Partner Intel...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title="Modify Partner Intel"
                description={`Updating system parameters for CID-${id.slice(-6).toUpperCase()}`}
                breadcrumbs={[{ label: 'Portfolio', link: '/customers' }, { label: 'Intel Modification' }]}
                actions={
                    <button
                        onClick={() => navigate('/customers')}
                        className="px-6 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                        Abort Modification
                    </button>
                }
            />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* System Integrity Alert */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-4 rounded-2xl flex items-start gap-4 text-amber-900 dark:text-amber-300">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                        <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest leading-none mt-1">Audit Warning</p>
                        <p className="text-[11px] font-medium mt-2 leading-relaxed italic opacity-80">Modifying contact nodes will trigger a marketplace re-indexing. Historical integrity will be updated to reflect these commercial parameters across all linked terminals.</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-6 pb-20">
                    <FormSection title="Updated Identity" description="New contact parameters and decision-maker details">
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
                    </FormSection>

                    <FormSection title="Logistics Registry" description="Warehouse access point and billing coordinates">
                        <div className="md:col-span-2">
                            <InputWrapper label="Reachability Node" icon={MapPin}>
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
                            className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isLoading ? 'Processing Re-sync...' : 'Push Updates'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default EditCustomer;
