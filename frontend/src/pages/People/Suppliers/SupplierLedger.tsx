import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Filter, Calendar, ChevronLeft, TrendingUp, FileText, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../../components/shared/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';

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
    purchaseReturnId?: string;
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

    // Redirect if no ID (Global view not supported yet, must select supplier)
    useEffect(() => {
        if (!id) {
            navigate('/suppliers');
            toast.info('Please select a supplier to view their ledger.');
        }
    }, [id, navigate]);

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

    const handleRowClick = (t: Transaction) => {
        if (t.type === 'BILL' && t.originalRef?._id) {
            navigate(`/purchase/bills/view/${t.originalRef._id}`);
        } else if (t.type === 'DEBIT_NOTE') {
            if (t.purchaseReturnId) {
                navigate(`/purchase/returns/view/${t.purchaseReturnId}`);
            } else {
                // Fallback for manual debit notes or if return link missing
                // Navigate to generic returns or debit notes list? 
                // Assuming Debit Notes list
                navigate(`/purchase/debit-notes`);
            }
        } else if (t.type === 'PAYMENT') {
            // No direct view for payment usually, maybe list?
            navigate(`/purchase/payments`);
        }
    };

    if (loading && !data) return <div className="p-8 text-center pt-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-500 font-medium">Loading Ledger...</p>
    </div>;

    if (!data) return <div className="p-8 text-center pt-20">
        <p className="text-neutral-500 font-medium">No Data Found</p>
    </div>;

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title={data.supplier.businessName}
                    description="Supplier Ledger Statement"
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <Calendar size={16} className="ml-2 text-neutral-400" />
                                <input
                                    type="date"
                                    className="bg-transparent border-none text-sm px-2 py-1 outline-none text-neutral-700 dark:text-neutral-200 font-medium"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <span className="text-neutral-300 font-bold px-1">/</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none text-sm px-2 py-1 outline-none text-neutral-700 dark:text-neutral-200 font-medium"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                                <button
                                    onClick={fetchLedger}
                                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors ml-1 text-primary group"
                                    title="Filter Range"
                                >
                                    <Filter size={16} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-sm active:scale-95 text-sm font-bold"
                            >
                                <Printer size={18} />
                                <span>Print Ledger</span>
                            </button>
                        </div>
                    }
                />

                {/* Statement Header */}
                <div className="text-center mb-8 border-b border-neutral-100 dark:border-neutral-700 pb-6">
                    <h2 className="text-2xl font-bold uppercase tracking-wide mb-2 text-neutral-900 dark:text-white">Statement of Accounts</h2>
                    <h3 className="text-lg font-semibold text-primary">{data.supplier.businessName}</h3>
                    <p className="text-neutral-500 text-sm mt-1">
                        Period: <span className="font-medium text-neutral-700 dark:text-neutral-300">{new Date(data.period.start).toLocaleDateString()}</span> to <span className="font-medium text-neutral-700 dark:text-neutral-300">{new Date(data.period.end).toLocaleDateString()}</span>
                    </p>
                </div>

                {/* Summary Cards - Grid Layout aligned with Registers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 print:grid-cols-4 print:gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Opening</p>
                                <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{formatCurrency(data.openingBalance).replace('₹', '')}</p>
                            </div>
                            <div className="p-3 bg-neutral-100 dark:bg-neutral-700/50 rounded-xl text-neutral-400"><TrendingUp size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Debit</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(data.totals.debit).replace('₹', '')}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600"><FileText size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Credit</p>
                                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(data.totals.credit).replace('₹', '')}</p>
                            </div>
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600"><FileText size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-primary uppercase tracking-wider">Closing</p>
                                <p className="text-2xl font-black text-primary mt-1">{formatCurrency(data.closingBalance).replace('₹', '')}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl text-primary"><Clock size={24} /></div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-neutral-100 dark:border-neutral-700">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                            <tr>
                                <th className="py-4 px-4 font-bold text-neutral-500 uppercase text-[10px] tracking-widest text-left">Date</th>
                                <th className="py-4 px-4 font-bold text-neutral-500 uppercase text-[10px] tracking-widest text-left">Type</th>
                                <th className="py-4 px-4 font-bold text-neutral-500 uppercase text-[10px] tracking-widest text-left">Description</th>
                                <th className="py-4 px-4 font-bold text-neutral-500 uppercase text-[10px] tracking-widest text-right">Debit (₹)</th>
                                <th className="py-4 px-4 font-bold text-neutral-500 uppercase text-[10px] tracking-widest text-right">Credit (₹)</th>
                                <th className="py-4 px-4 font-bold text-neutral-500 uppercase text-[10px] tracking-widest text-right">Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                                <td className="py-4 px-4 text-neutral-500 font-medium">{new Date(data.period.start).toLocaleDateString()}</td>
                                <td className="py-4 px-4"><span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">OPENING</span></td>
                                <td className="py-4 px-4 italic text-neutral-400 text-xs">Opening Balance Forwarded</td>
                                <td className="py-4 px-4 text-right text-neutral-300">-</td>
                                <td className="py-4 px-4 text-right text-neutral-300">-</td>
                                <td className="py-4 px-4 text-right font-bold text-neutral-600 dark:text-neutral-400">{formatCurrency(data.openingBalance).replace('₹', '')}</td>
                            </tr>
                            {data.transactions.map((t, i) => (
                                <tr
                                    key={i}
                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer group transition-colors"
                                    onClick={() => handleRowClick(t)}
                                >
                                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400 font-medium">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${t.type === 'BILL' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                            t.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                            {t.type === 'DEBIT_NOTE' ? (t.purchaseReturnId ? 'RETURN' : 'DBT NOTE') : t.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary transition-colors">#{t.refNo}</div>
                                        <div className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-[200px]">{t.description}</div>
                                    </td>
                                    <td className="py-4 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                                        {t.debit > 0 ? formatCurrency(t.debit).replace('₹', '') : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                                        {t.credit > 0 ? formatCurrency(t.credit).replace('₹', '') : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-right font-black text-neutral-900 dark:text-white">
                                        {formatCurrency(t.balance).replace('₹', '')}
                                        <span className="text-[10px] ml-1 text-neutral-400 font-medium">
                                            {t.balance > 0 ? 'Cr' : 'Dr'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default SupplierLedger;
