import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../../redux/store";
import { getAllSuppliers } from "../../../redux/slices/supplierSlice";
import { getAllBills } from "../../../redux/slices/billSlice";
import { fetchPurchasePayments } from "../../../redux/slices/purchaseSlice";
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
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import SupplierSubNav from './SupplierSubNav';

interface StatementTransaction {
    date: string;
    reference: string;
    description: string;
    debit: number;  // Payment (We paid)
    credit: number; // Bill (We owe)
    balance: number;
}

interface StatementData {
    vendorId: string;
    vendorName: string;
    phone?: string;
    email?: string;
    periodFrom: string;
    periodTo: string;
    openingBalance: number;
    closingBalance: number;
    transactions: StatementTransaction[];
}

const SupplierStatements: React.FC = () => {
    const dispatch = useDispatch<any>();

    // Selectors
    const { suppliers } = useSelector((state: RootState) => state.suppliers);
    const { bills } = useSelector((state: RootState) => state.bill);
    const { payments } = useSelector((state: RootState) => state.purchase);
    const { user } = useSelector((state: RootState) => state.auth);

    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [periodFrom, setPeriodFrom] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch data on mount
    useEffect(() => {
        dispatch(getAllSuppliers());
        dispatch(getAllBills());
        dispatch(fetchPurchasePayments());
    }, [dispatch]);

    // Filter vendors
    const filteredVendors = useMemo(() => {
        return (suppliers || []).filter(v => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            return v.businessName.toLowerCase().includes(search) ||
                v.contactPersonName.toLowerCase().includes(search) ||
                v.contactNo.includes(searchTerm);
        });
    }, [suppliers, searchTerm]);

    // Generate statement for selected vendor
    const statementData: StatementData | null = useMemo(() => {
        if (!selectedVendorId) return null;

        const vendor = suppliers.find(v => v._id === selectedVendorId);
        if (!vendor) return null;

        const fromDate = new Date(periodFrom);
        const toDate = new Date(periodTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date

        // 1. Organize Bills (Credits - Increases Balance/Liability)
        const vendorBills = bills.filter(b =>
            (typeof b.supplier === 'object' ? b.supplier._id === selectedVendorId : b.supplier === selectedVendorId)
        );

        // 2. Organize Payments (Debits - Decreases Balance/Liability)
        const vendorPayments = payments.filter(p => p.supplierId === selectedVendorId);

        // 3. Calculate Opening Balance
        // Sum of all bills before periodFrom - Sum of all payments before periodFrom
        const previousBills = vendorBills.filter(b => new Date(b.date) < fromDate);
        const previousPayments = vendorPayments.filter(p => new Date(p.paymentDate) < fromDate);

        const totalPreviousCredits = previousBills.reduce((sum, b) => sum + b.amount, 0);
        const totalPreviousDebits = previousPayments.reduce((sum, p) => sum + p.amount, 0);

        let runningBalance = totalPreviousCredits - totalPreviousDebits;
        const openingBalance = runningBalance;

        // 4. Process Transactions within Period
        const activeBills = vendorBills.filter(b => {
            const d = new Date(b.date);
            return d >= fromDate && d <= toDate;
        }).map(b => ({
            date: b.date,
            reference: b.billNo,
            description: `Bill Invoice`,
            debit: 0,
            credit: b.amount,
            originalObj: b,
            type: 'BILL'
        }));

        const activePayments = vendorPayments.filter(p => {
            const d = new Date(p.paymentDate);
            return d >= fromDate && d <= toDate;
        }).map(p => ({
            date: p.paymentDate,
            reference: p.paymentNo,
            description: `Payment (${p.paymentMethod})`,
            debit: p.amount,
            credit: 0,
            originalObj: p,
            type: 'PAYMENT'
        }));

        // Combine and Sort
        const allTransactions = [...activeBills, ...activePayments].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Calculate Running Balance for each transaction
        const transactions: StatementTransaction[] = allTransactions.map(t => {
            runningBalance += t.credit; // Increase liability
            runningBalance -= t.debit;  // Decrease liability (payment)
            return {
                date: t.date,
                reference: t.reference,
                description: t.description,
                debit: t.debit,
                credit: t.credit,
                balance: runningBalance
            };
        });

        return {
            vendorId: vendor._id,
            vendorName: vendor.businessName,
            phone: vendor.contactNo,
            email: vendor.email,
            periodFrom,
            periodTo,
            openingBalance,
            closingBalance: runningBalance,
            transactions
        };
    }, [selectedVendorId, suppliers, bills, payments, periodFrom, periodTo]);

    const handlePrint = () => {
        window.print();
    };

    const businessName = "Oripio ERP"; // Could be dynamic from tenant

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
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 print:hidden shadow-sm">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Generate Statement</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Select Supplier</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search supplier..."
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm mb-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            </div>
                            <select
                                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                value={selectedVendorId}
                                onChange={e => setSelectedVendorId(e.target.value)}
                                size={5}
                            >
                                {filteredVendors.map(v => (
                                    <option key={v._id} value={v._id} className="p-2 hover:bg-emerald-50 dark:hover:bg-neutral-600 cursor-pointer">
                                        {v.businessName} {v.contactNo ? `(${v.contactNo})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Period From</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={periodTo}
                                    onChange={e => setPeriodTo(e.target.value)}
                                />
                                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            </div>
                        </div>
                    </div>

                    {periodFrom > periodTo && (
                        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-600 animate-pulse">
                            <Calendar className="w-5 h-5" />
                            <p className="text-sm font-bold">Chronological Error: "Period From" cannot be later than "Period To".</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            disabled={!selectedVendorId}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <Eye className="w-4 h-4" /> Preview Statement
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={!statementData}
                            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button
                            disabled={!statementData}
                            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                        <button
                            disabled={!statementData || !statementData.email}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Mail className="w-4 h-4" /> Email to Supplier
                        </button>
                    </div>
                </div>

                {/* Statement Preview */}
                {statementData && (
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 print:border-0 print:p-0 shadow-sm">
                        {/* Statement Header */}
                        <div className="border-b-2 border-emerald-600 pb-4 mb-6 print:border-black">
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
                                    <Truck className="w-4 h-4 text-emerald-600" />
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
                                        <span className="text-neutral-600 dark:text-neutral-400">Total Purchases (Credits):</span>
                                        <span className="font-medium text-rose-600">₹{statementData.transactions.reduce((a, t) => a + t.credit, 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">Total Payments (Debits):</span>
                                        <span className="font-medium text-emerald-600">₹{statementData.transactions.reduce((a, t) => a + t.debit, 0).toLocaleString()}</span>
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
                    <div className="bg-white dark:bg-neutral-800 p-12 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center shadow-sm">
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


