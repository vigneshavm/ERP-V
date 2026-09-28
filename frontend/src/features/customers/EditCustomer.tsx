import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCustomerById, updateCustomer, reset, getAllCustomers } from "../../redux/slices/customerSlice";
import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { Button, Alert } from "../../components/shared";
import CustomerForm from "./components/CustomerForm";
import { RootState, AppDispatch } from "../../redux/store";
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
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-indigo-600 rounded-full animate-spin"></div>
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
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => navigate('/customers')}
                    >
                        Abort Modification
                    </Button>
                }
            />

            <div className="max-w-5xl mx-auto space-y-6">
                <Alert
                    variant="warning"
                    size="md"
                    title="Audit Warning"
                    message="Modifying contact nodes will trigger a marketplace re-indexing. Historical integrity will be updated to reflect these commercial parameters across all linked terminals."
                    showIconPill
                />

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

