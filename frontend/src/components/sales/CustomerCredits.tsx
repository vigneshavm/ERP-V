import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Search,
    CreditCard,
    DollarSign,
    TrendingUp,
    TrendingDown,
    User,
    Calendar,
    FileText,
    Filter,
    Download,
    Plus
} from 'lucide-react';

interface CustomerCredit {
    customerId: string;
    customerName: string;
    phone?: string;
    creditBalance: number;
    advanceBalance: number;
    lastTransactionDate: string;
    totalPurchases: number;
}

const CustomerCredits: React.FC = () => {
    const { customers } = useSelector((state: RootState) => state.pos);
    const { salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'credit' | 'advance'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'credit' | 'advance'>('credit');

    // Calculate customer credits from sales history
    const customerCredits: CustomerCredit[] = useMemo(() => {
        const creditMap = new Map<string, CustomerCredit>();

        // Initialize with all customers
        customers.forEach(customer => {
            creditMap.set(customer.id, {
                customerId: customer.id,
                customerName: customer.name,
                phone: customer.phone,
                creditBalance: 0,
                advanceBalance: 0,
                lastTransactionDate: '',
                totalPurchases: 0
            });
        });

        // Calculate from sales
        salesHistory
            .filter(sale => sale.sector === currentSector)
            .forEach(sale => {
                if (sale.customerId && creditMap.has(sale.customerId)) {
                    const credit = creditMap.get(sale.customerId)!;
                    credit.totalPurchases += sale.total;

                    // Track last transaction date
                    if (!credit.lastTransactionDate || sale.date > credit.lastTransactionDate) {
                        credit.lastTransactionDate = sale.date;
                    }

                    // Credit given (sale total minus payment)
                    const amountPaid = (sale as any).amountPaid ?? sale.total;
                    if (amountPaid < sale.total) {
                        credit.creditBalance += (sale.total - amountPaid);
                    } else if (amountPaid > sale.total) {
                        credit.advanceBalance += (amountPaid - sale.total);
                    }
                }
            });

        return Array.from(creditMap.values());
    }, [customers, salesHistory, currentSector]);

    // Filter and sort
    const filteredCredits = useMemo(() => {
        let result = customerCredits.filter(c => {
            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!c.customerName.toLowerCase().includes(search) &&
                    !c.phone?.includes(searchTerm)) {
                    return false;
                }
            }

            // Type filter
            if (filterType === 'credit' && c.creditBalance <= 0) return false;
            if (filterType === 'advance' && c.advanceBalance <= 0) return false;

            return true;
        });

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.customerName.localeCompare(b.customerName);
                case 'credit': return b.creditBalance - a.creditBalance;
                case 'advance': return b.advanceBalance - a.advanceBalance;
                default: return 0;
            }
        });

        return result;
    }, [customerCredits, searchTerm, filterType, sortBy]);

    // Summary stats
    const totalCredit = filteredCredits.reduce((acc, c) => acc + c.creditBalance, 0);
    const totalAdvance = filteredCredits.reduce((acc, c) => acc + c.advanceBalance, 0);
    const customersWithCredit = filteredCredits.filter(c => c.creditBalance > 0).length;
    const customersWithAdvance = filteredCredits.filter(c => c.advanceBalance > 0).length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-primary" />
                        Customer Credits
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">Manage credit balances and advance payments</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Receive Payment
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Receivable</p>
                            <p className="text-2xl font-bold text-error mt-1">₹{totalCredit.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-error/10 rounded-xl">
                            <TrendingDown className="w-6 h-6 text-error" />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{customersWithCredit} customers owe money</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Advance</p>
                            <p className="text-2xl font-bold text-success mt-1">₹{totalAdvance.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-success/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-success" />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{customersWithAdvance} customers with advance</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Net Position</p>
                            <p className={`text-2xl font-bold mt-1 ${totalCredit > totalAdvance ? 'text-error' : 'text-success'}`}>
                                ₹{Math.abs(totalCredit - totalAdvance).toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <DollarSign className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{totalCredit > totalAdvance ? 'To receive' : 'To pay back'}</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Customers</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{customers.length}</p>
                        </div>
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                            <User className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">Active in current sector</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
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

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Filter</label>
                    <select
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as any)}
                    >
                        <option value="all">All Customers</option>
                        <option value="credit">With Credit Due</option>
                        <option value="advance">With Advance</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Sort By</label>
                    <select
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                    >
                        <option value="credit">Credit Amount (High to Low)</option>
                        <option value="advance">Advance Amount (High to Low)</option>
                        <option value="name">Customer Name (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* Customer List */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-xs font-medium">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4 text-right">Total Purchases</th>
                                <th className="p-4 text-right">Credit Due</th>
                                <th className="p-4 text-right">Advance</th>
                                <th className="p-4">Last Transaction</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {filteredCredits.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-neutral-500">No customers found</td></tr>
                            ) : (
                                filteredCredits.map(credit => (
                                    <tr key={credit.customerId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-primary font-bold text-sm">
                                                        {credit.customerName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-neutral-900 dark:text-white">
                                                    {credit.customerName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-neutral-500">{credit.phone || '-'}</td>
                                        <td className="p-4 text-right font-medium text-neutral-700 dark:text-neutral-300">
                                            ₹{credit.totalPurchases.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            {credit.creditBalance > 0 ? (
                                                <span className="font-bold text-error">₹{credit.creditBalance.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-neutral-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {credit.advanceBalance > 0 ? (
                                                <span className="font-bold text-success">₹{credit.advanceBalance.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-neutral-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-neutral-500 text-sm">
                                            {credit.lastTransactionDate ?
                                                new Date(credit.lastTransactionDate).toLocaleDateString() :
                                                '-'
                                            }
                                        </td>
                                        <td className="p-4 text-center">
                                            <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20">
                                                Collect
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                    {filteredCredits.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">No customers found</div>
                    ) : (
                        filteredCredits.map(credit => (
                            <div key={credit.customerId} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-primary font-bold">
                                                {credit.customerName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-900 dark:text-white">{credit.customerName}</p>
                                            <p className="text-xs text-neutral-500">{credit.phone || 'No phone'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg">
                                    <div className="text-center">
                                        <p className="text-[10px] text-neutral-500 uppercase">Credit</p>
                                        <p className={`font-bold ${credit.creditBalance > 0 ? 'text-error' : 'text-neutral-400'}`}>
                                            ₹{credit.creditBalance.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-neutral-500 uppercase">Advance</p>
                                        <p className={`font-bold ${credit.advanceBalance > 0 ? 'text-success' : 'text-neutral-400'}`}>
                                            ₹{credit.advanceBalance.toLocaleString()}
                                        </p>
                                    </div>
                                    <button className="px-4 py-1 bg-primary text-white text-xs font-bold rounded-lg">
                                        Collect
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerCredits;
