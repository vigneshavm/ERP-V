import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { CreditCard, Plus, X, CheckCircle2, Search } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { AppDispatch, RootState } from "../../redux/store";
import { getEMIPlans, createEMIPlan, recordInstallmentPayment, EMIPlan } from "../../redux/slices/emiPlanSlice";
import { getAllCustomers } from "../../redux/slices/customerSlice";
import { getAllSalesInvoices } from "../../redux/slices/salesInvoiceSlice";
import { formatDate } from '../../utils/helpers';

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
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success/90 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New EMI Plan
                    </button>
                }
            />

            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 shadow-sm">
                        <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Active Plans</p>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{summary.active}</span>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 shadow-sm">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Completed</p>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{summary.completed}</span>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 shadow-sm">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-1">Overdue Installments</p>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{summary.overdue}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Invoice</th>
                                    <th className="px-6 py-3">Total</th>
                                    <th className="px-6 py-3">Installments</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Next Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {plans.map(plan => {
                                    const nextPending = plan.installments.findIndex(i => i.status !== 'PAID');
                                    return (
                                        <tr key={plan._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                            <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white">{customerName(plan.customerId)}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{invoiceLabel(plan.invoiceId)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white">₹{plan.totalAmount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-xs text-neutral-500">
                                                {plan.installments.filter(i => i.status === 'PAID').length} / {plan.installments.length} paid
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${plan.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : plan.status === 'DEFAULTED' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-primary'}`}>
                                                    {plan.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-neutral-500">
                                                {nextPending === -1 ? (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> All paid</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span>{formatDate(plan.installments[nextPending].dueDate)} · ₹{plan.installments[nextPending].amount.toLocaleString()}</span>
                                                        <button
                                                            onClick={() => handleRecordPayment(plan, nextPending)}
                                                            className="px-2 py-1 bg-neutral-900 dark:bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-neutral-800"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!isLoading && plans.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-neutral-400">
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
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold">New EMI Plan</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Customer</label>
                                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none">
                                    <option value="">Select customer...</option>
                                    {(customers || []).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Invoice</label>
                                <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none">
                                    <option value="">Select invoice...</option>
                                    {(invoices || []).map((i: any) => <option key={i._id} value={i._id}>{i.invoiceNo} — ₹{(i.totalAmount || 0).toLocaleString()}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Total Amount</label>
                                    <input type="number" min="0" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block"># Installments</label>
                                    <input type="number" min="1" value={numberOfInstallments} onChange={(e) => setNumberOfInstallments(e.target.value)} className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Frequency</label>
                                    <select value={frequency} onChange={(e) => setFrequency(e.target.value as 'MONTHLY' | 'WEEKLY')} className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none">
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="WEEKLY">Weekly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Start Date</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-800">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSaving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60">
                                {isSaving ? 'Creating...' : 'Create Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default EMIPlans;
