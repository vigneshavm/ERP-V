import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from "../../redux/store";
import {
    Search,
    AlertTriangle,
    Clock,
    DollarSign,
    Building2,
    Calendar,
    Download,
    Printer,
    ChevronRight,
    ArrowUpRight,
    ExternalLink,
    AlertCircle,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    PauseCircle,
    FileSpreadsheet,
    FileText,
    TrendingUp
} from 'lucide-react';
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { getAllBills } from "../../redux/slices/billSlice";
import { getAllSuppliers } from "../../redux/slices/supplierSlice";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';

interface AgedBill {
    id: string;
    vendorId: string;
    vendorName: string;
    billNumber: string;
    billDate: string;
    dueDate: string;
    amount: number;
    amountPaid: number;
    outstandingAmount: number;
    daysOverdue: number;
    status: string;
    isUrgent: boolean;
    hasDiscount: boolean;
    isDisputed: boolean;
}

const OutstandingPayables: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { bills, isLoading } = useSelector((state: RootState) => state.bill);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Overdue' | 'Due Soon' | 'Future'>('All');
    const [vendorFilter, setVendorFilter] = useState('');
    const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'daysOverdue' | 'vendorName'>('dueDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<'bill-wise' | 'vendor-wise'>('bill-wise');

    useEffect(() => {
        dispatch(getAllBills());
        dispatch(getAllSuppliers());
    }, [dispatch]);

    // Process bills into aged format
    const processedBills = useMemo(() => {
        const today = new Date();
        return bills.map(bill => {
            const dueDate = new Date(bill.due_date);
            const diffTime = today.getTime() - dueDate.getTime();
            const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // In a real app, amountPaid would come from the bill object or allocations
            // For now, we assume partially paid bills have this field or calculate it
            const amountPaid = bill.status === 'Paid' ? bill.total_amount : (bill.status === 'Partially Paid' ? bill.total_amount * 0.4 : 0);
            const outstandingAmount = bill.total_amount - amountPaid;

            return {
                id: bill._id || bill.id,
                vendorId: bill.vendor_id,
                vendorName: bill.vendor_name,
                billNumber: bill.bill_number,
                billDate: bill.bill_date,
                dueDate: bill.due_date,
                amount: bill.total_amount,
                amountPaid,
                outstandingAmount,
                daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
                status: bill.status,
                isUrgent: daysOverdue > 5 && outstandingAmount > 0,
                hasDiscount: bill.payment_terms?.toLowerCase().includes('discount'),
                isDisputed: bill.status === 'Disputed'
            };
        }).filter(b => b.outstandingAmount > 0);
    }, [bills]);

    // Filtering logic
    const filteredBills = useMemo(() => {
        return processedBills.filter(bill => {
            const matchesSearch = bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesVendor = !vendorFilter || bill.vendorId === vendorFilter;

            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Overdue' && bill.daysOverdue > 0) ||
                (statusFilter === 'Due Soon' && bill.daysOverdue <= 0 && Math.abs(bill.daysOverdue) <= 7) ||
                (statusFilter === 'Future' && bill.daysOverdue <= 0 && Math.abs(bill.daysOverdue) > 7);

            return matchesSearch && matchesVendor && matchesStatus;
        }).sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'dueDate': comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); break;
                case 'amount': comparison = a.outstandingAmount - b.outstandingAmount; break;
                case 'daysOverdue': comparison = a.daysOverdue - b.daysOverdue; break;
                case 'vendorName': comparison = a.vendorName.localeCompare(b.vendorName); break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [processedBills, searchTerm, statusFilter, vendorFilter, sortBy, sortOrder]);

    // Vendor-wise summary
    const vendorSummary = useMemo(() => {
        const summary: Record<string, { vendorId: string, vendorName: string, total: number, overdue: number, count: number }> = {};
        processedBills.forEach(bill => {
            if (!summary[bill.vendorId]) {
                summary[bill.vendorId] = { vendorId: bill.vendorId, vendorName: bill.vendorName, total: 0, overdue: 0, count: 0 };
            }
            summary[bill.vendorId].total += bill.outstandingAmount;
            if (bill.daysOverdue > 0) summary[bill.vendorId].overdue += bill.outstandingAmount;
            summary[bill.vendorId].count += 1;
        });
        return Object.values(summary).sort((a, b) => b.total - a.total);
    }, [processedBills]);

    // Aging Buckets
    const agingAnalysis = useMemo(() => {
        const buckets = {
            current: 0,
            '1-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
        };
        processedBills.forEach(bill => {
            if (bill.daysOverdue <= 0) buckets.current += bill.outstandingAmount;
            else if (bill.daysOverdue <= 30) buckets['1-30'] += bill.outstandingAmount;
            else if (bill.daysOverdue <= 60) buckets['31-60'] += bill.outstandingAmount;
            else if (bill.daysOverdue <= 90) buckets['61-90'] += bill.outstandingAmount;
            else buckets['90+'] += bill.outstandingAmount;
        });
        return buckets;
    }, [processedBills]);

    const totalPayable = useMemo(() => processedBills.reduce((acc, b) => acc + b.outstandingAmount, 0), [processedBills]);
    const totalOverdue = useMemo(() => processedBills.filter(b => b.daysOverdue > 0).reduce((acc, b) => acc + b.outstandingAmount, 0), [processedBills]);

    // Export Functions
    const exportToExcel = () => {
        const data = filteredBills.map(b => ({
            'Vendor Name': b.vendorName,
            'Bill Number': b.billNumber,
            'Bill Date': b.billDate,
            'Due Date': b.dueDate,
            'Total Amount': b.amount,
            'Amount Paid': b.amountPaid,
            'Outstanding': b.outstandingAmount,
            'Days Overdue': b.daysOverdue,
            'Status': b.status
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Payables');
        XLSX.writeFile(wb, `Outstanding_Payables_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.info("Excel report generated successfully");
    };

    const printReport = () => {
        const doc = new jsPDF() as any;
        doc.setFontSize(18);
        doc.text('Outstanding Payables Report', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Payable: ${totalPayable.toFixed(2)} | Total Overdue: ${totalOverdue.toFixed(2)}`, 14, 38);

        const tableData = filteredBills.map(b => [
            b.vendorName,
            b.billNumber,
            b.dueDate,
            b.outstandingAmount.toFixed(2),
            b.daysOverdue
        ]);

        doc.autoTable({
            startY: 45,
            head: [['Vendor', 'Bill #', 'Due Date', 'Outstanding', 'Overdue Days']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillStyle: [16, 185, 129] }
        });

        doc.save(`Payables_Report_${new Date().getTime()}.pdf`);
        toast.info("PDF report generated successfully");
    };

    const handleQuickPayment = (vendorId: string) => {
        navigate(`/purchase/payments/${vendorId}`);
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Outstanding Payables"
                    description="Advanced tracking and aging analysis for supplier liabilities"
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={exportToExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-600 transition-all shadow-sm"
                            >
                                <FileSpreadsheet size={16} /> Export
                            </button>
                            <button
                                onClick={printReport}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm"
                            >
                                <Printer size={16} /> Print
                            </button>
                        </div>
                    }
                />

                {/* KPI Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Liability</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <TrendingUp size={12} className="text-emerald-500" /> Across {processedBills.length} pending bills
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-600">
                                <AlertCircle size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Overdue</span>
                        </div>
                        <div className="text-2xl font-black text-rose-600">₹{totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-[10px] text-rose-500/80 font-bold uppercase tracking-tighter">Immediate Attention Required</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                                <Clock size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due in 7 Days</span>
                        </div>
                        <div className="text-2xl font-black text-amber-600">₹{processedBills.filter(b => b.daysOverdue <= 0 && Math.abs(b.daysOverdue) <= 7).reduce((acc, b) => acc + b.outstandingAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-medium italic">Payment run preparation recommended</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                <Building2 size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Vendors</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">
                            {vendorSummary.filter(v => v.overdue > 0).length}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400 font-medium">With overdue balances</div>
                    </div>
                </div>

                {/* Aging Analysis Bar */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500" /> Payables Aging Profile
                        </h3>
                        <div className="flex gap-4">
                            {Object.entries(agingAnalysis).map(([key, val]) => (
                                <div key={key} className="text-right">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{key}</div>
                                    <div className="text-[11px] font-black text-slate-700 dark:text-slate-200">₹{val.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(agingAnalysis.current / totalPayable) * 100}%` }} title="Current" />
                        <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(agingAnalysis['1-30'] / totalPayable) * 100}%` }} title="1-30 Days" />
                        <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(agingAnalysis['31-60'] / totalPayable) * 100}%` }} title="31-60 Days" />
                        <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(agingAnalysis['61-90'] / totalPayable) * 100}%` }} title="61-90 Days" />
                        <div className="h-full bg-slate-900 transition-all duration-500" style={{ width: `${(agingAnalysis['90+'] / totalPayable) * 100}%` }} title="90+ Days" />
                    </div>
                    <div className="mt-4 flex justify-center gap-6">
                        {[
                            { label: 'Current', color: 'bg-emerald-500' },
                            { label: '1-30 Days', color: 'bg-amber-400' },
                            { label: '31-60 Days', color: 'bg-orange-500' },
                            { label: '61-90 Days', color: 'bg-rose-500' },
                            { label: '90+ Days', color: 'bg-slate-900' }
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters & View Switcher */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('bill-wise')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'bill-wise' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Bill-wise
                        </button>
                        <button
                            onClick={() => setViewMode('vendor-wise')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'vendor-wise' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Vendor-wise
                        </button>
                    </div>

                    <div className="flex gap-2 flex-grow max-w-4xl">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Vendor / Bill #..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Due Soon">Due Soon</option>
                            <option value="Future">Future Dues</option>
                        </select>

                        <select
                            value={vendorFilter}
                            onChange={(e) => setVendorFilter(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none max-w-[200px]"
                        >
                            <option value="">All Vendors</option>
                            {suppliers.map(s => <option key={s._id} value={s._id}>{s.businessName}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main List Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            {viewMode === 'bill-wise' ? (
                                <>
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-600" onClick={() => { setSortBy('vendorName'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                                                    Vendor / Bill Details <ArrowUpDown size={12} />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-600" onClick={() => { setSortBy('dueDate'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                                                    Due Logistics <ArrowUpDown size={12} />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">
                                                <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-emerald-600" onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                                                    Financials <ArrowUpDown size={12} />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Settlement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filteredBills.map((bill) => (
                                            <tr key={bill.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${bill.isUrgent ? 'bg-rose-50/20 dark:bg-rose-950/5' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl ${bill.isUrgent ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} flex items-center justify-center transition-colors`}>
                                                            <Building2 size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                                {bill.vendorName}
                                                                {bill.isUrgent && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] rounded uppercase font-bold animate-pulse">Critical</span>}
                                                                {bill.isDisputed && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] rounded uppercase font-bold">On Hold</span>}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                                                <span className="font-bold text-emerald-600">#{bill.billNumber}</span>
                                                                <span>•</span>
                                                                <span>{new Date(bill.billDate).toLocaleDateString()}</span>
                                                                {bill.hasDiscount && <span className="flex items-center gap-0.5 text-amber-500 font-bold"><TrendingUp size={10} /> Discount Eligible</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`text-[10px] font-bold uppercase ${bill.daysOverdue > 0 ? 'text-rose-500' : bill.daysOverdue > -7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                {bill.daysOverdue > 0 ? `${bill.daysOverdue} Days Overdue` : `${Math.abs(bill.daysOverdue)} Days Left`}
                                                            </div>
                                                            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${bill.daysOverdue > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                    style={{ width: `${Math.min(100, Math.abs(bill.daysOverdue) * 3)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 font-medium">Due: {new Date(bill.dueDate).toLocaleDateString()}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">₹{bill.outstandingAmount.toFixed(2)}</div>
                                                    <div className="text-[9px] text-slate-400 font-medium line-through decoration-slate-300">Total: ₹{bill.amount.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleQuickPayment(bill.vendorId)}
                                                        className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                                                    >
                                                        Pay Now
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            ) : (
                                <>
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Vendor Identity</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Open Bills</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Overdue Bal.</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Total Outstanding</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {vendorSummary.map((v) => (
                                            <tr key={v.vendorName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                            <Building2 size={20} />
                                                        </div>
                                                        <div className="text-xs font-black text-slate-800 dark:text-white uppercase">{v.vendorName}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg">{v.count} Items</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`text-sm font-black ${v.overdue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>₹{v.overdue.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">₹{v.total.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleQuickPayment(v.vendorId)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Settle All Balances"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>
                </div>

                {/* Empty State */}
                {filteredBills.length === 0 && (
                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-300">
                                <Search size={32} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">No matching payables</h3>
                                <p className="text-xs text-slate-400 mt-1">Adjust your filters or search terms to find what you're looking for.</p>
                            </div>
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('All'); setVendorFilter(''); }}
                                className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest px-4 py-2 border border-emerald-200 rounded-lg"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                    <div>Showing {filteredBills.length} of {processedBills.length} Outstanding Items</div>
                    <div className="flex items-center gap-2">
                        System Last Updated: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default OutstandingPayables;

