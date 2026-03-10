import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from "@/app/store/store";
import { createPayment, PaymentOut } from "@/app/store/slices/paymentOutSlice";
import { getAllSuppliers } from "@/entities/contact/model/supplierSlice";
import { getAccounts } from "@/entities/finance/model/cashbankSlice";
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { User, CreditCard, Banknote, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import BillSelectionModal from './Modals/BillSelectionModal';
import { Bill } from "@/entities/finance/model/billSlice";

const PaymentOutForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { suppliers } = useSelector((state: RootState) => state.suppliers);
    const { accounts } = useSelector((state: RootState) => state.cashbank);

    // Local State
    const [supplierId, setSupplierId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState<number>(0);
    const [paymentMode, setPaymentMode] = useState<PaymentOut['paymentMode']>('Bank Transfer');
    const [referenceNo, setReferenceNo] = useState('');
    const [bankAccountId, setBankAccountId] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    const [notes, setNotes] = useState('');

    // Allocation State
    const [selectedBills, setSelectedBills] = useState<Bill[]>([]);
    const [allocations, setAllocations] = useState<{ [billId: string]: number }>({});
    const [discounts, setDiscounts] = useState<{ [billId: string]: number }>({});

    // UI State
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);

    useEffect(() => {
        dispatch(getAllSuppliers());
        dispatch(getAccounts());
    }, [dispatch]);

    // Reset allocations if supplier changes
    useEffect(() => {
        setSelectedBills([]);
        setAllocations({});
        setDiscounts({});
    }, [supplierId]);

    const handleBillsSelected = (bills: Bill[], newAllocations: { [billId: string]: number }, newDiscounts: { [billId: string]: number }) => {
        setSelectedBills(bills);
        setAllocations(newAllocations);
        setDiscounts(newDiscounts);

        // Auto-update total amount
        const totalAllocated = Object.values(newAllocations).reduce((a, b) => a + b, 0);
        setAmount(totalAllocated);
    };

    const removeBill = (billId: string) => {
        setSelectedBills(prev => prev.filter(b => b._id !== billId));
        const newAllocations = { ...allocations };
        const newDiscounts = { ...discounts };
        delete newAllocations[billId];
        delete newDiscounts[billId];
        setAllocations(newAllocations);
        setDiscounts(newDiscounts);

        // Update amount? Maybe keep amount as is, or reduce it?
        // Usually if I remove a bill, I expect the total payment amount to drop.
        const totalAllocated = Object.values(newAllocations).reduce((a, b) => a + b, 0);
        setAmount(totalAllocated);
    };

    const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
    const totalDiscount = Object.values(discounts).reduce((a, b) => a + b, 0);
    const unallocated = Math.max(0, amount - totalAllocated);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId) return toast.error("Select Supplier");
        if (amount <= 0) return toast.error("Enter valid amount");
        // if (totalAllocated > amount) return toast.error("Allocation exceeds payment amount"); 
        // Allow unallocated amount (advance payment), but not negative unallocated.
        if (unallocated < 0) return toast.error("Allocation exceeds payment amount");

        const paymentData: PaymentOut = {
            supplierId,
            paymentDate,
            amount,
            paymentMode,
            referenceNo,
            bankAccountId: (['Cheque', 'Bank Transfer', 'UPI'].includes(paymentMode)) ? bankAccountId : undefined,
            chequeDate: paymentMode === 'Cheque' ? chequeDate : undefined,
            notes,
            allocations: Object.entries(allocations)
                .filter(([_, val]) => val > 0)
                .map(([billId, val]) => ({
                    billId,
                    amount: val,
                    discount: discounts[billId] || 0
                }))
        };

        const res = await dispatch(createPayment(paymentData));
        if (createPayment.fulfilled.match(res)) {
            toast.success('Payment Recorded Successfully');
            navigate('/purchase/payments');
        } else {
            toast.error(res.payload as string || 'Failed to record payment');
        }
    };

    const isNonCashMode = paymentMode === 'Discount Received';

    return (
        <Layout>
            <PageHeader
                title="Record Payment"
                description="Issue payment to supplier or settle via discount"
                breadcrumbs={[{ label: 'Payments', link: '/purchase/payments' }, { label: 'New' }]}
            />

            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Form Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                            <User size={20} className="text-indigo-500" />
                            Payee Details
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                                <select
                                    value={supplierId}
                                    onChange={e => setSupplierId(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.businessName}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Date</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={e => setPaymentDate(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full pl-8 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-lg outline-none focus:border-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                            <CreditCard size={20} className="text-emerald-500" />
                            {isNonCashMode ? 'Settlement Mode' : 'Payment Mode'}
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {['Bank Transfer', 'Cheque', 'UPI', 'Cash', 'Discount Received'].map(m => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setPaymentMode(m as PaymentOut['paymentMode'])}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${paymentMode === m
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                            } ${m === 'Discount Received' ? 'col-span-2' : ''}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {!isNonCashMode && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            {paymentMode === 'Cheque' ? 'Cheque No' : 'Transaction Ref / UTR'}
                                        </label>
                                        <input
                                            type="text"
                                            value={referenceNo}
                                            onChange={e => setReferenceNo(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                                            placeholder="e.g. 123456"
                                        />
                                    </div>

                                    {(paymentMode === 'Cheque' || paymentMode === 'Bank Transfer' || paymentMode === 'UPI') && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source Bank Account</label>
                                            <select
                                                value={bankAccountId}
                                                onChange={e => setBankAccountId(e.target.value)}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                                            >
                                                <option value="">-- Select Bank Account --</option>
                                                {accounts.filter(a => a.accountType !== 'Cash').map(acc => (
                                                    <option key={acc._id} value={acc._id}>
                                                        {acc.bankName} - {acc.accountType} (****{acc.accountNumber?.slice(-4)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {paymentMode === 'Cheque' && (
                                        <div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cheque Date</label>
                                                <input
                                                    type="date"
                                                    value={chequeDate}
                                                    onChange={e => setChequeDate(e.target.value)}
                                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                                                />
                                                <p className="text-xs text-slate-400 mt-1">For Post-Dated Cheques</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {isNonCashMode && (
                                <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
                                    <p className="font-bold">Discount Settlement</p>
                                    <p>Select bills to apply discount against. This will reduce the bill balance without reducing bank/cash balance.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Allocation */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center justify-between">
                            <span className="flex items-center gap-2"><Banknote size={20} className="text-amber-500" /> Allocation</span>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-normal text-slate-500">
                                    Unallocated: <strong className={unallocated > 0 ? 'text-emerald-600' : 'text-slate-700'}>₹{unallocated.toLocaleString()}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!supplierId) return toast.error("Please select a supplier first");
                                        setIsBillModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg font-bold transition-all flex items-center gap-2 text-sm"
                                >
                                    <Plus size={16} /> Select Bills
                                </button>
                            </div>
                        </h3>

                        {selectedBills.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[200px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                <Banknote size={48} className="mb-2" />
                                <p>No bills selected for allocation</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!supplierId) return toast.error("Please select a supplier first");
                                        setIsBillModalOpen(true);
                                    }}
                                    className="mt-4 text-indigo-600 font-bold hover:underline"
                                >
                                    Select Bills
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Bill No</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                            <th className="px-4 py-3 text-right">Allocated</th>
                                            <th className="px-4 py-3 text-right">Discount</th>
                                            <th className="px-4 py-3 rounded-r-lg w-10">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {selectedBills.map(bill => (
                                            <tr key={bill._id}>
                                                <td className="px-4 py-3 font-medium">{bill.billNo}</td>
                                                <td className="px-4 py-3 text-slate-500">{new Date(bill.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">₹{bill.amount?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-bold text-indigo-600">
                                                    ₹{allocations[bill._id || '']?.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-500">
                                                    {discounts[bill._id || ''] ? `₹${discounts[bill._id || ''].toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBill(bill._id || '')}
                                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-slate-200 dark:border-slate-700 font-bold">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 text-right">Total</td>
                                            <td className="px-4 py-3 text-right text-indigo-600">₹{totalAllocated.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">₹{totalDiscount.toLocaleString()}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/purchase/payments')}
                                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Save Payment
                            </button>
                        </div>
                    </div>
                </div>

            </form>

            <BillSelectionModal
                isOpen={isBillModalOpen}
                onClose={() => setIsBillModalOpen(false)}
                supplierId={supplierId}
                onConfirm={handleBillsSelected}
                initialAllocations={allocations}
                initialDiscounts={discounts}
            />
        </Layout>
    );
};

export default PaymentOutForm;
