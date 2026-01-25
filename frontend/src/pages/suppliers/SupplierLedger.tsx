import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import {
    Search,
    Book,
    Truck,
    TrendingUp,
    TrendingDown,
    Download,
    ChevronDown,
    ChevronUp,
    Receipt,
    CreditCard,
    RotateCcw,
    FileText
} from 'lucide-react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SupplierSubNav from './SupplierSubNav';

interface LedgerEntry {
    id: string;
    date: string;
    type: 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'DEBIT_NOTE';
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface SupplierLedgerData {
    vendorId: string;
    vendorName: string;
    phone?: string;
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    entries: LedgerEntry[];
}

const SupplierLedger: React.FC = () => {
    const { orders } = useSelector((state: RootState) => (state as any).purchase || { orders: [] });
    const { vendors } = useSelector((state: RootState) => (state as any).vendor || { vendors: [] });
    const { currentSector } = useSelector((state: RootState) => (state as any).auth || {});

    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

    // Build ledger for each vendor
    const vendorLedgers: SupplierLedgerData[] = useMemo(() => {
        return (vendors || []).map(vendor => {
            const entries: LedgerEntry[] = [];
            let runningBalance = 0;
            let totalDebit = 0;
            let totalCredit = 0;

            // Get purchases for this vendor
            const vendorOrders = (orders || [])
                .filter(o => o.vendorId === (vendor as any).id && o.sector === currentSector && o.status === 'APPROVED')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            vendorOrders.forEach((order, idx) => {
                // Purchase entry (credit - we owe them)
                runningBalance += order.total;
                totalCredit += order.total;
                entries.push({
                    id: `purchase-${order.id}`,
                    date: order.date,
                    type: 'PURCHASE',
                    reference: `PO-${order.id.substring(0, 8)}`,
                    description: `Purchase Order - ${order.items.length} items`,
                    debit: 0,
                    credit: order.total,
                    balance: runningBalance
                });

                // Payment entry (debit - we paid them) - simulate some payments
                if (idx % 2 === 0) {
                    const paymentAmount = order.total;
                    runningBalance -= paymentAmount;
                    totalDebit += paymentAmount;
                    entries.push({
                        id: `pay-${order.id}`,
                        date: order.date,
                        type: 'PAYMENT',
                        reference: `PAY-${order.id.substring(0, 6)}`,
                        description: `Payment made`,
                        debit: paymentAmount,
                        credit: 0,
                        balance: runningBalance
                    });
                }
            });

            return {
                vendorId: vendor.id,
                vendorName: vendor.name,
                phone: (vendor as any).phone,
                openingBalance: 0,
                closingBalance: runningBalance,
                totalDebit,
                totalCredit,
                entries
            };
        });
    }, [vendors, orders, currentSector]);

    // Filter vendors
    const filteredLedgers = useMemo(() => {
        return vendorLedgers.filter(ledger => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!ledger.vendorName.toLowerCase().includes(search) &&
                    !ledger.phone?.includes(searchTerm)) {
                    return false;
                }
            }
            if (ledger.entries.length === 0) return false;
            return true;
        });
    }, [vendorLedgers, searchTerm]);

    const toggleExpand = (vendorId: string) => {
        const newExpanded = new Set(expandedVendors);
        if (newExpanded.has(vendorId)) {
            newExpanded.delete(vendorId);
        } else {
            newExpanded.add(vendorId);
        }
        setExpandedVendors(newExpanded);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PURCHASE': return <Receipt className="w-4 h-4 text-primary" />;
            case 'PAYMENT': return <CreditCard className="w-4 h-4 text-success" />;
            case 'RETURN': return <RotateCcw className="w-4 h-4 text-warning" />;
            case 'DEBIT_NOTE': return <FileText className="w-4 h-4 text-error" />;
            default: return <Receipt className="w-4 h-4 text-neutral-400" />;
        }
    };

    // Summary stats
    const totalPayable = filteredLedgers.reduce((acc, l) => acc + Math.max(0, l.closingBalance), 0);
    const totalAdvance = filteredLedgers.reduce((acc, l) => acc + Math.abs(Math.min(0, l.closingBalance)), 0);

    return (
        <Layout>
            <PageHeader
                title="Supplier Ledger"
                description="View transaction history and balances for each supplier"
                breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Suppliers', link: '/suppliers' }, { label: 'Ledger' }]}
                actions={
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Ledger
                    </button>
                }
            />

            <SupplierSubNav />

            <div className="space-y-6 animate-fade-in">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase">Suppliers with Balance</p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{filteredLedgers.length}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <Truck className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase">Total Payable</p>
                                <p className="text-2xl font-bold text-error mt-1">₹{totalPayable.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-error/10 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-error" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase">Advance Paid</p>
                                <p className="text-2xl font-bold text-success mt-1">₹{totalAdvance.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-success/10 rounded-xl">
                                <TrendingDown className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[250px]">
                        <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Search Supplier</label>
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
                </div>

                {/* Vendor List with Expandable Ledgers */}
                <div className="space-y-3">
                    {filteredLedgers.length === 0 ? (
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center text-neutral-500">
                            <Book className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                            <p>No supplier ledgers found</p>
                        </div>
                    ) : (
                        filteredLedgers.map(ledger => (
                            <div key={ledger.vendorId} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                {/* Vendor Header */}
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                    onClick={() => toggleExpand(ledger.vendorId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                            <Truck className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-900 dark:text-white">{ledger.vendorName}</p>
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
                                        {expandedVendors.has(ledger.vendorId) ? (
                                            <ChevronUp className="w-5 h-5 text-neutral-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-neutral-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Ledger Entries */}
                                {expandedVendors.has(ledger.vendorId) && (
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
                                                        <td className="p-3 text-right font-medium text-success">
                                                            {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                                                        </td>
                                                        <td className="p-3 text-right font-medium text-error">
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
                                                    <td className="p-3 text-right text-success">₹{ledger.totalDebit.toLocaleString()}</td>
                                                    <td className="p-3 text-right text-error">₹{ledger.totalCredit.toLocaleString()}</td>
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
        </Layout>
    );
};

export default SupplierLedger;
