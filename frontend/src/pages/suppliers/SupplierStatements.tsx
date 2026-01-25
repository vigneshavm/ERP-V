import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import {
    Search,
    FileText,
    Truck,
    Calendar,
    Download,
    Printer,
    Mail,
    Eye,
    Phone
} from 'lucide-react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SupplierSubNav from './SupplierSubNav';

interface StatementData {
    vendorId: string;
    vendorName: string;
    phone?: string;
    email?: string;
    periodFrom: string;
    periodTo: string;
    openingBalance: number;
    closingBalance: number;
    transactions: {
        date: string;
        reference: string;
        description: string;
        debit: number;
        credit: number;
        balance: number;
    }[];
}

const SupplierStatements: React.FC = () => {
    const { orders } = useSelector((state: RootState) => (state as any).purchase || { orders: [] });
    const { vendors } = useSelector((state: RootState) => (state as any).vendor || { vendors: [] });
    const { currentSector } = useSelector((state: RootState) => (state as any).auth || {});
    const { tenants } = useSelector((state: RootState) => (state as any).tenant || { tenants: [] });

    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [periodFrom, setPeriodFrom] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter vendors
    const filteredVendors = useMemo(() => {
        return (vendors || []).filter(v => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            return v.name.toLowerCase().includes(search) || v.phone?.includes(searchTerm);
        });
    }, [vendors, searchTerm]);

    // Generate statement for selected vendor
    const statementData: StatementData | null = useMemo(() => {
        if (!selectedVendorId) return null;

        const vendor = vendors.find(v => v.id === selectedVendorId);
        if (!vendor) return null;

        const transactions: StatementData['transactions'] = [];
        let runningBalance = 0;

        const vendorOrders = (orders || [])
            .filter(o =>
                o.vendorId === selectedVendorId &&
                o.sector === currentSector &&
                o.status === 'APPROVED' &&
                new Date(o.date) >= new Date(periodFrom) &&
                new Date(o.date) <= new Date(periodTo)
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        vendorOrders.forEach((order, idx) => {
            // Purchase
            runningBalance += order.total;
            transactions.push({
                date: order.date,
                reference: `PO-${order.id.substring(0, 8)}`,
                description: `Purchase Order - ${order.items.length} items`,
                debit: 0,
                credit: order.total,
                balance: runningBalance
            });

            // Payment (simulate for paid orders)
            if (idx % 2 === 0) {
                runningBalance -= order.total;
                transactions.push({
                    date: order.date,
                    reference: `PAY-${order.id.substring(0, 6)}`,
                    description: 'Payment made',
                    debit: order.total,
                    credit: 0,
                    balance: runningBalance
                });
            }
        });

        return {
            vendorId: vendor.id,
            vendorName: vendor.name,
            phone: vendor.phone,
            email: (vendor as any).email,
            periodFrom,
            periodTo,
            openingBalance: 0,
            closingBalance: runningBalance,
            transactions
        };
    }, [selectedVendorId, vendors, orders, currentSector, periodFrom, periodTo]);

    const handlePrint = () => {
        window.print();
    };

    const businessName = tenants[0]?.name || 'Your Business';

    return (
        <Layout>
            <PageHeader
                title="Supplier Statements"
                description="Generate and send account statements to suppliers"
                breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Suppliers', link: '/suppliers' }, { label: 'Statements' }]}
            />

            <SupplierSubNav />

            <div className="space-y-6 animate-fade-in">
                {/* Statement Generator */}
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 print:hidden">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Generate Statement</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Select Supplier</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search supplier..."
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm mb-2"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            </div>
                            <select
                                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={selectedVendorId}
                                onChange={e => setSelectedVendorId(e.target.value)}
                                size={5}
                            >
                                {filteredVendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} {v.phone ? `(${v.phone})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Period From</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                    value={periodFrom}
                                    onChange={e => setPeriodFrom(e.target.value)}
                                />
                                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Period To</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                    value={periodTo}
                                    onChange={e => setPeriodTo(e.target.value)}
                                />
                                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            disabled={!selectedVendorId}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" /> Preview Statement
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={!statementData}
                            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button
                            disabled={!statementData}
                            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                        <button
                            disabled={!statementData || !statementData.email}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Mail className="w-4 h-4" /> Email to Supplier
                        </button>
                    </div>
                </div>

                {/* Statement Preview */}
                {statementData && (
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 print:border-0 print:p-0">
                        {/* Statement Header */}
                        <div className="border-b-2 border-indigo-600 pb-4 mb-6 print:border-black">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white print:text-black">{businessName}</h1>
                                    <p className="text-neutral-500 text-sm print:text-gray-600">Supplier Account Statement</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 print:text-gray-600">
                                        Statement Date: {new Date().toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 print:text-gray-600">
                                        Period: {new Date(statementData.periodFrom).toLocaleDateString()} - {new Date(statementData.periodTo).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Details */}
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-lg print:bg-gray-100">
                                <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Supplier</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <Truck className="w-4 h-4 text-indigo-600" />
                                    <p className="font-bold text-neutral-900 dark:text-white print:text-black">{statementData.vendorName}</p>
                                </div>
                                {statementData.phone && (
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {statementData.phone}
                                    </p>
                                )}
                                {statementData.email && (
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {statementData.email}
                                    </p>
                                )}
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-lg print:bg-gray-100">
                                <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Account Summary</h3>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">Opening Balance:</span>
                                        <span className="font-medium">₹{statementData.openingBalance.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">Total Purchases:</span>
                                        <span className="font-medium text-rose-600">₹{statementData.transactions.filter(t => t.credit > 0).reduce((a, t) => a + t.credit, 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">Total Payments:</span>
                                        <span className="font-medium text-emerald-600">₹{statementData.transactions.filter(t => t.debit > 0).reduce((a, t) => a + t.debit, 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                                        <span>Closing Balance:</span>
                                        <span className={statementData.closingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                            ₹{statementData.closingBalance.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-neutral-100 dark:bg-neutral-900 print:bg-gray-200">
                                        <th className="p-3 text-left border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Date</th>
                                        <th className="p-3 text-left border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Reference</th>
                                        <th className="p-3 text-left border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Description</th>
                                        <th className="p-3 text-right border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Debit (Paid)</th>
                                        <th className="p-3 text-right border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Credit (Owed)</th>
                                        <th className="p-3 text-right border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statementData.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                                                No transactions in this period
                                            </td>
                                        </tr>
                                    ) : (
                                        statementData.transactions.map((t, idx) => (
                                            <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 print:hover:bg-transparent">
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300">
                                                    {new Date(t.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 font-mono text-xs">
                                                    {t.reference}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300">
                                                    {t.description}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right text-emerald-600">
                                                    {t.debit > 0 ? `₹${t.debit.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right text-rose-600">
                                                    {t.credit > 0 ? `₹${t.credit.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right font-bold">
                                                    ₹{t.balance.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-neutral-100 dark:bg-neutral-900 font-bold print:bg-gray-200">
                                        <td colSpan={3} className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right">
                                            Balance Due:
                                        </td>
                                        <td colSpan={3} className={`p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right text-lg ${statementData.closingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            ₹{statementData.closingBalance.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-700 text-center text-xs text-neutral-500 print:border-gray-300">
                            <p>This is a computer-generated statement and does not require a signature.</p>
                            <p className="mt-1">For any queries, please contact us.</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!selectedVendorId && (
                    <div className="bg-white dark:bg-neutral-800 p-12 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                        <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">Select a Supplier</h3>
                        <p className="text-neutral-500 mt-1">Choose a supplier and date range to generate their account statement</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default SupplierStatements;
