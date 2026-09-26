import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import {
    Receipt, Search, Plus, Trash2,
    Calendar, User, CreditCard, Banknote, Smartphone, Building2,
    CheckCircle, Save, RefreshCw
} from 'lucide-react';
import { RootState } from "../../../redux/store";

// Types
interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    outstandingBalance: number;
    advanceBalance: number;
}

interface Invoice {
    id: string;
    invoiceNo: string;
    date: string;
    totalAmount: number;
    balanceDue: number;
    allocatedAmount: number;
}

interface PaymentMethod {
    id: string;
    method: 'CASH' | 'UPI' | 'CARD' | 'BANK' | 'CHEQUE';
    amount: number;
    reference: string;
}

/** Method keys → the values POST /api/payment-in accepts. */
const API_METHOD: Record<PaymentMethod['method'], string> = { CASH: 'cash', UPI: 'upi', CARD: 'card', BANK: 'bank_transfer', CHEQUE: 'cheque' };
const errorText = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const methodConfig = {
    CASH: { label: 'Cash', icon: Banknote, color: 'text-success' },
    UPI: { label: 'UPI', icon: Smartphone, color: 'text-purple-600' },
    CARD: { label: 'Card', icon: CreditCard, color: 'text-info' },
    BANK: { label: 'Bank Transfer', icon: Building2, color: 'text-primary' },
    CHEQUE: { label: 'Cheque', icon: Receipt, color: 'text-warning' },
};

/**
 * Sales › Receipts › New: records a customer payment through POST /api/payment-in, against the customer's real
 * unpaid invoices. It used to offer three made-up invoices, fake deposit accounts ("HDFC Bank - 1234"), and a
 * Save button that did nothing.
 */
const PaymentInCreator: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
    const [banks, setBanks] = useState<{ id: string; name: string }[]>([]);
    const [depositAccount, setDepositAccount] = useState('cash');
    const [loadError, setLoadError] = useState('');
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        Promise.all([api.get('/api/customers'), api.get('/api/cashbank/accounts')])
            .then(([cus, acc]) => {
                if (cancelled) return;
                const list = Array.isArray(cus.data) ? cus.data : Array.isArray(cus.data?.data) ? cus.data.data : [];
                setAvailableCustomers(list.map((c: Record<string, unknown>) => {
                    const dues = Number(c.dues) || 0;
                    return { id: String(c._id ?? c.id), name: String(c.name ?? ''), phone: String(c.phone ?? ''), email: c.email ? String(c.email) : undefined,
                        outstandingBalance: Math.max(0, dues), advanceBalance: Math.max(0, -dues) };
                }));
                const accList = Array.isArray(acc.data) ? acc.data : Array.isArray(acc.data?.data) ? acc.data.data : [];
                setBanks(accList.filter((a: Record<string, unknown>) => a.accountType !== 'Cash' && a.status !== 'inactive')
                    .map((a: Record<string, unknown>) => ({ id: String(a._id ?? a.id), name: String(a.bankName ?? 'Bank account') })));
            })
            .catch(err => { if (!cancelled) setLoadError(errorText(err, 'Could not load customers and bank accounts. Refresh to try again.')); });
        return () => { cancelled = true; };
    }, []);

    // State
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        { id: 'PM1', method: 'CASH', amount: 0, reference: '' }
    ]);

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isCustomerLocked, setIsCustomerLocked] = useState(false);

    // Filtered customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return availableCustomers;
        const q = customerSearch.toLowerCase();
        return availableCustomers.filter(c =>
            c.name.toLowerCase().includes(q) || c.phone.includes(q)
        );
    }, [customerSearch, availableCustomers]);

    // Select customer
    const selectCustomer = (c: Customer) => {
        setCustomer(c);
        setInvoices([]);
        setShowCustomerDropdown(false);
        setCustomerSearch('');
        setInvoicesLoading(true);
        api.get(`/api/payment-in/customer/${c.id}/invoices`)
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                setInvoices(list.map((inv: Record<string, unknown>) => ({
                    id: String(inv._id), invoiceNo: String(inv.invoiceNo ?? ''), date: String(inv.date ?? '').slice(0, 10),
                    totalAmount: Number(inv.total) || 0, balanceDue: Math.max(0, Number(inv.balance) || 0), allocatedAmount: 0,
                })).filter((inv: Invoice) => inv.balanceDue > 0));
            })
            .catch(err => toast.error(errorText(err, 'Could not load this customer\'s invoices.')))
            .finally(() => setInvoicesLoading(false));
    };

    // Payment methods
    const addPaymentMethod = () => {
        setPaymentMethods([...paymentMethods, {
            id: `PM${Date.now()}`,
            method: 'CASH',
            amount: 0,
            reference: ''
        }]);
        setIsCustomerLocked(true);
    };

    const updatePaymentMethod = (id: string, field: keyof PaymentMethod, value: string | number) => {
        setPaymentMethods(methods => methods.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
        if (field === 'amount' && (typeof value === 'number' ? value : parseFloat(value as string)) > 0) {
            setIsCustomerLocked(true);
        }
    };

    const removePaymentMethod = (id: string) => {
        if (paymentMethods.length > 1) {
            setPaymentMethods(methods => methods.filter(m => m.id !== id));
        }
    };

    // Invoice allocation
    const updateAllocation = (invoiceId: string, amount: number) => {
        setInvoices(invs => invs.map(inv =>
            inv.id === invoiceId
                ? { ...inv, allocatedAmount: Math.min(amount, inv.balanceDue) }
                : inv
        ));
    };

    const autoAllocate = () => {
        let remaining = totalPayment;
        setInvoices(invs => invs.map(inv => {
            if (remaining <= 0) return { ...inv, allocatedAmount: 0 };
            const allocate = Math.min(remaining, inv.balanceDue);
            remaining -= allocate;
            return { ...inv, allocatedAmount: allocate };
        }));
    };

    // Calculations
    const totalPayment = paymentMethods.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalAllocated = invoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0);

    const advanceCreated = Math.max(0, totalPayment - totalAllocated);
    const remainingUnallocated = Math.max(0, totalPayment - totalAllocated);

    // Format currency
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    // Clear all
    const handleClear = () => {
        setCustomer(null);
        setInvoices([]);
        setPaymentMethods([{ id: 'PM1', method: 'CASH', amount: 0, reference: '' }]);
        setIsCustomerLocked(false);
    };

    const handleSave = async () => {
        if (!customer) return toast.warning('Select a customer');
        const lines = paymentMethods.filter(m => m.amount > 0);
        if (!lines.length) return toast.warning('Enter the amount received');
        if (totalAllocated > totalPayment + 0.005) return toast.warning('More is allocated to invoices than was received');
        const refs = lines.filter(m => m.reference.trim()).map(m => `${methodConfig[m.method].label} ref: ${m.reference.trim()}`);
        setSaving(true);
        try {
            await api.post('/api/payment-in', {
                customerId: customer.id,
                paymentMethods: lines.map(m => ({ method: API_METHOD[m.method], amount: m.amount, bankAccount: m.method !== 'CASH' && depositAccount !== 'cash' ? depositAccount : undefined })),
                allocatedInvoices: invoices.filter(i => i.allocatedAmount > 0).map(i => ({ invoice: i.id, allocatedAmount: i.allocatedAmount })),
                depositAccount,
                notes: refs.join('; '),
            });
            toast.success('Receipt saved');
            navigate('/sales/payments');
        } catch (err) {
            toast.error(errorText(err, 'Could not save the receipt'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col glass-panel dark:bg-neutral-900">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-success" />
                            <span className="font-bold text-lg">Receipt</span>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-success-soft text-success dark:bg-success-soft dark:text-success">
                            New Receipt
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary opacity-50" />
                            <input
                                type="date"
                                value={receiptDate}
                                onChange={e => setReceiptDate(e.target.value)}
                                className="input text-sm w-36"
                            />
                        </div>
                        <div className="text-secondary opacity-70">
                            <span className="font-medium">By:</span> {user?.name || 'Admin'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {loadError && (
                    <div role="alert" className="mb-4 rounded-md border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger dark:border-danger/50 dark:bg-danger-soft dark:text-danger">{loadError}</div>
                )}
                <div className="grid lg:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                        {/* Customer Section */}
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <User className="w-4 h-4" /> Customer
                                </h3>
                                {customer && !isCustomerLocked && (
                                    <button onClick={() => setCustomer(null)} className="text-xs text-danger hover:underline">
                                        Change
                                    </button>
                                )}
                            </div>

                            {customer ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-lg">{customer.name}</p>
                                            <p className="text-sm text-secondary opacity-70">{customer.phone}</p>
                                        </div>
                                        {isCustomerLocked && (
                                            <span className="text-xs text-warning bg-warning-soft dark:bg-warning-soft px-2 py-1 rounded">
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-danger/10 dark:bg-danger-soft rounded-lg">
                                            <p className="text-xs text-danger dark:text-danger font-medium">Outstanding</p>
                                            <p className="text-lg font-bold text-danger dark:text-danger">
                                                {formatCurrency(customer.outstandingBalance)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-success-soft dark:bg-success-soft rounded-lg">
                                            <p className="text-xs text-success dark:text-success font-medium">Advance</p>
                                            <p className="text-lg font-bold text-success dark:text-success">
                                                {formatCurrency(customer.advanceBalance)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary opacity-50" />
                                    <input
                                        type="text"
                                        placeholder="Search customer by name or phone..."
                                        value={customerSearch}
                                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        className="input pl-10"
                                    />
                                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 glass-panel border border-default/30 rounded-lg shadow-xl mt-1 max-h-48 overflow-auto z-20">
                                            {filteredCustomers.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => selectCustomer(c)}
                                                    className="w-full text-left px-4 py-3 hover:bg-surface/60 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">{c.name}</span>
                                                        <span className="text-xs text-danger">Due: {formatCurrency(c.outstandingBalance)}</span>
                                                    </div>
                                                    <span className="text-xs text-secondary opacity-70">{c.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Payment Methods
                                </h3>
                                <button onClick={addPaymentMethod} className="btn btn-sm btn-secondary">
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                            </div>

                            <div className="space-y-3">
                                {paymentMethods.map((pm, __idx) => {
                                    const config = methodConfig[pm.method];
                                    const Icon = config.icon;
                                    return (
                                        <div key={pm.id} className="grid grid-cols-12 gap-2 items-center p-3 glass-panel rounded-lg border border-default/30">
                                            <div className="col-span-3">
                                                <select
                                                    value={pm.method}
                                                    onChange={e => updatePaymentMethod(pm.id, 'method', e.target.value)}
                                                    className="select text-sm"
                                                >
                                                    {Object.entries(methodConfig).map(([key, val]) => (
                                                        <option key={key} value={key}>{val.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={pm.amount || ''}
                                                    onChange={e => updatePaymentMethod(pm.id, 'amount', parseFloat(e.target.value) || 0)}
                                                    className="input text-right"
                                                />
                                            </div>
                                            <div className="col-span-5">
                                                <input
                                                    type="text"
                                                    placeholder="Reference (UTR, cheque no.)"
                                                    value={pm.reference}
                                                    onChange={e => updatePaymentMethod(pm.id, 'reference', e.target.value)}
                                                    className="input text-sm"
                                                />
                                            </div>
                                            <div className="col-span-1 text-center">
                                                {paymentMethods.length > 1 && (
                                                    <button onClick={() => removePaymentMethod(pm.id)} className="text-danger hover:text-danger">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <label className="mt-3 flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium">Deposit to</span>
                                <select value={depositAccount} onChange={e => setDepositAccount(e.target.value)} className="select text-sm w-56">
                                    <option value="cash">Cash</option>
                                    {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </label>

                            <div className="mt-4 p-3 bg-success-soft dark:bg-success-soft rounded-lg flex justify-between items-center">
                                <span className="font-bold text-success dark:text-success">Total Payment</span>
                                <span className="text-xl font-bold text-success dark:text-success">
                                    {formatCurrency(totalPayment)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Invoice Allocation */}
                    <div className="space-y-4">
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 h-full">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <Receipt className="w-4 h-4" /> Invoice Allocation
                                </h3>
                                {customer && invoices.length > 0 && (
                                    <button onClick={autoAllocate} className="btn btn-sm btn-secondary">
                                        Auto-Allocate
                                    </button>
                                )}
                            </div>

                            {!customer ? (
                                <div className="text-center py-12 text-secondary opacity-50">
                                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Select a customer to see open invoices</p>
                                </div>
                            ) : invoicesLoading ? (
                                <div className="text-center py-12 text-secondary opacity-50"><p>Loading invoices…</p></div>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-12 text-secondary opacity-50">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-success" />
                                    <p>No outstanding invoices</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {invoices.map(inv => (
                                        <div key={inv.id} className="p-3 glass-panel rounded-lg border border-default/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <span className="font-medium text-brand-600">{inv.invoiceNo}</span>
                                                    <span className="text-xs text-secondary opacity-70 ml-2">{inv.date}</span>
                                                </div>
                                                <span className="text-sm font-medium">{formatCurrency(inv.totalAmount)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs text-secondary opacity-70 mb-1">
                                                        <span>Balance Due</span>
                                                        <span className="text-danger font-medium">{formatCurrency(inv.balanceDue)}</span>
                                                    </div>
                                                </div>
                                                <div className="w-32">
                                                    <input
                                                        type="number"
                                                        placeholder="Allocate"
                                                        value={inv.allocatedAmount || ''}
                                                        onChange={e => updateAllocation(inv.id, parseFloat(e.target.value) || 0)}
                                                        max={inv.balanceDue}
                                                        className="input text-right text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Summary */}
                            {customer && (
                                <div className="mt-4 p-4 glass-panel rounded-lg border border-default/30 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary opacity-70">Total Payment</span>
                                        <span className="font-medium">{formatCurrency(totalPayment)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary opacity-70">Allocated to Invoices</span>
                                        <span className="font-medium text-success">{formatCurrency(totalAllocated)}</span>
                                    </div>
                                    {advanceCreated > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-info">Advance Created</span>
                                            <span className="font-medium text-info">{formatCurrency(advanceCreated)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-default/30 pt-2">
                                        <div className="flex justify-between font-bold">
                                            <span>Remaining</span>
                                            <span className={remainingUnallocated > 0 ? 'text-warning' : 'text-success'}>
                                                {formatCurrency(remainingUnallocated)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-3 justify-between">
                <div className="flex gap-2">
                    <button onClick={handleClear} className="btn btn-ghost text-danger">
                        <RefreshCw className="w-4 h-4" /> Clear
                    </button>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-primary" disabled={totalPayment === 0 || !customer || saving} onClick={handleSave}>
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentInCreator;
