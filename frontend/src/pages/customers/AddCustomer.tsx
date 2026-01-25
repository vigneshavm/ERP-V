import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addCustomer, reset, getAllCustomers } from "../../redux/slices/customerSlice";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import { Info } from 'lucide-react';
import CustomerForm from "./components/CustomerForm";
import { RootState, AppDispatch } from '../../redux/store';
import "react-toastify/dist/ReactToastify.css";

const AddCustomer = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { isLoading, isSuccess, customers } = useSelector(
        (state: RootState) => state.customers
    );

    const [shouldNavigate, setShouldNavigate] = useState(false);
    const [duplicateField, setDuplicateField] = useState<string | null>(null);

    useEffect(() => {
        dispatch(getAllCustomers());
    }, [dispatch]);

    useEffect(() => {
        if (shouldNavigate && isSuccess) {
            navigate("/customers");
            dispatch(reset());
        }
    }, [shouldNavigate, isSuccess, navigate, dispatch]);

    const onSubmit = async (formData: any) => {
        setDuplicateField(null);
        const result: any = await dispatch(addCustomer(formData));
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

    return (
        <Layout>
            <PageHeader
                title="Consumer Onboarding"
                description="Register high-value partners into the global marketplace terminal"
                breadcrumbs={[{ label: 'Portfolio', link: '/customers' }, { label: 'New Onboarding' }]}
                actions={
                    <button
                        onClick={() => navigate('/customers')}
                        className="px-6 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-medium"
                    >
                        Abort Sync
                    </button>
                }
            />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Info className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest leading-none mt-1">Onboarding Protocol</p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-2 leading-relaxed italic">All consumer records are multi-indexed by phone number and email to prevent marketplace duplication. Ensure accuracy of contact nodes for logistics integrity.</p>
                    </div>
                </div>

                <CustomerForm
                    customers={customers}
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    duplicateField={duplicateField}
                    submitLabel="Commit Partnership"
                    onCancel={() => navigate('/customers')}
                />
            </div>
        </Layout>
    );
};

export default AddCustomer;
