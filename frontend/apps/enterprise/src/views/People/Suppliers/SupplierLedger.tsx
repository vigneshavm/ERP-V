import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Filter, Calendar, Book, RefreshCw, FileText, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import api from "@/shared/api/api";
import { toast } from 'react-toastify';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import SupplierSubNav from './SupplierSubNav';
import SupplierLedgerSummary from './components/SupplierLedgerSummary';
import SupplierLedgerTable from './components/SupplierLedgerTable';

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
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(id || null);
    const [searchTerm, setSearchTerm] = useState('');

    const { user: user } = useAuthStore();
    const token = user?.token;
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    // Filtered suppliers for picker
    const filteredSuppliers = useMemo(() => {
        const list = (suppliers || []).filter((s: any) => s.status === 'active');
        if (!searchTerm) return list;
        const term = searchTerm.toLowerCase();
        return list.filter((s: any) =>
            s.businessName?.toLowerCase().includes(term) ||
            s.contactPersonName?.toLowerCase().includes(term) ||
            s.supplierId?.toLowerCase().includes(term)
        );
    }, [suppliers, searchTerm]);

    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        // Indian Fiscal Year: April 1 to March 31
        // If current month is Jan-Mar (0-2), start year is previous year
        const startYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
        return `${startYear}-04-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const effectiveId = selectedSupplierId || id;

    const fetchLedger = async () => {
        if (!effectiveId || !token) return;
        setLoading(true);
        try {
            const response = await api.get(`/api/purchases/suppliers/${effectiveId}/ledger`, {
                params: { startDate, endDate },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error: any) {
            logger.error(error);
            toast.error(error.response?.data?.message || 'Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (effectiveId) fetchLedger();
    }, [effectiveId, token]);

    useEffect(() => {
        if (effectiveId) fetchLedger();
    }, [startDate, endDate]);

    const handleSelectSupplier = (supplierId: string) => {
        setSelectedSupplierId(supplierId);
        setData(null);
    };

    const handlePrint = () => { window.print(); };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    const handleRowClick = (t: Transaction) => {
        if (t.type === 'BILL' && t.originalRef?._id) {
            navigate(`/purchase/bills/view/${t.originalRef._id}`);
        } else if (t.type === 'DEBIT_NOTE') {
            if (t.purchaseReturnId) {
                navigate(`/purchase/returns/view/${t.purchaseReturnId}`);
            } else {
                navigate(`/purchase/debit-notes`);
            }
        } else if (t.type === 'PAYMENT') {
            navigate(`/purchase/payments`);
        }
    };

    // ==========================================
    // SUPPLIER PICKER VIEW (no supplier selected)
    // ==========================================
    if (!effectiveId) {
        return (
            <Layout>
                <div className="space-y-8 animate-in fade-in duration-700 pb-10 max-w-[1600px] mx-auto">
                    <PageHeader
                        title="Supplier Ledger"
                        description="Select a supplier to view their account statement"
                    />
                    <SupplierSubNav />

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl text-sm text-slate-800 dark:text-neutral-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-neutral-500"
                        />
                    </div>

                    {/* Supplier Grid - Dashboard card style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSuppliers.length === 0 ? (
                            <div className="col-span-full text-center py-20">
                                <Book className="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-neutral-700" />
                                <p className="text-sm font-bold text-slate-400 dark:text-neutral-500">No suppliers found</p>
                                <p className="text-[10px] text-slate-300 dark:text-neutral-600 mt-1 uppercase tracking-wider font-bold">Try adjusting your search term</p>
                            </div>
                        ) : (
                            filteredSuppliers.map((s: any) => (
                                <button
                                    key={s._id}
                                    onClick={() => handleSelectSupplier(s._id)}
                                    className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all text-left group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-all" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 font-black text-sm shrink-0 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all">
                                            {s.businessName?.charAt(0)?.toUpperCase() || 'S'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 dark:text-neutral-100 text-sm truncate">{s.businessName}</p>
                                            {s.contactPersonName && (
                                                <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate font-medium mt-0.5">{s.contactPersonName}</p>
                                            )}
                                        </div>
                                        <Book className="w-4 h-4 text-slate-200 dark:text-neutral-700 group-hover:text-indigo-500 transition-colors shrink-0" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Layout>
        );
    }

    // ==========================================
    // LOADING STATE
    // ==========================================
    if (loading && !data) return (
        <Layout>
            <div className="space-y-8 animate-in fade-in duration-700 pb-10 max-w-[1600px] mx-auto">
                <SupplierSubNav />
                <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-400 dark:text-neutral-500">Loading Ledger...</p>
                </div>
            </div>
        </Layout>
    );

    // ==========================================
    // NO DATA STATE
    // ==========================================
    if (!data) return (
        <Layout>
            <div className="space-y-8 animate-in fade-in duration-700 pb-10 max-w-[1600px] mx-auto">
                <SupplierSubNav />
                <div className="flex flex-col items-center justify-center py-20">
                    <FileText className="w-12 h-12 text-slate-200 dark:text-neutral-700 mb-3" />
                    <p className="text-sm font-bold text-slate-400 dark:text-neutral-500">No Data Found</p>
                </div>
            </div>
        </Layout>
    );

    // ==========================================
    // MAIN LEDGER VIEW
    // ==========================================
    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in duration-700 pb-10 max-w-[1600px] mx-auto">

                {/* Header Section — Dashboard style */}
                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-4">
                        {(id || selectedSupplierId) && (
                            <button
                                onClick={() => id ? navigate(`/suppliers/${id}`) : (setSelectedSupplierId(null), setData(null))}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:bg-indigo-50 hover:text-indigo-500 hover:border-indigo-200 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/20 transition-all mr-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-neutral-100 tracking-tight">{data.supplier.businessName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[9px] font-black uppercase rounded-md border border-indigo-100/50 dark:border-indigo-500/20">
                                    Ledger
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-neutral-600" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500">
                                    {new Date(data.period.start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(data.period.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 p-1.5 rounded-xl border border-slate-100 dark:border-neutral-700 shadow-sm">
                            <Calendar size={14} className="ml-2 text-slate-400" />
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs px-1.5 py-1 outline-none text-slate-700 dark:text-neutral-200 font-bold"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-slate-200 dark:text-neutral-600 font-bold text-xs">→</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs px-1.5 py-1 outline-none text-slate-700 dark:text-neutral-200 font-bold"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            <button
                                onClick={fetchLedger}
                                className="p-1.5 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded-lg transition-colors text-indigo-500"
                                title="Apply Filter"
                            >
                                <Filter size={14} />
                            </button>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-sm active:scale-95 text-xs font-black uppercase tracking-wider"
                        >
                            <Printer size={14} />
                            Print
                        </button>
                    </div>
                </div>

                {/* Metrics Grid — Dashboard tinted cards */}
                <SupplierLedgerSummary data={data} />

                {/* Statement Header - for print */}
                <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
                    <h2 className="text-2xl font-bold uppercase tracking-wide">Statement of Accounts</h2>
                    <h3 className="text-lg font-semibold mt-1">{data.supplier.businessName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Period: {new Date(data.period.start).toLocaleDateString('en-IN')} to {new Date(data.period.end).toLocaleDateString('en-IN')}
                    </p>
                </div>

                {/* Transactions Table — Dashboard container style */}
                <SupplierLedgerTable
                    data={data}
                    loading={loading}
                    onRowClick={handleRowClick}
                />

                {/* Print-only Statement Footer */}
                <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                    <p>This is a computer-generated statement and does not require a signature.</p>
                    <p className="mt-1">For any queries, please contact us.</p>
                </div>
            </div>
        </Layout>
    );
};

export default SupplierLedger;
