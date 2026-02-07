import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Filter, Calendar } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import api from '../../../services/api';
import { toast } from 'react-toastify';

// Interfaces for response data
interface Transaction {
    date: string;
    type: 'BILL' | 'PAYMENT' | 'DEBIT_NOTE';
    refNo: string;
    description: string;
    credit: number;
    debit: number;
    balance: number;
    originalRef: any;
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

const SupplierLedger: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LedgerData | null>(null);

    // Date State (Default to current month)
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const user = useSelector((state: RootState) => state.auth.user);
    const token = user?.token;

    const fetchLedger = async () => {
        if (!id || !token) return;
        setLoading(true);
        try {
            const response = await api.get(`/api/purchases/suppliers/${id}/ledger`, {
                params: { startDate, endDate },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, [id, token]); // Don't auto-fetch on date change to let user select range first? Or auto fetch?
    // Usually auto-fetch on date change is better UX.
    useEffect(() => {
        fetchLedger();
    }, [startDate, endDate]);

    const handlePrint = () => {
        window.print();
    };

    // Helper for currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    if (loading && !data) return <div className="p-8 text-center">Loading Ledger...</div>;
    if (!data) return <div className="p-8 text-center">No Data Found</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">{data.supplier.businessName}</h1>
                        <p className="text-sm text-gray-500">Supplier Ledger Statement</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-700 p-1 rounded-md">
                        <input
                            type="date"
                            className="bg-transparent border-none text-sm px-2 py-1 outline-none"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-sm px-2 py-1 outline-none"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <button onClick={fetchLedger} className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded">
                            <Filter size={16} />
                        </button>
                    </div>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>

            {/* Content - Printable Area */}
            <div className="flex-1 overflow-auto p-6" id="printable-area">
                <div className="max-w-5xl mx-auto bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-8 min-h-[500px]">

                    {/* Statement Header */}
                    <div className="text-center mb-8 border-b pb-4">
                        <h2 className="text-2xl font-bold uppercase tracking-wide mb-2">Statement of Accounts</h2>
                        <h3 className="text-lg font-semibold">{data.supplier.businessName}</h3>
                        <p className="text-gray-500">
                            Period: {new Date(data.period.start).toLocaleDateString()} to {new Date(data.period.end).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-gray-50 dark:bg-neutral-700 rounded text-center">
                            <span className="block text-xs uppercase text-gray-500 mb-1">Opening Balance</span>
                            <span className="text-lg font-bold">{formatCurrency(data.openingBalance)}</span>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-neutral-700 rounded text-center">
                            <span className="block text-xs uppercase text-gray-500 mb-1">Total Debit</span>
                            <span className="text-lg font-bold text-green-600">{formatCurrency(data.totals.debit)}</span>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-neutral-700 rounded text-center">
                            <span className="block text-xs uppercase text-gray-500 mb-1">Total Credit</span>
                            <span className="text-lg font-bold text-red-600">{formatCurrency(data.totals.credit)}</span>
                        </div>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded text-center border border-indigo-100">
                            <span className="block text-xs uppercase text-indigo-600 mb-1">Closing Balance</span>
                            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(data.closingBalance)}</span>
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-800 text-left">
                                <th className="py-2 w-24">Date</th>
                                <th className="py-2 w-32">Type</th>
                                <th className="py-2">Description</th>
                                <th className="py-2 text-right w-28">Debit</th>
                                <th className="py-2 text-right w-28">Credit</th>
                                <th className="py-2 text-right w-32">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Opening Row */}
                            <tr className="border-b border-gray-100 dark:border-neutral-700">
                                <td className="py-3 text-gray-500">{new Date(data.period.start).toLocaleDateString()}</td>
                                <td className="py-3 italic text-gray-500">OPENING</td>
                                <td className="py-3 italic text-gray-500">Opening Balance Forwarded</td>
                                <td className="py-3 text-right">-</td>
                                <td className="py-3 text-right">-</td>
                                <td className="py-3 text-right font-medium">{formatCurrency(data.openingBalance)}</td>
                            </tr>

                            {data.transactions.map((t, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                                    <td className="py-3">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === 'BILL' ? 'bg-orange-100 text-orange-800' :
                                            t.type === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {t.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="font-medium">{t.refNo}</div>
                                        <div className="text-xs text-gray-500">{t.description}</div>
                                    </td>
                                    <td className="py-3 text-right">
                                        {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                                    </td>
                                    <td className="py-3 text-right">
                                        {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(t.balance)}
                                        <span className="text-xs ml-1 text-gray-400">
                                            {t.balance > 0 ? 'Cr' : 'Dr'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-12 text-center text-xs text-gray-400">
                        <p>This is a computer-generated statement and does not require a signature.</p>
                        <p>Generated on {new Date().toLocaleString()}</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SupplierLedger;
