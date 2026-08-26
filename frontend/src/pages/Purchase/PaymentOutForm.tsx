import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { createPayment, PaymentOut } from '../../redux/slices/paymentOutSlice';
import { getAllSuppliers } from '../../redux/slices/supplierSlice';
import { getAccounts } from '../../redux/slices/cashbankSlice';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { User, CreditCard, Banknote, CheckCircle, Plus, Trash2, ArrowLeft, Save, ShieldCheck, Zap, Info, Activity, Clock, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import BillSelectionModal from './Modals/BillSelectionModal';
import { Bill } from '../../redux/slices/billSlice';

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
    const [isSaving, setIsSaving] = useState(false);

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
        if (unallocated < 0) return toast.error("Allocation exceeds payment amount");

        setIsSaving(true);
        try {
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
        } finally {
            setIsSaving(false);
        }
    };

    const isNonCashMode = paymentMode === 'Discount Received';

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Initialize Settlement Node"
                    description="Record institutional fiscal outflows and resolve supplier liabilities with node-level allocation."
                    breadcrumbs={[
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Settlement Archive', link: '/purchase/payments' },
                        { label: 'New Settlement' }
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/purchase/payments')}
                                className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 shadow-sm transition active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2 inline" /> Abort
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95"
                            >
                                {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settlement Node
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Form Details */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3 mb-8">
                                <User className="w-5 h-5 text-primary" /> Institutional Payee
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Supplier Entity</label>
                                    <select
                                        value={supplierId}
                                        onChange={e => setSupplierId(e.target.value)}
                                        className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="">Select Entity...</option>
                                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.businessName}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Fiscal Date</label>
                                        <input
                                            type="date"
                                            value={paymentDate}
                                            onChange={e => setPaymentDate(e.target.value)}
                                            className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Node Quantum (INR)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                            className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black tabular-nums focus:ring-4 focus:ring-emerald-500/10 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3 mb-8">
                                <CreditCard className="w-5 h-5 text-success" /> Settlement Mechanism
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    {['Bank Transfer', 'Cheque', 'UPI', 'Cash', 'Discount Received'].map(m => (
                                        <button
                                            type="button"
                                            key={m}
                                            onClick={() => setPaymentMode(m as PaymentOut['paymentMode'])}
                                            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${paymentMode === m
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                : 'bg-neutral-50 dark:bg-neutral-900 border-transparent text-neutral-400 hover:text-neutral-600'
                                                } ${m === 'Discount Received' ? 'col-span-2' : ''}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                {!isNonCashMode && (
                                    <div className="space-y-6 animate-in fade-in duration-500">
                                        <div>
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">
                                                {paymentMode === 'Cheque' ? 'Instrument Node # (Cheque)' : 'Institutional Reference / UTR'}
                                            </label>
                                            <input
                                                type="text"
                                                value={referenceNo}
                                                onChange={e => setReferenceNo(e.target.value)}
                                                className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                placeholder="e.g. 123456"
                                            />
                                        </div>

                                        {(paymentMode === 'Cheque' || paymentMode === 'Bank Transfer' || paymentMode === 'UPI') && (
                                            <div>
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Source Institutional Account</label>
                                                <select
                                                    value={bankAccountId}
                                                    onChange={e => setBankAccountId(e.target.value)}
                                                    className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                                                >
                                                    <option value="">Select Account...</option>
                                                    {accounts.filter(a => a.accountType !== 'Cash').map(acc => (
                                                        <option key={acc._id} value={acc._id}>
                                                            {acc.bankName} (****{acc.accountNumber?.slice(-4)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {paymentMode === 'Cheque' && (
                                            <div>
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Post-Dated Node (Cheque Date)</label>
                                                <input
                                                    type="date"
                                                    value={chequeDate}
                                                    onChange={e => setChequeDate(e.target.value)}
                                                    className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isNonCashMode && (
                                    <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-[2rem] animate-in slide-in-from-top-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <ShieldCheck className="w-4 h-4 text-warning" />
                                            <p className="text-[10px] font-black text-amber-900/60 dark:text-warning uppercase tracking-widest">Discount Settlement Protocol</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-amber-800 dark:text-warning italic leading-relaxed">
                                            Settling via discount reduces bill liability without affecting institutional vault/bank nodes.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Allocation */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="p-10 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <Banknote className="w-5 h-5 text-warning" /> Liability Allocation Ledger
                                </h3>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1">Unallocated Node Quantum</p>
                                        <p className={`text-xl font-black tabular-nums tracking-tighter ${unallocated > 0 ? 'text-success' : 'text-neutral-900 dark:text-white'}`}>₹{unallocated.toLocaleString()}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!supplierId) return toast.error("Please select a supplier first");
                                            setIsBillModalOpen(true);
                                        }}
                                        className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Select Bills
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-left">
                                    <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                        <tr>
                                            <th className="px-8 py-5">Liability Node (Bill)</th>
                                            <th className="px-8 py-5">Fiscal Date</th>
                                            <th className="px-8 py-5 text-right">Node Total</th>
                                            <th className="px-8 py-5 text-right">Allocated Quantum</th>
                                            <th className="px-8 py-5 text-right">Institutional Discount</th>
                                            <th className="px-8 py-5 w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {selectedBills.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-6 opacity-30 grayscale max-w-sm mx-auto">
                                                        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                            <Banknote className="w-10 h-10" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-sm uppercase tracking-widest text-center">Allocation Queue Empty</p>
                                                            <p className="text-xs font-bold mt-2 italic leading-relaxed text-center">Initialize allocation by selecting institutional liability nodes (bills).</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedBills.map(bill => (
                                                <tr key={bill._id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all">
                                                    <td className="px-8 py-6 whitespace-nowrap">
                                                        <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">#{bill.billNo}</span>
                                                    </td>
                                                    <td className="px-8 py-6 whitespace-nowrap">
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                            {new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right text-xs font-black text-neutral-400 tabular-nums">
                                                        ₹{bill.amount?.toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-sm font-black text-primary tabular-nums">₹{allocations[bill._id || '']?.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-xs font-black text-success tabular-nums">
                                                            {discounts[bill._id || ''] ? `-₹${discounts[bill._id || ''].toLocaleString()}` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBill(bill._id || '')}
                                                            className="p-2 text-neutral-300 hover:text-danger hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {selectedBills.length > 0 && (
                                        <tfoot className="bg-neutral-50/30 dark:bg-neutral-900/30 font-black">
                                            <tr>
                                                <td colSpan={3} className="px-8 py-6 text-[10px] text-neutral-400 uppercase tracking-widest text-right">Aggregate Allocation</td>
                                                <td className="px-8 py-6 text-right text-lg text-primary tabular-nums tracking-tighter">₹{totalAllocated.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right text-sm text-success tabular-nums tracking-tighter">₹{totalDiscount.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Audit Narrative Node */}
                        <div className="bg-white dark:bg-neutral-800 p-10 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3">
                                <Info className="w-5 h-5 text-neutral-400" /> Settlement Narrative & Notes
                            </h3>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={4}
                                className="w-full px-8 py-6 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-[2rem] text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                                placeholder="Audit trail remarks, payment justifications, dispute resolutions..."
                            />
                        </div>
                    </div>
                </div>
            </div>

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
