import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    getCustomerById,
    clearCustomer,
    reset as resetCustomer,
} from "../../redux/slices/customerSlice";
import {
    createDueAdjustment,
    reset as resetDue,
} from "../../redux/slices/dueSlice";
import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { Button, Input, Select, Textarea } from '@/components/shared';

import { RootState } from "../../redux/store";

const DueAdjustment = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<any>(); // Temporarily use any for dispatch to avoid Thunk middleware issues

    const { customer, isLoading: customerLoading } = useSelector(
        (state: RootState) => state.customers
    );
    const {
        isLoading: dueLoading,
        isError,
        isSuccess,
        message,
    } = useSelector((state: RootState) => state.due);

    const [formData, setFormData] = useState({
        adjustmentAmount: "",
        adjustmentMethod: "cash",
        notes: "",
    });

    interface DueAdjustmentErrors {
        adjustmentAmount?: string;
        adjustmentMethod?: string;
        [key: string]: string | undefined;
    }

    const [errors, setErrors] = useState<DueAdjustmentErrors>({});

    useEffect(() => {
        if (id) {
            dispatch(getCustomerById(id));
        }
        return () => {
            dispatch(clearCustomer());
            dispatch(resetCustomer());
            dispatch(resetDue());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(resetDue());
        }

        if (isSuccess) {
            toast.success("Due adjustment created successfully!");
            dispatch(resetDue());
            navigate(`/customers/${id}`);
        }
    }, [isError, isSuccess, message, dispatch, navigate, id]);

    const validateForm = () => {
        const newErrors: DueAdjustmentErrors = {};

        if (!formData.adjustmentAmount || parseFloat(formData.adjustmentAmount) <= 0) {
            newErrors.adjustmentAmount = "Adjustment amount must be greater than zero";
        }

        if (
            customer &&
            parseFloat(formData.adjustmentAmount) > customer.dues
        ) {
            newErrors.adjustmentAmount = `Adjustment amount cannot exceed outstanding due of ₹${customer.dues.toFixed(2)}`;
        }

        if (!formData.adjustmentMethod) {
            newErrors.adjustmentMethod = "Please select an adjustment method";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const adjustmentData = {
            customerId: id,
            adjustmentAmount: parseFloat(formData.adjustmentAmount),
            adjustmentMethod: formData.adjustmentMethod,
            notes: formData.notes,
        };

        dispatch(createDueAdjustment(adjustmentData));
    };

    if (customerLoading && !customer) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-[rgb(var(--color-primary))]"></div>
                </div>
            </Layout>
        );
    }

    if (!customer) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-[rgb(var(--color-text-secondary))]">
                        Customer not found
                    </p>
                    <Button variant="tertiary" size="md" onClick={() => navigate("/customers")} className="mt-4">
                        Back to Customers
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="pt-8 space-y-8 pb-20">
                <PageHeader
                    title="Due Adjustment"
                    description={`Adjust outstanding liabilities for ${customer.name}`}
                    breadcrumbs={[
                        { label: 'Registry', link: '/customers' },
                        { label: customer.name, link: `/customers/${id}` },
                        { label: 'Adjustment' }
                    ]}
                />

                {/* Customer Info Card */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-[rgb(var(--color-text))]">
                                {customer.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-[rgb(var(--color-text-secondary))]">
                                {customer.phone}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-600 dark:text-[rgb(var(--color-text-secondary))]">
                                Outstanding Due
                            </p>
                            <p className="text-2xl font-bold text-danger dark:text-danger">
                                ₹{customer.dues.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Adjustment Form */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Adjustment Amount */}
                        <div className="mb-6">
                            <Input
                                label="Adjustment Amount"
                                required
                                type="number"
                                id="adjustmentAmount"
                                name="adjustmentAmount"
                                value={formData.adjustmentAmount}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                max={customer.dues}
                                error={errors.adjustmentAmount}
                                icon={<span className="text-slate-500 dark:text-[rgb(var(--color-text-secondary))]">₹</span>}
                                placeholder="0.00"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-[rgb(var(--color-text-secondary))]">
                                Maximum: ₹{customer.dues.toFixed(2)}
                            </p>
                        </div>

                        {/* Adjustment Method */}
                        <div className="mb-6">
                            <label
                                htmlFor="adjustmentMethod"
                                className="block text-sm font-medium text-slate-700 dark:text-[rgb(var(--color-text))] mb-2"
                            >
                                Adjustment Method <span className="text-danger">*</span>
                            </label>
                            <Select
                                options={[
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'bank', label: 'Bank Transfer' },
                                    { value: 'credit', label: 'Credit' },
                                    { value: 'original_payment', label: 'Original Payment Method' },
                                ]}
                                value={formData.adjustmentMethod}
                                onChange={(value) => handleChange({ target: { name: 'adjustmentMethod', value: typeof value === 'string' ? value : value[0] } } as any)}
                                status={errors.adjustmentMethod ? 'error' : 'default'}
                            />
                            {errors.adjustmentMethod && (
                                <p className="mt-1 text-sm text-danger dark:text-danger">
                                    {errors.adjustmentMethod}
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <Textarea
                                label="Notes (Optional)"
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                minRows={3}
                                placeholder="Add any additional notes..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="lg"
                                onClick={() => navigate(`/customers/${id}`)}
                                fullWidth
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                disabled={dueLoading || customer.dues <= 0}
                                loading={dueLoading}
                                fullWidth
                            >
                                Submit Adjustment
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default DueAdjustment;
