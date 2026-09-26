import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
import {
    Search,
    FileText,
    Calendar,
    Download,
    Printer,
    Mail,
    Eye,
    Phone
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface StatementData {
    customerId: string;
    customerName: string;
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

const CustomerStatements: React.FC = () => {
    const { customers } = useSelector((state: RootState) => state.customers);
    const { invoices: salesHistory } = useSelector((state: RootState) => state.pos);
    const { currentSector } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [periodFrom, setPeriodFrom] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Filter customers
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            return c.name.toLowerCase().includes(search) || c.phone?.includes(searchTerm);
        });
    }, [customers, searchTerm]);

    // Generate statement for selected customer
    const statementData: StatementData | null = useMemo(() => {
        if (!selectedCustomerId) return null;

        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer) return null;

        const transactions: StatementData['transactions'] = [];
        let runningBalance = 0;

        const customerSales = salesHistory
            .filter(s => {
                const cid = typeof s.customer === 'string' ? s.customer : s.customer?._id || s.customer?.id;
                return (
                    cid === selectedCustomerId &&
                    s.sector === currentSector &&
                    new Date(s.createdAt) >= new Date(periodFrom) &&
                    new Date(s.createdAt) <= new Date(periodTo)
                );
            })
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        customerSales.forEach(sale => {
            const saleId = sale._id || sale.id;
            // Sale
            runningBalance += sale.totalAmount;
            transactions.push({
                date: sale.createdAt,
                reference: `INV-${saleId.substring(0, 8)}`,
                description: `Invoice - ${sale.items.length} items`,
                debit: sale.totalAmount,
                credit: 0,
                balance: runningBalance
            });

            // Payment
            const paid = sale.paidAmount ?? sale.totalAmount;
            if (paid > 0) {
                runningBalance -= paid;
                transactions.push({
                    date: sale.createdAt,
                    reference: `REC-${saleId.substring(0, 6)}`,
                    description: 'Payment received',
                    debit: 0,
                    credit: paid,
                    balance: runningBalance
                });
            }
        });

        return {
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            email: (customer as any).email,
            periodFrom,
            periodTo,
            openingBalance: 0,
            closingBalance: runningBalance,
            transactions
        };
    }, [selectedCustomerId, customers, salesHistory, currentSector, periodFrom, periodTo]);

    const handlePrint = () => {
        window.print();
    };

    const businessName = tenants[0]?.name || 'Your Business';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        Customer Statements
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Generate and send account statements to customers</p>
                </div>
            </div>

            {/* Statement Generator */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Generate Statement</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Select Customer</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search customer..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm mb-2"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        </div>
                        <select
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                            value={selectedCustomerId}
                            onChange={e => setSelectedCustomerId(e.target.value)}
                            size={5}
                        >
                            {filteredCustomers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Period From</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                                value={periodFrom}
                                onChange={e => setPeriodFrom(e.target.value)}
                            />
                            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Period To</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                                value={periodTo}
                                onChange={e => setPeriodTo(e.target.value)}
                            />
                            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setShowPreview(true)}
                        disabled={!selectedCustomerId}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4" /> Preview Statement
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!statementData}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button
                        disabled={!statementData}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button
                        disabled={!statementData || !statementData.email}
                        className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success/90 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Mail className="w-4 h-4" /> Email to Customer
                    </button>
                </div>
            </div>

            {/* Statement Preview */}
            {statementData && (showPreview || true) && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 print:border-0 print:p-0">
                    {/* Statement Header */}
                    <div className="border-b-2 border-primary pb-4 mb-6 print:border-black">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white print:text-black">{businessName}</h1>
                                <p className="text-slate-500 text-sm print:text-slate-600">Account Statement</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-600 dark:text-slate-400 print:text-slate-600">
                                    Statement Date: {formatDate(new Date())}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 print:text-slate-600">
                                    Period: {formatDate(statementData.periodFrom)} - {formatDate(statementData.periodTo)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg print:bg-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Bill To</h3>
                            <p className="font-bold text-slate-900 dark:text-white print:text-black">{statementData.customerName}</p>
                            {statementData.phone && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {statementData.phone}
                                </p>
                            )}
                            {statementData.email && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> {statementData.email}
                                </p>
                            )}
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg print:bg-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Account Summary</h3>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Opening Balance:</span>
                                    <span className="font-medium">₹{statementData.openingBalance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Total Invoices:</span>
                                    <span className="font-medium text-error">₹{statementData.transactions.filter(t => t.debit > 0).reduce((a, t) => a + t.debit, 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Total Payments:</span>
                                    <span className="font-medium text-success">₹{statementData.transactions.filter(t => t.credit > 0).reduce((a, t) => a + t.credit, 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                                    <span>Closing Balance:</span>
                                    <span className={statementData.closingBalance > 0 ? 'text-error' : 'text-success'}>
                                        ₹{statementData.closingBalance.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900 print:bg-slate-200">
                                <th className="p-3 text-left border border-slate-200 dark:border-slate-700 print:border-slate-300">Date</th>
                                <th className="p-3 text-left border border-slate-200 dark:border-slate-700 print:border-slate-300">Reference</th>
                                <th className="p-3 text-left border border-slate-200 dark:border-slate-700 print:border-slate-300">Description</th>
                                <th className="p-3 text-right border border-slate-200 dark:border-slate-700 print:border-slate-300">Debit</th>
                                <th className="p-3 text-right border border-slate-200 dark:border-slate-700 print:border-slate-300">Credit</th>
                                <th className="p-3 text-right border border-slate-200 dark:border-slate-700 print:border-slate-300">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statementData.transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-700">
                                        No transactions in this period
                                    </td>
                                </tr>
                            ) : (
                                statementData.transactions.map((t, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800 print:hover:bg-transparent">
                                        <td className="p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300">
                                            {formatDate(t.date)}
                                        </td>
                                        <td className="p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300 font-mono text-xs">
                                            {t.reference}
                                        </td>
                                        <td className="p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300">
                                            {t.description}
                                        </td>
                                        <td className="p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300 text-right text-error">
                                            {t.debit > 0 ? `₹${t.debit.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300 text-right text-success">
                                            {t.credit > 0 ? `₹${t.credit.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300 text-right font-bold">
                                            ₹{t.balance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 dark:bg-slate-900 font-bold print:bg-slate-200">
                                <td colSpan={3} className="p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300 text-right">
                                    Balance Due:
                                </td>
                                <td colSpan={3} className={`p-3 border border-slate-200 dark:border-slate-700 print:border-slate-300 text-right text-lg ${statementData.closingBalance > 0 ? 'text-error' : 'text-success'}`}>
                                    ₹{statementData.closingBalance.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 print:border-slate-300">
                        <p>This is a computer-generated statement and does not require a signature.</p>
                        <p className="mt-1">For any queries, please contact us.</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!selectedCustomerId && (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Select a Customer</h3>
                    <p className="text-slate-500 mt-1">Choose a customer and date range to generate their account statement</p>
                </div>
            )}
        </div>
    );
};

export default CustomerStatements;
