import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import api from "@/shared/api/api";
import {
    Search,
    FileText,
    Truck,
    Calendar,
    Download,
    Printer,
    Mail,
    Eye,
    Phone,
    RefreshCw,
    Book
} from 'lucide-react';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import SupplierSubNav from './SupplierSubNav';
import { toast } from 'react-toastify';

// Matches the API response from /api/purchases/suppliers/:id/ledger
interface Transaction {
    date: string;
    type: 'BILL' | 'PAYMENT' | 'DEBIT_NOTE';
    refNo: string;
    description: string;
    credit: number;
    debit: number;
    balance: number;
}

interface LedgerData {
    supplier: {
        _id: string;
        businessName: string;
        openingBalance: number;
    };
    period: {
        start: string;
        end: string;
    };
    openingBalance: number;
    closingBalance: number;
    totals: {
        credit: number;
        debit: number;
    };
    transactions: Transaction[];
}

const SupplierStatements: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [periodFrom, setPeriodFrom] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().split('T')[0]);

    // API state
    const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
    const [loading, setLoading] = useState(false);

    // Filter suppliers for dropdown
    const filteredSuppliers = useMemo(() => {
        return (suppliers || []).filter((v: any) => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            return v.businessName?.toLowerCase().includes(search) ||
                v.contactPersonName?.toLowerCase().includes(search) ||
                v.contactNo?.includes(searchTerm);
        });
    }, [suppliers, searchTerm]);

    // Fetch statement from API when supplier or dates change
    const fetchStatement = async () => {
        if (!selectedSupplierId || !user?.token) return;

        setLoading(true);
        setLedgerData(null);
        try {
            const response = await api.get(`/api/purchases/suppliers/${selectedSupplierId}/ledger`, {
                params: { startDate: periodFrom, endDate: periodTo },
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (response.data.success) {
                setLedgerData(response.data.data);
            }
        } catch (error: any) {
            console.error('Statement fetch error:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch statement');
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch when supplier selection or period changes
    useEffect(() => {
        if (selectedSupplierId) {
            fetchStatement();
        } else {
            setLedgerData(null);
        }
    }, [selectedSupplierId, periodFrom, periodTo]);

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const businessName = "BizzAI ERP";

    return (
        <Layout>
            <PageHeader
                title="Supplier Statements"
                description="Generate and view account statements for suppliers"
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
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm mb-2 focus:ring-2 focus:ring-primary outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            </div>
                            <select
                                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
                                value={selectedSupplierId}
                                onChange={e => setSelectedSupplierId(e.target.value)}
                                size={5}
                            >
                                {filteredSuppliers.map((v: any) => (
                                    <option key={v._id} value={v._id} className="p-2 cursor-pointer">
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
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary outline-none"
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
                                    className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={periodTo}
                                    onChange={e => setPeriodTo(e.target.value)}
                                />
                                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            </div>
                        </div>
                    </div>

                    {periodFrom > periodTo && (
                        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <Calendar className="w-5 h-5" />
                            <p className="text-sm font-bold">"Period From" cannot be later than "Period To".</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={fetchStatement}
                            disabled={!selectedSupplierId || loading}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                            {loading ? 'Loading...' : 'Generate Statement'}
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={!ledgerData}
                            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-white dark:bg-neutral-800 p-12 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center shadow-sm">
                        <RefreshCw className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
                        <p className="text-neutral-500 font-medium">Fetching statement data...</p>
                    </div>
                )}

                {/* Statement Preview */}
                {ledgerData && !loading && (
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 print:border-0 print:p-0 shadow-sm">
                        {/* Statement Header */}
                        <div className="border-b-2 border-primary pb-4 mb-6 print:border-black">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white print:text-black">{businessName}</h1>
                                    <p className="text-neutral-500 text-sm print:text-gray-600">Supplier Account Statement</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 print:text-gray-600">
                                        Statement Date: {new Date().toLocaleDateString('en-IN')}
                                    </p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 print:text-gray-600">
                                        Period: {new Date(ledgerData.period.start).toLocaleDateString('en-IN')} — {new Date(ledgerData.period.end).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Details + Summary */}
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-lg print:bg-gray-100">
                                <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Supplier</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <Truck className="w-4 h-4 text-primary" />
                                    <p className="font-bold text-neutral-900 dark:text-white print:text-black">{ledgerData.supplier.businessName}</p>
                                </div>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-lg print:bg-gray-100">
                                <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Account Summary</h3>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">Opening Balance:</span>
                                        <span className="font-medium">{formatCurrency(ledgerData.openingBalance)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">Total Debits:</span>
                                        <span className="font-medium text-emerald-600">{formatCurrency(ledgerData.totals.debit)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">Total Credits:</span>
                                        <span className="font-medium text-rose-600">{formatCurrency(ledgerData.totals.credit)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold border-t border-neutral-200 dark:border-neutral-600 pt-1 mt-1">
                                        <span>Closing Balance:</span>
                                        <span className={ledgerData.closingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                            {formatCurrency(ledgerData.closingBalance)}
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
                                        <th className="p-3 text-left border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Type</th>
                                        <th className="p-3 text-left border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Reference</th>
                                        <th className="p-3 text-left border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Description</th>
                                        <th className="p-3 text-right border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Debit (₹)</th>
                                        <th className="p-3 text-right border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Credit (₹)</th>
                                        <th className="p-3 text-right border border-neutral-200 dark:border-neutral-700 print:border-gray-300">Balance (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Opening Balance Row */}
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700 text-neutral-500 font-medium">
                                            {new Date(ledgerData.period.start).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700">
                                            <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">OPENING</span>
                                        </td>
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700 text-neutral-400">—</td>
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700 italic text-neutral-400 text-xs">Opening Balance Forwarded</td>
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700 text-right text-neutral-300">—</td>
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700 text-right text-neutral-300">—</td>
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700 text-right font-bold text-neutral-600 dark:text-neutral-400">
                                            {formatCurrency(ledgerData.openingBalance)}
                                        </td>
                                    </tr>

                                    {ledgerData.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                                                No transactions in this period
                                            </td>
                                        </tr>
                                    ) : (
                                        ledgerData.transactions.map((t, idx) => (
                                            <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 print:hover:bg-transparent">
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-neutral-600 dark:text-neutral-400">
                                                    {new Date(t.date).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${t.type === 'BILL' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                        t.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}>
                                                        {t.type === 'DEBIT_NOTE' ? 'D.NOTE' : t.type}
                                                    </span>
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 font-mono text-xs">
                                                    #{t.refNo}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-sm max-w-[200px] truncate" title={t.description}>
                                                    {t.description}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {t.debit > 0 ? formatCurrency(t.debit) : '—'}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right font-semibold text-rose-600 dark:text-rose-400">
                                                    {t.credit > 0 ? formatCurrency(t.credit) : '—'}
                                                </td>
                                                <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right font-bold text-neutral-900 dark:text-white">
                                                    {formatCurrency(t.balance)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-neutral-100 dark:bg-neutral-900 font-bold print:bg-gray-200">
                                        <td colSpan={4} className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right">
                                            Closing Balance:
                                        </td>
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right text-emerald-600">
                                            {formatCurrency(ledgerData.totals.debit)}
                                        </td>
                                        <td className="p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right text-rose-600">
                                            {formatCurrency(ledgerData.totals.credit)}
                                        </td>
                                        <td className={`p-3 border border-neutral-200 dark:border-neutral-700 print:border-gray-300 text-right text-lg font-black ${ledgerData.closingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {formatCurrency(ledgerData.closingBalance)}
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
                {!selectedSupplierId && !loading && (
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
