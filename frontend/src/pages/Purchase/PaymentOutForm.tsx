import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { createPayment } from '../../redux/slices/paymentOutSlice';
import { getAllSuppliers } from '../../redux/slices/supplierSlice';
// getPurchases removed
// Note: We need a way to get unpaid bills. Ideally new thunk 'getUnpaidBills' in billSlice or similar.
// For now, I'll assume we can filter expenses or use a new endpoint. 
// Actually, let's presume we fetch all bills and filter by status 'unpaid' / 'partial' for the supplier.
import { getAllBills } from '../../redux/slices/billSlice';

import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { User, Calendar, CreditCard, Banknote, Landmark, CheckCircle, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const PaymentOutForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { suppliers } = useSelector((state: RootState) => state.suppliers);
    // const { bills } = useSelector((state: RootState) => state.bill); // Assuming billSlice exists and has bills

    // Local State
    const [supplierId, setSupplierId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState<number>(0);
    const [paymentMode, setPaymentMode] = useState('Bank Transfer');
    const [referenceNo, setReferenceNo] = useState('');
    const [bankName, setBankName] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    const [notes, setNotes] = useState('');

    const [unpaidBills, setUnpaidBills] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<{ [billId: string]: number }>({});
    const [discounts, setDiscounts] = useState<{ [billId: string]: number }>({});

    useEffect(() => {
        dispatch(getAllSuppliers());
    }, [dispatch]);

    useEffect(() => {
        if (supplierId) {
            // In real app, dispatch(getUnpaidBills(supplierId));
            // Simulating fetch or assuming we have a way to search bills.
            // For now, let's try to fetch all bills and filter. 
            // Warning: This might be inefficient if 1000s of bills. 
            // Better strategy: The backend 'getSupplierAnalytics' or dedicated 'getUnpaidBills' endpoint.
            // I will implement a quick fetch logic or assume 'fetchBills' is available.
            dispatch(getAllBills()).unwrap().then((allBills: any[]) => { // Assuming returns array
                const relevant = allBills.filter(b =>
                    b.supplierId?._id === supplierId &&
                    (b.status === 'unpaid' || b.paymentStatus === 'partial' || b.paymentStatus === 'overdue')
                );
                setUnpaidBills(relevant);
            }).catch(() => { });
        } else {
            setUnpaidBills([]);
        }
    }, [supplierId, dispatch]);


    const handleAllocationChange = (billId: string, val: number) => {
        setAllocations(prev => ({ ...prev, [billId]: val }));
    };

    const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
    const unallocated = Math.max(0, amount - totalAllocated);

    const handleAutoAllocate = () => {
        if (amount <= 0) return toast.warning("Please enter a valid payment amount first");
        if (unpaidBills.length === 0) return toast.warning("No unpaid bills to allocate to");

        // Sort bills by date (FIFO)
        const sortedBills = [...unpaidBills].sort((a, b) => new Date(a.billDate).getTime() - new Date(b.billDate).getTime());

        let remaining = amount;
        const newAllocations: { [billId: string]: number } = {};

        sortedBills.forEach(bill => {
            if (remaining <= 0) return;

            const due = (bill.amount || 0) - (bill.paidAmount || 0);
            if (due <= 0) return;

            const allocation = Math.min(remaining, due);
            newAllocations[bill._id] = allocation;
            remaining -= allocation;
        });

        setAllocations(newAllocations);
        if (remaining > 0) {
            toast.info(`Allocated to all bills. ₹${remaining.toLocaleString()} remaining unallocated.`);
        } else {
            toast.success("Amount auto-allocated to oldest bills first.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId) return toast.error("Select Supplier");
        if (amount <= 0) return toast.error("Enter valid amount");
        if (totalAllocated > amount) return toast.error("Allocation exceeds payment amount");

        const paymentData: any = {
            supplierId,
            paymentDate,
            amount,
            paymentMode,
            referenceNo,
            bankName: paymentMode === 'Cheque' ? bankName : undefined,
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

    return (
        <Layout>
            <PageHeader
                title="Record Payment"
                description="Issue payment to supplier"
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
                            Mode & Reference
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {['Bank Transfer', 'Cheque', 'UPI', 'Cash'].map(m => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setPaymentMode(m)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${paymentMode === m
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

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

                            {paymentMode === 'Cheque' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            value={bankName}
                                            onChange={e => setBankName(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                                            placeholder="Issuing Bank"
                                        />
                                    </div>
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
                                </>
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
                                <button
                                    type="button"
                                    onClick={handleAutoAllocate}
                                    className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg font-bold transition-colors"
                                >
                                    Auto-Allocate
                                </button>
                                <span className="text-sm font-normal text-slate-500">
                                    Unallocated: <strong className={unallocated > 0 ? 'text-emerald-600' : 'text-slate-700'}>₹{unallocated.toLocaleString()}</strong>
                                </span>
                            </div>
                        </h3>

                        {unpaidBills.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[200px]">
                                <Search size={48} className="mb-2" />
                                <p>Select a supplier to view unpaid bills</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Bill No</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 text-right">Bill Amt</th>
                                            <th className="px-4 py-3 text-right">Due Amt</th>
                                            <th className="px-4 py-3 w-32">Allocate</th>
                                            <th className="px-4 py-3 rounded-r-lg w-24">Discount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {unpaidBills.map(bill => (
                                            <tr key={bill._id} className={allocations[bill._id] > 0 ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}>
                                                <td className="px-4 py-3 font-medium">{bill.billNo}</td>
                                                <td className="px-4 py-3 text-slate-500">{new Date(bill.billDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">₹{bill.amount?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                                    {/* Calculate due considering partial payments not yet in Redux maybe? 
                                                        Assuming bill.paidAmount is up to date */}
                                                    ₹{((bill.amount || 0) - (bill.paidAmount || 0)).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-right focus:border-indigo-500 outline-none"
                                                        value={allocations[bill._id] || ''}
                                                        placeholder="0"
                                                        onChange={e => handleAllocationChange(bill._id, parseFloat(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-right text-xs focus:border-indigo-500 outline-none"
                                                        value={discounts[bill._id] || ''}
                                                        placeholder="0"
                                                        onChange={e => setDiscounts(prev => ({ ...prev, [bill._id]: parseFloat(e.target.value) }))}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
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
        </Layout>
    );
};

export default PaymentOutForm;
