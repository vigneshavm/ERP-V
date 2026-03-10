import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCustomerById, updateCustomer, reset, getAllCustomers } from "@/entities/contact/model/customerSlice";
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { Zap } from 'lucide-react';
import CustomerForm from "./components/CustomerForm";
import { RootState, AppDispatch } from "@/app/store/store";
import "react-toastify/dist/ReactToastify.css";

const EditCustomer = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { customer, isLoading, isSuccess, customers } = useSelector(
        (state: RootState) => state.customers
    );

    const [shouldNavigate, setShouldNavigate] = useState(false);
    const [duplicateField, setDuplicateField] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            dispatch(getCustomerById(id));
            dispatch(getAllCustomers()); // Needed for referrer selection list
        }
        return () => {
            dispatch(reset());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (shouldNavigate && isSuccess && !isLoading) {
            navigate("/customers");
            dispatch(reset());
        }
    }, [shouldNavigate, isSuccess, isLoading, navigate, dispatch]);

    const onSubmit = async (formData: any) => {
        if (!id) return;
        setDuplicateField(null);
        const result: any = await dispatch(updateCustomer({ id, customerData: formData }));
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
                description={`Updating system parameters for CID-${id?.slice(-6).toUpperCase()}`}
                breadcrumbs={[{ label: 'Portfolio', link: '/customers' }, { label: 'Intel Modification' }]}
                actions={
                    <button
                        onClick={() => navigate('/customers')}
                        className="px-6 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-medium"
                    >
                        Abort Modification
                    </button>
                }
            />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-4 rounded-2xl flex items-start gap-4 text-amber-900 dark:text-amber-300">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                        < Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest leading-none mt-1">Audit Warning</p>
                        <p className="text-[11px] font-medium mt-2 leading-relaxed italic opacity-80">Modifying contact nodes will trigger a marketplace re-indexing. Historical integrity will be updated to reflect these commercial parameters across all linked terminals.</p>
                    </div>
                </div>

                <CustomerForm
                    initialData={customer || undefined}
                    customers={customers}
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    duplicateField={duplicateField}
                    submitLabel="Push Updates"
                    onCancel={() => navigate('/customers')}
                />
            </div>
        </Layout>
    );
};

export default EditCustomer;

