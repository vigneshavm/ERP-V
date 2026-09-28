import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addCustomer, reset, getAllCustomers } from "../../redux/slices/customerSlice";
import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { Button, Alert } from "../../components/shared";
import CustomerForm from "./components/CustomerForm";
import { RootState, AppDispatch } from "../../redux/store";
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
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => navigate('/customers')}
                    >
                        Abort Sync
                    </Button>
                }
            />

            <div className="max-w-5xl mx-auto space-y-6">
                <Alert
                    variant="info"
                    size="md"
                    title="New customer"
                    message="All consumer records are multi-indexed by phone number and email to prevent marketplace duplication. Ensure accuracy of contact nodes for logistics integrity."
                    showIconPill
                />

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

