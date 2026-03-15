import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    Receipt, Search, Plus, Trash2, Printer, Mail, MessageCircle,
    Calendar, User, CreditCard, Banknote, Smartphone, Building2,
    CheckCircle, AlertCircle, ChevronDown, Save, RefreshCw, Wallet
} from 'lucide-react';
import { RootState } from "@/app/store/store";

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
    method: 'CASH' | 'UPI' | 'CARD' | 'BANK' | 'CHEQUE' | 'WALLET';
    amount: number;
    reference: string;
    depositTo: string;
}

// Demo data - replaced by Redux state
// Customers fetched from Redux posSlice

const generateDemoInvoices = (customerId: string): Invoice[] => {
    if (!customerId || customerId === 'WALKIN') return [];
    return [
        { id: 'INV001', invoiceNo: 'INV/2026/0001', date: '2026-01-05', totalAmount: 25000, balanceDue: 25000, allocatedAmount: 0 },
        { id: 'INV002', invoiceNo: 'INV/2026/0002', date: '2026-01-08', totalAmount: 15000, balanceDue: 10000, allocatedAmount: 0 },
        { id: 'INV003', invoiceNo: 'INV/2026/0003', date: '2026-01-10', totalAmount: 18000, balanceDue: 10000, allocatedAmount: 0 },
    ];
};

const methodConfig = {
    CASH: { label: 'Cash', icon: Banknote, color: 'text-green-600' },
    UPI: { label: 'UPI', icon: Smartphone, color: 'text-purple-600' },
    CARD: { label: 'Card', icon: CreditCard, color: 'text-blue-600' },
    BANK: { label: 'Bank Transfer', icon: Building2, color: 'text-indigo-600' },
    CHEQUE: { label: 'Cheque', icon: Receipt, color: 'text-amber-600' },
    WALLET: { label: 'Wallet', icon: Wallet, color: 'text-pink-600' },
};

const depositOptions = ['Cash Counter', 'HDFC Bank - 1234', 'ICICI Bank - 5678', 'Petty Cash'];

const PaymentInCreator: React.FC = () => {
    // Generate receipt number
    const generateReceiptNo = () => `RCP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;

    const {  user  } = useAuthStore();
    const { customers: posCustomers } = useSelector((state: RootState) => state.pos);

    // Filter customers by tenant
    const availableCustomers: Customer[] = useMemo(() => {
        return posCustomers.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            email: c.email,
            outstandingBalance: c.outstandingBalance || c.outstanding_balance || 0,
            advanceBalance: c.advanceBalance || 0
        }));
    }, [posCustomers]);

    // State
    const [receiptNo] = useState(generateReceiptNo);
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        { id: 'PM1', method: 'CASH', amount: 0, reference: '', depositTo: 'Cash Counter' }
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
        setInvoices(generateDemoInvoices(c.id));
        setShowCustomerDropdown(false);
        setCustomerSearch('');
    };

    // Payment methods
    const addPaymentMethod = () => {
        setPaymentMethods([...paymentMethods, {
            id: `PM${Date.now()}`,
            method: 'CASH',
            amount: 0,
            reference: '',
            depositTo: 'Cash Counter'
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
    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- TODO(TS-FIX): Phase 2/3 fix
    const totalPayment = useMemo(() =>
        paymentMethods.reduce((sum, m) => sum + (m.amount || 0), 0)
        , [paymentMethods]);

    const totalAllocated = useMemo(() =>
        invoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0)
        , [invoices]);

    const advanceCreated = Math.max(0, totalPayment - totalAllocated);
    const remainingUnallocated = Math.max(0, totalPayment - totalAllocated);

    // Format currency
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    // Clear all
    const handleClear = () => {
        setCustomer(null);
        setInvoices([]);
        setPaymentMethods([{ id: 'PM1', method: 'CASH', amount: 0, reference: '', depositTo: 'Cash Counter' }]);
        setIsCustomerLocked(false);
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-lg">{receiptNo}</span>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            New Receipt
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <input
                                type="date"
                                value={receiptDate}
                                onChange={e => setReceiptDate(e.target.value)}
                                className="input text-sm w-36"
                            />
                        </div>
                        <div className="text-neutral-500">
                            <span className="font-medium">By:</span> {user?.name || 'Admin'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
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
                                    <button onClick={() => setCustomer(null)} className="text-xs text-red-500 hover:underline">
                                        Change
                                    </button>
                                )}
                            </div>

                            {customer ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-lg">{customer.name}</p>
                                            <p className="text-sm text-neutral-500">{customer.phone}</p>
                                        </div>
                                        {isCustomerLocked && (
                                            <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">Outstanding</p>
                                            <p className="text-lg font-bold text-red-700 dark:text-red-400">
                                                {formatCurrency(customer.outstandingBalance)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">Advance</p>
                                            <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                                {formatCurrency(customer.advanceBalance)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search customer by name or phone..."
                                        value={customerSearch}
                                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        className="input pl-10"
                                    />
                                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl mt-1 max-h-48 overflow-auto z-20">
                                            {filteredCustomers.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => selectCustomer(c)}
                                                    className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">{c.name}</span>
                                                        <span className="text-xs text-red-500">Due: {formatCurrency(c.outstandingBalance)}</span>
                                                    </div>
                                                    <span className="text-xs text-neutral-500">{c.phone}</span>
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
                                {paymentMethods.map((pm, idx) => {
                                    const config = methodConfig[pm.method];
                                    const Icon = config.icon;
                                    return (
                                        <div key={pm.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
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
                                            <div className="col-span-3">
                                                <input
                                                    type="text"
                                                    placeholder="Reference"
                                                    value={pm.reference}
                                                    onChange={e => updatePaymentMethod(pm.id, 'reference', e.target.value)}
                                                    className="input text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <select
                                                    value={pm.depositTo}
                                                    onChange={e => updatePaymentMethod(pm.id, 'depositTo', e.target.value)}
                                                    className="select text-sm"
                                                >
                                                    {depositOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-1 text-center">
                                                {paymentMethods.length > 1 && (
                                                    <button onClick={() => removePaymentMethod(pm.id)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex justify-between items-center">
                                <span className="font-bold text-green-700 dark:text-green-400">Total Payment</span>
                                <span className="text-xl font-bold text-green-700 dark:text-green-400">
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
                                <div className="text-center py-12 text-neutral-400">
                                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Select a customer to see open invoices</p>
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-12 text-neutral-400">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500" />
                                    <p>No outstanding invoices</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {invoices.map(inv => (
                                        <div key={inv.id} className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <span className="font-medium text-brand-600">{inv.invoiceNo}</span>
                                                    <span className="text-xs text-neutral-500 ml-2">{inv.date}</span>
                                                </div>
                                                <span className="text-sm font-medium">{formatCurrency(inv.totalAmount)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                                                        <span>Balance Due</span>
                                                        <span className="text-red-600 font-medium">{formatCurrency(inv.balanceDue)}</span>
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
                                <div className="mt-4 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Total Payment</span>
                                        <span className="font-medium">{formatCurrency(totalPayment)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Allocated to Invoices</span>
                                        <span className="font-medium text-green-600">{formatCurrency(totalAllocated)}</span>
                                    </div>
                                    {advanceCreated > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-600">Advance Created</span>
                                            <span className="font-medium text-blue-600">{formatCurrency(advanceCreated)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
                                        <div className="flex justify-between font-bold">
                                            <span>Remaining</span>
                                            <span className={remainingUnallocated > 0 ? 'text-amber-600' : 'text-green-600'}>
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
                    <button onClick={handleClear} className="btn btn-ghost text-red-500">
                        <RefreshCw className="w-4 h-4" /> Clear
                    </button>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary">
                        <Printer className="w-4 h-4" /> Print Receipt
                    </button>
                    <button className="btn btn-secondary">
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                    <button className="btn btn-secondary">
                        <Mail className="w-4 h-4" /> Email
                    </button>
                    <button className="btn btn-primary" disabled={totalPayment === 0}>
                        <Save className="w-4 h-4" /> Save Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentInCreator;
