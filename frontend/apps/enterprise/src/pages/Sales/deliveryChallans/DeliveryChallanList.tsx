import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from "@/app/store/store";
import { toast } from 'react-toastify';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import { getAllDeliveryChallans, deleteDeliveryChallan, convertToInvoice, reset } from "@/entities/sales/model/deliveryChallanSlice";
import { RootState } from "@/app/store/store";
import {
    Truck,
    Plus,
    Search,
    Eye,
    Trash2,
    FileText,
    CheckCircle,
    Clock,
    ArrowRightCircle,
    Package,
    TrendingUp,
    Filter,
    ArrowUpRight,
    Printer,
    AlertCircle,
    Boxes
} from 'lucide-react';

const DeliveryChallanList: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { challans, isLoading, isError, message } = useSelector((state: RootState) => state.deliveryChallan);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [convertConfirm, setConvertConfirm] = useState<string | null>(null);

    useEffect(() => {
        dispatch(getAllDeliveryChallans() as any);
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
        return () => {
            dispatch(reset());
        };
    }, [isError, message, dispatch]);

    const handleDelete = async (id: string) => {
        await dispatch(deleteDeliveryChallan(id) as any);
        setDeleteConfirm(null);
        toast.success('Delivery Challan deleted successfully');
        dispatch(getAllDeliveryChallans() as any);
    };

    const handleConvert = async (id: string) => {
        const result = await dispatch(convertToInvoice(id) as any);
        setConvertConfirm(null);

        if (result.type.includes('fulfilled')) {
            toast.success('Converted to Invoice successfully!');
            const payload = result.payload as any;
            if (payload?.invoice?._id) {
                navigate(`/sales/invoice/${payload.invoice._id}`);
            }
        }
    };

    // KPI calculations
    const challanArray = Array.isArray(challans) ? challans : [];
    const totalChallans = challanArray.length;
    const deliveredCount = challanArray.filter(c => c.status === 'Delivered').length;
    const convertedCount = challanArray.filter(c => c.status === 'Converted').length;
    const draftCount = challanArray.filter(c => c.status === 'Draft').length;

    const filteredChallans = challanArray.filter(challan => {
        const matchesSearch = challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (challan.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || challan.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Converted':
                return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle };
            case 'Delivered':
                return { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: Truck };
            case 'Draft':
                return { bg: 'bg-neutral-500/10', text: 'text-neutral-500', icon: Clock };
            default:
                return { bg: 'bg-neutral-500/10', text: 'text-neutral-500', icon: FileText };
        }
    };

    if (isLoading && (!challans || challans.length === 0)) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Syncing Logistics Matrix...</p>
                </PageShell>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Supply Chain Node</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Fulfillment Ledger</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Delivery Logistics <Truck className="w-8 h-8 text-blue-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Monitoring and verification of physical inventory relocation cycles.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="p-4 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-2xl text-neutral-500 hover:bg-neutral-50 transition-all shadow-sm"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => {
                                dispatch(reset());
                                navigate('/sales/delivery-challan');
                            }}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Initiate Challan</span>
                        </button>
                    </div>
                </div>

                {/* Logistics KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Challans', value: totalChallans, icon: Boxes, color: 'indigo', status: 'Global Flux' },
                        { label: 'In-Transit / Delivered', value: deliveredCount, icon: Truck, color: 'blue', sub: 'Velocity Optimal' },
                        { label: 'Finalized Invoices', value: convertedCount, icon: CheckCircle, color: 'emerald', trend: 'Revenue Sync' },
                        { label: 'Draft Nodes', value: draftCount, icon: Clock, color: 'amber', alert: draftCount > 5 }
                    ].map((kpi, i) => (
                        <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <kpi.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">{kpi.label}</p>
                                    <h3 className={`text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic`}>
                                        {kpi.value}
                                    </h3>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    {kpi.sub && (
                                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{kpi.sub}</p>
                                    )}
                                    {kpi.trend && (
                                        <div className="flex items-center gap-1.5 text-emerald-500 font-black uppercase tracking-widest text-[8px]">
                                            <TrendingUp className="w-2.5 h-2.5" /> {kpi.trend}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full bg-${kpi.color}-500 animate-pulse`} />
                                        <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${kpi.alert ? 'text-rose-500' : 'text-neutral-400'}`}>
                                            {kpi.status || (kpi.alert ? 'Action Required' : 'State Nominal')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Logistics Operations Island */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    {/* Advanced Logistics Matrix Filter */}
                    <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
                        {/* Search Component */}
                        <div className="relative w-full lg:max-w-xl group/search">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Intercept by Challan ID or Entity Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-neutral-900 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                            />
                        </div>

                        {/* State & Protocol Matrix */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                                <Filter className="w-4 h-4 text-neutral-400 ml-3" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                                >
                                    <option value="all">Global States</option>
                                    <option value="Draft">Draft Protocol</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Converted">Finalized (Inv)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Fulfillment Matrix Display */}
                    <div className="overflow-x-auto px-2">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-2">Challan Identification</th>
                                    <th className="px-8 py-2">Entity Participant</th>
                                    <th className="px-8 py-2 text-center">Payload</th>
                                    <th className="px-8 py-2">Status Node</th>
                                    <th className="px-8 py-2 text-right">Command Console</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChallans.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] mb-6 text-neutral-200 animate-in zoom-in duration-500">
                                                    <Truck className="w-16 h-16" />
                                                </div>
                                                <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Logistics Null</h3>
                                                <p className="text-sm font-bold text-neutral-500 mt-2 italic max-w-sm">
                                                    Zero relocation signals detected in current matrix range.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredChallans.map((challan) => {
                                        const config = getStatusConfig(challan.status);
                                        const StatusIcon = config.icon;
                                        return (
                                            <tr 
                                                key={challan._id}
                                                className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-default"
                                            >
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 group-hover/row:shadow-xl group-hover/row:shadow-blue-500/5 transition-all relative overflow-hidden">
                                                        <div className="relative z-10">
                                                            <button
                                                                onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                                                className="text-lg font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter italic hover:opacity-70 transition-opacity"
                                                            >
                                                                {challan.challanNumber}
                                                            </button>
                                                            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic">
                                                                {new Date(challan.challanDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/row:opacity-10 transition-opacity">
                                                            <Truck className="w-12 h-12" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                        <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-1">
                                                            {challan.customer?.name || 'Anonymous Sector'}
                                                        </p>
                                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">
                                                            {challan.customer?.phone || 'No Dial Signal'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1 text-center">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-indigo-500 italic text-lg">
                                                        {(challan.items || []).length} Units
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${config.bg} ${config.text} border-current/10`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {challan.status}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1 text-right">
                                                    <div className="flex justify-end gap-3 pr-4">
                                                        <button
                                                            onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                                            className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 group/eye"
                                                        >
                                                            <Eye className="w-5 h-5 group-hover/eye:scale-110 transition-transform" />
                                                        </button>
                                                        {challan.status !== 'Converted' && (
                                                            <>
                                                                <button
                                                                    onClick={() => setConvertConfirm(challan._id)}
                                                                    className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 group/convert"
                                                                >
                                                                    <ArrowRightCircle className="w-5 h-5 group-hover/convert:rotate-90 transition-transform" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(challan._id)}
                                                                    className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 group/trash"
                                                                >
                                                                    <Trash2 className="w-5 h-5 group-hover/trash:scale-110 transition-transform" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Logistics Matrix Footer */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-20">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Logistics Integrity Verified • Sequence Scanning {challans.length} Nodes</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>

            {/* Delete Confirmation Matrix */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 rounded-[3rem] p-10 max-w-md w-full mx-4 shadow-2xl border border-rose-500/20 group/modal">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-6 group-hover/modal:scale-110 transition-transform">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-main tracking-tighter uppercase mb-4 italic">Neuralized Confirmation</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-8 italic">
                            Instructing the system to delete this delivery challan. Stock displacement will be reverted across the global supply chain.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-6 py-4 border border-default rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                            >
                                Abort
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                Confirm Erase
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Convert Protocol Modal */}
            {convertConfirm && (
                <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 rounded-[3rem] p-10 max-w-md w-full mx-4 shadow-2xl border border-emerald-500/20 group/modal">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover/modal:scale-110 transition-transform">
                            <ArrowRightCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-main tracking-tighter uppercase mb-4 italic">Protocol Shift</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-8 italic">
                            Executing transition from Logistics Challan to Fiscal Invoice. This action finalizes the relocation record into the accounting matrix.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setConvertConfirm(null)}
                                className="flex-1 px-6 py-4 border border-default rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConvert(convertConfirm)}
                                className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                Execute Sync
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default DeliveryChallanList;
