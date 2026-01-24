import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useBranchResolver } from '../../hooks/useBranchResolver';
import {
    Search,
    AlertTriangle,
    Clock,
    TrendingUp,
    Truck,
    Phone,
    Calendar,
    Download,
    Bell
} from 'lucide-react';

interface OutstandingPayable {
    vendorId: string;
    vendorName: string;
    phone?: string;
    invoiceId: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    paidAmount: number;
    dueAmount: number;
    daysOverdue: number;
    agingBucket: '0-30' | '31-60' | '61-90' | '90+';
}

const OutstandingPayables: React.FC = () => {
    const { orders } = useSelector((state: RootState) => state.purchase);
    const { vendors } = useSelector((state: RootState) => state.vendor);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { getBranchName } = useBranchResolver();

    const [searchTerm, setSearchTerm] = useState('');
    const [agingFilter, setAgingFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'amount' | 'days' | 'date'>('days');

    // Calculate outstanding payables from purchase orders
    const outstandingPayables: OutstandingPayable[] = useMemo(() => {
        const payables: OutstandingPayable[] = [];
        const today = new Date();

        orders
            .filter(o => o.sector === currentSector && o.status === 'APPROVED')
            .forEach((order, idx) => {
                // Simulate some orders having partial/no payment
                const paidRatio = idx % 3 === 0 ? 0 : idx % 3 === 1 ? 0.5 : 1;
                const paidAmount = order.total * paidRatio;
                const dueAmount = order.total - paidAmount;

                if (dueAmount > 0) {
                    const vendor = vendors.find(v => v.id === order.vendorId);
                    const invoiceDate = new Date(order.date);
                    const dueDate = new Date(invoiceDate);
                    dueDate.setDate(dueDate.getDate() + 30); // Default 30 day credit

                    const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

                    let agingBucket: OutstandingPayable['agingBucket'] = '0-30';
                    if (daysOverdue > 90) agingBucket = '90+';
                    else if (daysOverdue > 60) agingBucket = '61-90';
                    else if (daysOverdue > 30) agingBucket = '31-60';

                    payables.push({
                        vendorId: order.vendorId || '',
                        vendorName: order.vendor,
                        phone: vendor?.phone,
                        invoiceId: order.id,
                        invoiceDate: order.date,
                        dueDate: dueDate.toISOString(),
                        amount: order.total,
                        paidAmount,
                        dueAmount,
                        daysOverdue,
                        agingBucket
                    });
                }
            });

        return payables;
    }, [orders, vendors, currentSector]);

    // Filter and sort
    const filteredPayables = useMemo(() => {
        let result = outstandingPayables.filter(payable => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!payable.vendorName.toLowerCase().includes(search) &&
                    !payable.invoiceId.includes(searchTerm)) {
                    return false;
                }
            }
            if (agingFilter !== 'all' && payable.agingBucket !== agingFilter) return false;
            return true;
        });

        result.sort((a, b) => {
            switch (sortBy) {
                case 'amount': return b.dueAmount - a.dueAmount;
                case 'days': return b.daysOverdue - a.daysOverdue;
                case 'date': return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
                default: return 0;
            }
        });

        return result;
    }, [outstandingPayables, searchTerm, agingFilter, sortBy]);

    // Summary stats by aging bucket
    const agingSummary = useMemo(() => {
        const summary = {
            '0-30': { count: 0, amount: 0 },
            '31-60': { count: 0, amount: 0 },
            '61-90': { count: 0, amount: 0 },
            '90+': { count: 0, amount: 0 }
        };
        outstandingPayables.forEach(p => {
            summary[p.agingBucket].count++;
            summary[p.agingBucket].amount += p.dueAmount;
        });
        return summary;
    }, [outstandingPayables]);

    const totalDue = filteredPayables.reduce((acc, p) => acc + p.dueAmount, 0);
    const overdueCount = filteredPayables.filter(p => p.daysOverdue > 0).length;

    const getAgingColor = (bucket: string) => {
        switch (bucket) {
            case '0-30': return 'bg-success/10 text-success border-success/20';
            case '31-60': return 'bg-warning/10 text-warning border-warning/20';
            case '61-90': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
            case '90+': return 'bg-error/10 text-error border-error/20';
            default: return 'bg-neutral-100 text-neutral-600';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-error" />
                        Outstanding Payables
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">Track amounts owed to suppliers • {getBranchName(currentBranch)}</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Payment Reminders
                    </button>
                </div>
            </div>

            {/* Aging Buckets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => setAgingFilter(agingFilter === '0-30' ? 'all' : '0-30')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${agingFilter === '0-30' ? 'border-success ring-2 ring-success/20' : 'border-neutral-200 dark:border-neutral-700'} bg-white dark:bg-neutral-800`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-success uppercase">Current (0-30)</span>
                        <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-bold rounded-full">{agingSummary['0-30'].count}</span>
                    </div>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">₹{agingSummary['0-30'].amount.toLocaleString()}</p>
                </div>

                <div
                    onClick={() => setAgingFilter(agingFilter === '31-60' ? 'all' : '31-60')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${agingFilter === '31-60' ? 'border-warning ring-2 ring-warning/20' : 'border-neutral-200 dark:border-neutral-700'} bg-white dark:bg-neutral-800`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-warning uppercase">31-60 Days</span>
                        <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs font-bold rounded-full">{agingSummary['31-60'].count}</span>
                    </div>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">₹{agingSummary['31-60'].amount.toLocaleString()}</p>
                </div>

                <div
                    onClick={() => setAgingFilter(agingFilter === '61-90' ? 'all' : '61-90')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${agingFilter === '61-90' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-neutral-200 dark:border-neutral-700'} bg-white dark:bg-neutral-800`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-orange-500 uppercase">61-90 Days</span>
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full">{agingSummary['61-90'].count}</span>
                    </div>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">₹{agingSummary['61-90'].amount.toLocaleString()}</p>
                </div>

                <div
                    onClick={() => setAgingFilter(agingFilter === '90+' ? 'all' : '90+')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${agingFilter === '90+' ? 'border-error ring-2 ring-error/20' : 'border-neutral-200 dark:border-neutral-700'} bg-white dark:bg-neutral-800`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-error uppercase">90+ Days</span>
                        <span className="px-2 py-0.5 bg-error/10 text-error text-xs font-bold rounded-full">{agingSummary['90+'].count}</span>
                    </div>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">₹{agingSummary['90+'].amount.toLocaleString()}</p>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-gradient-to-r from-error/10 to-warning/10 p-4 rounded-xl border border-error/20 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-error/20 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-error" />
                    </div>
                    <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Payables</p>
                        <p className="text-2xl font-bold text-error">₹{totalDue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="text-center md:text-right">
                    <p className="text-sm text-neutral-500">{overdueCount} overdue bills from {filteredPayables.length} total</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Vendor or Invoice ID..."
                            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Sort By</label>
                    <select
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                    >
                        <option value="days">Days Overdue</option>
                        <option value="amount">Amount (High to Low)</option>
                        <option value="date">Invoice Date</option>
                    </select>
                </div>

                {agingFilter !== 'all' && (
                    <button
                        onClick={() => setAgingFilter('all')}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold"
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            {/* Payables Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-xs font-medium">
                            <tr>
                                <th className="p-4">Vendor</th>
                                <th className="p-4">Invoice</th>
                                <th className="p-4">Invoice Date</th>
                                <th className="p-4">Due Date</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-right">Due</th>
                                <th className="p-4 text-center">Aging</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {filteredPayables.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-neutral-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertTriangle className="w-8 h-8 text-neutral-300" />
                                        <p>No outstanding payables found</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredPayables.map(payable => (
                                    <tr key={payable.invoiceId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Truck className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900 dark:text-white">{payable.vendorName}</p>
                                                    {payable.phone && <p className="text-xs text-neutral-500">{payable.phone}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-neutral-500">#{payable.invoiceId.substring(0, 8)}</td>
                                        <td className="p-4 text-neutral-600 dark:text-neutral-400">
                                            {new Date(payable.invoiceDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-neutral-600 dark:text-neutral-400">
                                            {new Date(payable.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right text-neutral-700 dark:text-neutral-300">
                                            ₹{payable.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right font-bold text-error">
                                            ₹{payable.dueAmount.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getAgingColor(payable.agingBucket)}`}>
                                                {payable.daysOverdue > 0 ? `${payable.daysOverdue}d overdue` : 'Current'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg" title="Call">
                                                    <Phone className="w-4 h-4 text-primary" />
                                                </button>
                                                <button className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-lg hover:bg-success/20">
                                                    Pay
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                    {filteredPayables.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">No outstanding payables</div>
                    ) : (
                        filteredPayables.map(payable => (
                            <div key={payable.invoiceId} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-neutral-900 dark:text-white">{payable.vendorName}</p>
                                        <p className="text-xs text-neutral-500">Invoice #{payable.invoiceId.substring(0, 8)}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${getAgingColor(payable.agingBucket)}`}>
                                        {payable.daysOverdue > 0 ? `${payable.daysOverdue}d` : 'Current'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg">
                                    <div>
                                        <p className="text-xs text-neutral-500">Due Amount</p>
                                        <p className="font-bold text-error">₹{payable.dueAmount.toLocaleString()}</p>
                                    </div>
                                    <button className="px-4 py-2 bg-success text-white text-xs font-bold rounded-lg">
                                        Pay
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

export default OutstandingPayables;
