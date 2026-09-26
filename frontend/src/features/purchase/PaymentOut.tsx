
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from "../../components/shared/Layout/index";
import {
    CreditCard, ArrowLeft, Save, DollarSign, Building, Tag, FileText, CheckCircle2,
    Calculator
} from 'lucide-react';
import api from "../../services/api";
import { toast } from 'react-toastify';

/** A supplier bill still (partly) unpaid, as returned by GET /api/bills. */
interface OutstandingBill { id: string; billNo: string; date: string; due: string; balance: number }
interface SupplierOption { id: string; name: string }
interface BankOption { id: string; name: string }
interface Allocation { billId: string; billNo: string; amount: number }
type Mode = 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash';

const errorText = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
const dayOf = (v: unknown) => (v ? String(v).slice(0, 10) : '');

/**
 * Purchase › Payment Out: records a supplier payment through POST /api/purchase-payments, which saves the payment,
 * updates each allocated bill's paid amount and records the money leaving cash or the bank. It used to list two
 * made-up "Mock Vendor" bills and only pretended to save (console.log + a success message).
 */
const PaymentOut: React.FC = () => {
    const navigate = useNavigate();
    const { vendorId } = useParams<{ vendorId?: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [banks, setBanks] = useState<BankOption[]>([]);
    const [outstandingBills, setOutstandingBills] = useState<OutstandingBill[]>([]);
    const [billsLoading, setBillsLoading] = useState(false);

    const [supplierId, setSupplierId] = useState(vendorId ?? '');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [mode, setMode] = useState<Mode>('Bank Transfer');
    const [bankAccountId, setBankAccountId] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    const [notes, setNotes] = useState('');
    const [allocations, setAllocations] = useState<Allocation[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [sup, acc] = await Promise.all([api.get('/api/purchases/suppliers'), api.get('/api/cashbank/accounts')]);
                if (cancelled) return;
                const supList = Array.isArray(sup.data?.data) ? sup.data.data : Array.isArray(sup.data) ? sup.data : [];
                setSuppliers(supList.map((v: Record<string, unknown>) => ({ id: String(v._id ?? v.id), name: String(v.businessName ?? v.name ?? 'Supplier') })));
                const accList = Array.isArray(acc.data) ? acc.data : Array.isArray(acc.data?.data) ? acc.data.data : [];
                const bankList = accList.filter((a: Record<string, unknown>) => a.accountType !== 'Cash' && a.status !== 'inactive')
                    .map((a: Record<string, unknown>) => ({ id: String(a._id ?? a.id), name: String(a.bankName ?? 'Bank account') }));
                setBanks(bankList);
                if (bankList.length) setBankAccountId(b => b || bankList[0].id);
            } catch (err) {
                if (!cancelled) setLoadError(errorText(err, 'Could not load suppliers and bank accounts. Refresh to try again.'));
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        setAllocations([]);
        setOutstandingBills([]);
        if (!supplierId) return;
        let cancelled = false;
        setBillsLoading(true);
        api.get('/api/bills', { params: { supplier: supplierId, paymentStatus: 'unpaid,partial' } })
            .then(res => {
                if (cancelled) return;
                const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
                setOutstandingBills(list
                    .filter((b: Record<string, unknown>) => b.status !== 'rejected' && b.status !== 'draft')
                    .map((b: Record<string, unknown>) => ({
                        id: String(b._id),
                        billNo: String(b.vendorInvoiceNo || b.billNo || ''),
                        date: dayOf(b.date),
                        due: dayOf(b.dueDate),
                        balance: Math.max(0, Number(b.amount || 0) - Number(b.paidAmount || 0) - Number(b.discountReceived || 0)),
                    }))
                    .filter((b: OutstandingBill) => b.balance > 0.5));
            })
            .catch(err => { if (!cancelled) toast.error(errorText(err, 'Could not load this supplier\'s bills.')); })
            .finally(() => { if (!cancelled) setBillsLoading(false); });
        return () => { cancelled = true; };
    }, [supplierId]);

    const toggleBillSelection = (bill: OutstandingBill) => {
        setAllocations(prev => (prev.some(a => a.billId === bill.id)
            ? prev.filter(a => a.billId !== bill.id)
            : [...prev, { billId: bill.id, billNo: bill.billNo, amount: bill.balance }]));
    };

    const setAllocationAmount = (billId: string, value: string) => {
        setAllocations(prev => prev.map(a => (a.billId === billId ? { ...a, amount: Number(value) || 0 } : a)));
    };

    const totalToPay = useMemo(() => allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0), [allocations]);
    const needsBank = mode !== 'Cash';

    const handleSave = async () => {
        if (!supplierId) return toast.warning('Please select a supplier');
        if (allocations.length === 0) return toast.warning('Please select at least one bill to pay');
        const over = allocations.find(a => a.amount > (outstandingBills.find(b => b.id === a.billId)?.balance ?? 0) + 0.5);
        if (over) return toast.warning(`The amount for bill ${over.billNo} is more than its balance`);
        if (allocations.some(a => !(a.amount > 0))) return toast.warning('Each selected bill needs an amount above zero');
        if (needsBank && !bankAccountId) return toast.warning('Pick the bank account the payment is made from');

        setIsLoading(true);
        try {
            await api.post('/api/purchase-payments', {
                supplierId,
                paymentDate,
                amount: Math.round(totalToPay * 100) / 100,
                paymentMode: mode,
                referenceNo: referenceNo || undefined,
                bankAccountId: needsBank ? bankAccountId : undefined,
                chequeDate: mode === 'Cheque' && chequeDate ? chequeDate : undefined,
                allocations: allocations.map(a => ({ billId: a.billId, amount: a.amount, discount: 0 })),
                notes: notes || undefined,
            });
            toast.success('Payment recorded');
            navigate('/purchase/payments');
        } catch (err) {
            toast.error(errorText(err, 'Failed to save the payment'));
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <Layout>
            <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="page-title text-slate-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-brand-600" />
                                Record Supplier Payment
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">Clear outstanding balances and settle multi-bill invoices.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="btn btn-primary bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/20 px-8"
                        >
                            {isLoading ? 'Processing...' : <><Save className="w-4 h-4 mr-2" /> Save Payment</>}
                        </button>
                    </div>
                </div>

                {loadError && (
                    <div role="alert" className="rounded-md border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger dark:border-danger/50 dark:bg-danger-soft dark:text-danger">{loadError}</div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Basic Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-slate-400" />
                                Payment Header
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Date</label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                                    <select
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value as Mode)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    >
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Cash">Cash</option>
                                    </select>
                                </div>
                                {needsBank && (
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid From</label>
                                        <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none">
                                            {banks.length === 0 && <option value="">No bank accounts — add one under Finance › Bank</option>}
                                            {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {mode === 'Cheque' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cheque Date</label>
                                        <input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reference ID / Cheque #</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={referenceNo}
                                            onChange={(e) => setReferenceNo(e.target.value)}
                                            placeholder="Enter Transaction Ref"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                        />
                                        <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bill Allocation Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
                            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-brand-600" />
                                    Bill Allocation
                                </h3>
                                <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-bold uppercase">
                                    {outstandingBills.length} Outstanding Bills
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-3 w-10"></th>
                                            <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px]">Bill Details</th>
                                            <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px]">Due Date</th>
                                            <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px] text-right">Balance</th>
                                            <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px] text-right w-40">Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {outstandingBills.map((bill) => {
                                            const allocation = allocations.find(a => a.billId === bill.id);
                                            const isSelected = !!allocation;

                                            return (
                                                <tr key={bill.id} className={`${isSelected ? 'bg-brand-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleBillSelection(bill)}
                                                            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-white">{bill.billNo || '—'}</span>
                                                            <span className="text-[10px] text-slate-500">{bill.date}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-slate-600 font-medium">{bill.due || '—'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-bold">{formatCurrency(bill.balance)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isSelected ? (
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    value={allocation.amount}
                                                                    onChange={(e) => setAllocationAmount(bill.id, e.target.value)}
                                                                    className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-brand-200 dark:border-brand-800 rounded-lg text-sm text-right font-bold focus:ring-2 focus:ring-brand-500/20 outline-none"
                                                                />
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₹</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-[10px] italic">Select to pay</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {outstandingBills.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                    {!supplierId ? 'Select a supplier to see outstanding bills.' : billsLoading ? 'Loading bills…' : 'This supplier has no unpaid bills in the ERP.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div className="space-y-6">
                        <div className="bg-brand-600 rounded-sm p-6 text-white shadow-xl shadow-brand-600/20 sticky top-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Settlement Summary
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-brand-500/30">
                                    <span className="text-sm font-medium opacity-80">Total Bills Selected</span>
                                    <span className="font-bold">{allocations.length}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-brand-500/30">
                                    <span className="text-sm font-medium opacity-80">Payment Method</span>
                                    <span className="font-bold">{mode}</span>
                                </div>

                                <div className="pt-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold">Total Payout</span>
                                        <span className="text-2xl font-black">{formatCurrency(totalToPay)}</span>
                                    </div>
                                    <p className="text-[10px] opacity-60 italic text-right">{needsBank ? 'Taken from the selected bank account.' : 'Paid out of cash.'}{mode === 'Cheque' ? ' Cheques stay pending until cleared.' : ''}</p>
                                </div>

                                <div className="pt-6 space-y-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-white text-brand-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Complete Payment
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Extra Notes */}
                        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                Private Notes
                            </h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add internal notes about this payment..."
                                className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentOut;
