import { useAuthStore } from '@repo/shared';
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import {
    Search,
    Book,
    User,
    Calendar,
    TrendingUp,
    TrendingDown,
    Download,
    Filter,
    ChevronDown,
    ChevronUp,
    Receipt,
    CreditCard,
    RotateCcw
} from 'lucide-react';

interface LedgerEntry {
    id: string;
    date: string;
    type: 'SALE' | 'PAYMENT' | 'RETURN' | 'CREDIT_NOTE';
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface CustomerLedger {
    customerId: string;
    customerName: string;
    phone?: string;
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    entries: LedgerEntry[];
}

const CustomerLedgerPage: React.FC = () => {
    const { customers } = useSelector((state: RootState) => state.customers);
    const { invoices: salesHistory } = useSelector((state: RootState) => state.pos);
    const {  currentSector  } = useAuthStore();

    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

    // Build ledger for each customer
    const customerLedgers: CustomerLedger[] = useMemo(() => {
        return customers.map(customer => {
            const entries: LedgerEntry[] = [];
            let runningBalance = 0;
            let totalDebit = 0;
            let totalCredit = 0;

            // Get sales for this customer
            const customerSales = salesHistory
                .filter(s => {
                    const cid = typeof s.customer === 'string' ? s.customer : s.customer?._id || s.customer?.id;
                    return cid === customer.id && s.sector === currentSector;
                })
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            customerSales.forEach(sale => {
                const saleId = sale._id || sale.id;
                // Sale entry (debit - customer owes us)
                runningBalance += sale.totalAmount;
                totalDebit += sale.totalAmount;
                entries.push({
                    id: `sale-${saleId}`,
                    date: sale.createdAt,
                    type: 'SALE',
                    reference: `INV-${saleId.substring(0, 8)}`,
                    description: `Invoice for ${sale.items.length} items`,
                    debit: sale.totalAmount,
                    credit: 0,
                    balance: runningBalance
                });

                // Payment entry (credit - customer paid)
                const paidAmount = sale.paidAmount ?? sale.totalAmount;
                if (paidAmount > 0) {
                    runningBalance -= paidAmount;
                    totalCredit += paidAmount;
                    entries.push({
                        id: `pay-${saleId}`,
                        date: sale.createdAt,
                        type: 'PAYMENT',
                        reference: `REC-${saleId.substring(0, 6)}`,
                        description: `Payment received`,
                        debit: 0,
                        credit: paidAmount,
                        balance: runningBalance
                    });
                }
            });

            return {
                customerId: customer.id,
                customerName: customer.name,
                phone: customer.phone,
                openingBalance: 0,
                closingBalance: runningBalance,
                totalDebit,
                totalCredit,
                entries
            };
        });
    }, [customers, salesHistory, currentSector]);

    // Filter customers
    const filteredLedgers = useMemo(() => {
        return customerLedgers.filter(ledger => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!ledger.customerName.toLowerCase().includes(search) &&
                    !ledger.phone?.includes(searchTerm)) {
                    return false;
                }
            }
            // Only show customers with transactions
            if (ledger.entries.length === 0) return false;
            return true;
        });
    }, [customerLedgers, searchTerm]);

    // Selected customer's ledger
    const selectedLedger = selectedCustomerId
        ? customerLedgers.find(l => l.customerId === selectedCustomerId)
        : null;

    // Filter entries by date
    const filteredEntries = useMemo(() => {
        if (!selectedLedger) return [];
        return selectedLedger.entries.filter(entry => {
            if (dateFrom && new Date(entry.date) < new Date(dateFrom)) return false;
            if (dateTo) {
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                if (new Date(entry.date) >= nextDay) return false;
            }
            return true;
        });
    }, [selectedLedger, dateFrom, dateTo]);

    const toggleExpand = (customerId: string) => {
        const newExpanded = new Set(expandedCustomers);
        if (newExpanded.has(customerId)) {
            newExpanded.delete(customerId);
        } else {
            newExpanded.add(customerId);
        }
        setExpandedCustomers(newExpanded);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SALE': return <Receipt className="w-4 h-4 text-primary" />;
            case 'PAYMENT': return <CreditCard className="w-4 h-4 text-success" />;
            case 'RETURN': return <RotateCcw className="w-4 h-4 text-warning" />;
            default: return <Receipt className="w-4 h-4 text-neutral-400" />;
        }
    };

    // Summary stats
    const totalReceivable = filteredLedgers.reduce((acc, l) => acc + Math.max(0, l.closingBalance), 0);
    const totalAdvance = filteredLedgers.reduce((acc, l) => acc + Math.abs(Math.min(0, l.closingBalance)), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Book className="w-6 h-6 text-primary" />
                        Customer Ledger
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">View transaction history and balances for each customer</p>
                </div>
                <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Ledger
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Customers with Balance</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{filteredLedgers.length}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Total Receivable</p>
                            <p className="text-2xl font-bold text-error mt-1">₹{totalReceivable.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-error/10 rounded-xl">
                            <TrendingDown className="w-6 h-6 text-error" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Total Advance</p>
                            <p className="text-2xl font-bold text-success mt-1">₹{totalAdvance.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-success/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-success" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[250px]">
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Search Customer</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Name or phone..."
                            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    </div>
                </div>

                {selectedLedger && (
                    <>
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">From Date</label>
                            <input
                                type="date"
                                className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">To Date</label>
                            <input
                                type="date"
                                className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Customer List with Expandable Ledgers */}
            <div className="space-y-3">
                {filteredLedgers.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center text-neutral-500">
                        <Book className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                        <p>No customer ledgers found</p>
                    </div>
                ) : (
                    filteredLedgers.map(ledger => (
                        <div key={ledger.customerId} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            {/* Customer Header */}
                            <div
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                onClick={() => toggleExpand(ledger.customerId)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                        <span className="text-white font-bold">{ledger.customerName.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900 dark:text-white">{ledger.customerName}</p>
                                        <p className="text-xs text-neutral-500">{ledger.phone || 'No phone'} • {ledger.entries.length} transactions</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-neutral-500">Balance</p>
                                        <p className={`font-bold ${ledger.closingBalance > 0 ? 'text-error' : ledger.closingBalance < 0 ? 'text-success' : 'text-neutral-500'}`}>
                                            {ledger.closingBalance > 0 ? '₹' : ledger.closingBalance < 0 ? '-₹' : '₹'}
                                            {Math.abs(ledger.closingBalance).toLocaleString()}
                                        </p>
                                    </div>
                                    {expandedCustomers.has(ledger.customerId) ? (
                                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Ledger Entries */}
                            {expandedCustomers.has(ledger.customerId) && (
                                <div className="border-t border-neutral-100 dark:border-neutral-700">
                                    <table className="w-full text-sm">
                                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 text-xs uppercase">
                                            <tr>
                                                <th className="p-3 text-left">Date</th>
                                                <th className="p-3 text-left">Type</th>
                                                <th className="p-3 text-left">Reference</th>
                                                <th className="p-3 text-left">Description</th>
                                                <th className="p-3 text-right">Debit</th>
                                                <th className="p-3 text-right">Credit</th>
                                                <th className="p-3 text-right">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                            {ledger.entries.map(entry => (
                                                <tr key={entry.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                                                    <td className="p-3 text-neutral-600 dark:text-neutral-400">
                                                        {new Date(entry.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            {getTypeIcon(entry.type)}
                                                            <span className="text-neutral-700 dark:text-neutral-300">{entry.type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-mono text-xs text-primary">{entry.reference}</td>
                                                    <td className="p-3 text-neutral-500">{entry.description}</td>
                                                    <td className="p-3 text-right font-medium text-error">
                                                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="p-3 text-right font-medium text-success">
                                                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-neutral-900 dark:text-white">
                                                        ₹{entry.balance.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-neutral-50 dark:bg-neutral-900 font-bold">
                                            <tr>
                                                <td colSpan={4} className="p-3 text-right text-neutral-600 dark:text-neutral-400">Totals:</td>
                                                <td className="p-3 text-right text-error">₹{ledger.totalDebit.toLocaleString()}</td>
                                                <td className="p-3 text-right text-success">₹{ledger.totalCredit.toLocaleString()}</td>
                                                <td className="p-3 text-right text-neutral-900 dark:text-white">₹{ledger.closingBalance.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CustomerLedgerPage;
