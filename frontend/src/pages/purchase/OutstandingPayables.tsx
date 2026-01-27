import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../redux/store';
import { useBranchResolver } from '../../hooks/useBranchResolver';
import {
    Search,
    AlertTriangle,
    Clock,
    DollarSign,
    Building2,
    Calendar,
    Download,
    Bell,
    ChevronRight,
    ArrowUpRight,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { getAllPurchases } from '../../redux/slices/purchaseSlice';
import { getAllSuppliers } from '../../redux/slices/supplierSlice';

interface OutstandingPayable {
    id: string;
    vendorId: string;
    supplierName: string;
    orderNo: string;
    orderDate: string;
    dueDate: string;
    amount: number;
    daysOverdue: number;
    isUrgent: boolean;
}

const OutstandingPayables: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { orders } = useSelector((state: RootState) => state.purchase);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { getBranchName } = useBranchResolver();

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(getAllPurchases());
        dispatch(getAllSuppliers());
    }, [dispatch]);

    // Process orders into aged payables
    const agedData = useMemo(() => {
        const today = new Date();
        const buckets: Record<string, { totalAmount: number; suppliers: OutstandingPayable[] }> = {
            'Overdue': { totalAmount: 0, suppliers: [] },
            '1-30 Days': { totalAmount: 0, suppliers: [] },
            '31-60 Days': { totalAmount: 0, suppliers: [] },
            '60+ Days': { totalAmount: 0, suppliers: [] }
        };

        orders
            .filter(o => o.status === 'COMPLETED' || o.status === 'APPROVED')
            .forEach(order => {
                const vendor = suppliers.find(v => v._id === order.vendorId);
                const invoiceDate = new Date(order.date);
                const creditPeriod = vendor?.creditPeriod || 30;

                const dueDate = order.dueDate ? new Date(order.dueDate) : new Date(invoiceDate);
                if (!order.dueDate) {
                    dueDate.setDate(dueDate.getDate() + creditPeriod);
                }

                const diffTime = today.getTime() - dueDate.getTime();
                const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const amount = order.totalAmount || order.total || 0;

                const payable: OutstandingPayable = {
                    id: order._id,
                    vendorId: order.vendorId,
                    supplierName: vendor?.businessName || order.vendor || 'Unknown Supplier',
                    orderNo: order.purchaseNumber || order.invoiceNo || 'N/A',
                    orderDate: order.date,
                    dueDate: dueDate.toISOString(),
                    amount,
                    daysOverdue,
                    isUrgent: daysOverdue > 7 || (daysOverdue > 0 && amount > 50000)
                };

                if (daysOverdue > 0) {
                    buckets['Overdue'].suppliers.push(payable);
                    buckets['Overdue'].totalAmount += amount;
                } else if (Math.abs(daysOverdue) <= 30) {
                    buckets['1-30 Days'].suppliers.push(payable);
                    buckets['1-30 Days'].totalAmount += amount;
                } else if (Math.abs(daysOverdue) <= 60) {
                    buckets['31-60 Days'].suppliers.push(payable);
                    buckets['31-60 Days'].totalAmount += amount;
                } else {
                    buckets['60+ Days'].suppliers.push(payable);
                    buckets['60+ Days'].totalAmount += amount;
                }
            });

        // Sort each bucket by urgency/amount
        Object.keys(buckets).forEach(key => {
            buckets[key].suppliers.sort((a, b) => b.daysOverdue - a.daysOverdue || b.amount - a.amount);
        });

        return buckets;
    }, [orders, suppliers]);

    const totalPayable = useMemo(() => {
        return Object.values(agedData).reduce((acc, curr) => acc + curr.totalAmount, 0);
    }, [agedData]);

    const filteredAgedData = useMemo(() => {
        if (!searchTerm) return agedData;
        const filtered: typeof agedData = {};
        const search = searchTerm.toLowerCase();

        Object.keys(agedData).forEach(key => {
            const matches = agedData[key].suppliers.filter(s =>
                s.supplierName.toLowerCase().includes(search) ||
                s.orderNo.toLowerCase().includes(search)
            );
            if (matches.length > 0) {
                filtered[key] = {
                    totalAmount: matches.reduce((acc, curr) => acc + curr.amount, 0),
                    suppliers: matches
                };
            }
        });
        return filtered;
    }, [agedData, searchTerm]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Outstanding Payables"
                    description="Monitor and manage unpaid supplier invoices and upcoming dues"
                    actions={
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search Supplier / Invoice..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-64 transition-all"
                                />
                            </div>
                            <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors">
                                <Download size={18} />
                            </button>
                        </div>
                    }
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 text-emerald-600 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <DollarSign size={18} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Total Payable</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">₹{totalPayable.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Across all approved vendors</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 text-rose-600 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                <AlertCircle size={18} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">
                            ₹{(agedData['Overdue']?.totalAmount || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-rose-500 font-bold mt-1">Immediate Action Required</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 text-amber-600 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Clock size={18} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Due Soon</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">
                            ₹{(agedData['1-30 Days']?.totalAmount || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Payable within 30 days</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 text-indigo-600 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Calendar size={18} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Total Suppliers</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">{suppliers.length}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Active credit lines</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Supplier/Order Detail</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Aging Profile</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Pending Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {Object.keys(filteredAgedData).map(bucket => (
                                    <React.Fragment key={bucket}>
                                        {filteredAgedData[bucket].suppliers.length > 0 && (
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                                <td colSpan={4} className="px-6 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${bucket === 'Overdue' ? 'bg-rose-500 animate-pulse' :
                                                            bucket === '1-30 Days' ? 'bg-amber-500' :
                                                                'bg-slate-400'
                                                            }`} />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bucket} Summary</span>
                                                        <span className="text-[10px] font-bold text-slate-400 ml-auto">Total: ₹{filteredAgedData[bucket].totalAmount.toFixed(2)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {filteredAgedData[bucket].suppliers.map((item) => {
                                            return (
                                                <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${item.isUrgent ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                                <Building2 size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                                    {item.supplierName}
                                                                    {item.isUrgent && (
                                                                        <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-[8px] rounded uppercase font-bold">Urgent</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 mt-0.5">Ref: {item.orderNo} | {new Date(item.orderDate).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`text-[10px] font-bold uppercase ${item.daysOverdue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                    {item.daysOverdue > 0 ? `${item.daysOverdue} Days Overdue` : `${Math.abs(item.daysOverdue)} Days Remaining`}
                                                                </div>
                                                                <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${item.daysOverdue > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                        style={{ width: `${Math.min(100, Math.abs(item.daysOverdue) * 2)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="text-[9px] text-slate-400 font-medium">Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-sm font-black text-slate-800 dark:text-white">₹{item.amount.toFixed(2)}</div>
                                                        <div className="text-[9px] text-slate-400 font-medium">Net Payable</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                            title="Process Payment"
                                                            onClick={() => navigate('/cashbank/cheques')}
                                                        >
                                                            <ExternalLink size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}

                                {totalPayable === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                                    <Building2 size={32} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">No Pending Liabilities</span>
                                                    <span className="text-xs text-slate-300 mt-1 block font-medium">All supplier accounts is currently balanced.</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="text-center text-xs text-neutral-400">
                    Showing {Object.values(filteredAgedData).reduce((acc, curr) => acc + curr.suppliers.length, 0)} pending payables
                </div>
            </div>
        </Layout>
    );
};

export default OutstandingPayables;
