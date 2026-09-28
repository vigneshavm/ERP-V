import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { CreditCard, Plus, X, CheckCircle2 } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { Button, Card, Input, Select } from "../../components/shared";
import { AppDispatch, RootState } from "../../redux/store";
import { getEMIPlans, createEMIPlan, recordInstallmentPayment, EMIPlan } from "../../redux/slices/emiPlanSlice";
import { getAllCustomers } from "../../redux/slices/customerSlice";
import { getAllSalesInvoices } from "../../redux/slices/salesInvoiceSlice";
import { formatDate } from '../../utils/helpers';

import StatusBadge from '@/components/shared/UI/StatusBadge';

// Textilesoft's "EMIMasterEntry" -- installment plans against a sale, tracked separately from
// the normal credit-sale ledger (Customer.dues) since each installment has its own due
// date/amount/status rather than one lump balance. See backend/src/modules/finance/models/EMIPlan.ts.
const EMIPlans: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { plans, isLoading } = useSelector((state: RootState) => state.emiPlans);
    const { customers } = useSelector((state: RootState) => state.customers as any);
    const { invoices } = useSelector((state: RootState) => state.salesInvoice as any);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerId, setCustomerId] = useState('');
    const [invoiceId, setInvoiceId] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [numberOfInstallments, setNumberOfInstallments] = useState('3');
    const [frequency, setFrequency] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        dispatch(getEMIPlans());
        dispatch(getAllCustomers());
        dispatch(getAllSalesInvoices() as any);
    }, [dispatch]);

    const resetForm = () => {
        setCustomerId(''); setInvoiceId(''); setTotalAmount('');
        setNumberOfInstallments('3'); setFrequency('MONTHLY');
        setStartDate(new Date().toISOString().slice(0, 10));
    };

    const handleSubmit = async () => {
        if (!customerId || !invoiceId) { toast.warning('Select a customer and invoice'); return; }
        const amount = parseFloat(totalAmount);
        const count = parseInt(numberOfInstallments, 10);
        if (!amount || amount <= 0) { toast.warning('Enter a valid total amount'); return; }
        if (!count || count < 1) { toast.warning('Enter a valid number of installments'); return; }

        setIsSaving(true);
        try {
            await dispatch(createEMIPlan({
                customerId, invoiceId, totalAmount: amount,
                numberOfInstallments: count, frequency, startDate
            } as any)).unwrap();
            toast.success('EMI plan created');
            setIsModalOpen(false);
            resetForm();
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : 'Failed to create EMI plan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRecordPayment = async (plan: EMIPlan, index: number) => {
        try {
            await dispatch(recordInstallmentPayment({ id: plan._id, installmentIndex: index })).unwrap();
            toast.success('Installment marked as paid');
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : 'Failed to record payment');
        }
    };

    const customerName = (id: any) => {
        const cid = typeof id === 'object' ? id?._id : id;
        return (customers || []).find((c: any) => c._id === cid)?.name || (typeof id === 'object' ? id?.name : '') || '—';
    };

    const invoiceLabel = (id: any) => {
        if (typeof id === 'object') return id?.invoiceNo || id?._id;
        return (invoices || []).find((i: any) => i._id === id)?.invoiceNo || id;
    };

    const summary = useMemo(() => ({
        active: plans.filter(p => p.status === 'ACTIVE').length,
        completed: plans.filter(p => p.status === 'COMPLETED').length,
        overdue: plans.reduce((sum, p) => sum + p.installments.filter(i => i.status === 'OVERDUE').length, 0)
    }), [plans]);

    return (
        <Layout>
            <PageHeader
                title="EMI Plans"
                description="Installment plans against a sale, tracked separately from the normal credit-sale ledger."
                actions={
                    <Button
                        variant="success"
                        size="md"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        New EMI Plan
                    </Button>
                }
            />

            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card variant="default" size="md">
                        <Card.Body>
                            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Active Plans</p>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{summary.active}</span>
                        </Card.Body>
                    </Card>
                    <Card variant="default" size="md">
                        <Card.Body>
                            <p className="text-xs font-bold text-success uppercase tracking-wide mb-1">Completed</p>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{summary.completed}</span>
                        </Card.Body>
                    </Card>
                    <Card variant="default" size="md">
                        <Card.Body>
                            <p className="text-xs font-bold text-danger uppercase tracking-wide mb-1">Overdue Installments</p>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{summary.overdue}</span>
                        </Card.Body>
                    </Card>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Invoice</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 text-center">Installments</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-right">Next Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {plans.map(plan => {
                                    const nextPending = plan.installments.findIndex(i => i.status !== 'PAID');
                                    return (
                                        <tr key={plan._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{customerName(plan.customerId)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{invoiceLabel(plan.invoiceId)}</td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">₹{plan.totalAmount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center text-xs text-slate-500">
                                                {plan.installments.filter(i => i.status === 'PAID').length} / {plan.installments.length} paid
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={plan.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-slate-500">
                                                {nextPending === -1 ? (
                                                    <span className="text-success font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> All paid</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span>{formatDate(plan.installments[nextPending].dueDate)} · ₹{plan.installments[nextPending].amount.toLocaleString()}</span>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleRecordPayment(plan, nextPending)}
                                                        >
                                                            Mark Paid
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!isLoading && plans.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                                            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                            No EMI plans yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold">New EMI Plan</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <Select
                                label="Customer"
                                placeholder="Select customer..."
                                options={(customers || []).map((c: any) => ({
                                    value: c._id,
                                    label: c.name
                                }))}
                                value={customerId}
                                onChange={(val) => setCustomerId(typeof val === 'string' ? val : val[0])}
                                required
                            />
                            <Select
                                label="Invoice"
                                placeholder="Select invoice..."
                                options={(invoices || []).map((i: any) => ({
                                    value: i._id,
                                    label: `${i.invoiceNo} — ₹${(i.totalAmount || 0).toLocaleString()}`
                                }))}
                                value={invoiceId}
                                onChange={(val) => setInvoiceId(typeof val === 'string' ? val : val[0])}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Total Amount"
                                    min="0"
                                    placeholder="₹0"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    required
                                />
                                <Input
                                    type="number"
                                    label="# Installments"
                                    min="1"
                                    value={numberOfInstallments}
                                    onChange={(e) => setNumberOfInstallments(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Frequency"
                                    options={[
                                        { value: 'MONTHLY', label: 'Monthly' },
                                        { value: 'WEEKLY', label: 'Weekly' }
                                    ]}
                                    value={frequency}
                                    onChange={(val) => setFrequency(val as 'MONTHLY' | 'WEEKLY')}
                                />
                                <Input
                                    type="date"
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleSubmit}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Creating...' : 'Create Plan'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default EMIPlans;
