import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getAllDeliveryChallans, deleteDeliveryChallan, convertToInvoice, reset } from "../../../redux/slices/deliveryChallanSlice";
import { RootState } from "../../../redux/store";
import {
    Truck,
    Plus,
    Search,
    Eye,
    Trash2,
    FileText,
    CheckCircle2,
    Clock,
    ArrowRightCircle,
    Package,
    RefreshCw,
    Calendar,
    User,
    ShieldCheck,
    Zap,
    Download,
    TrendingUp,
    Briefcase,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';

const DeliveryChallanList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
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
        toast.success('Protocol purged from registry');
        dispatch(getAllDeliveryChallans() as any);
    };

    const handleConvert = async (id: string) => {
        const result = await dispatch(convertToInvoice(id) as any);
        setConvertConfirm(null);

        if (result.type.includes('fulfilled')) {
            toast.success('Protocol transitioned to Fiscal Invoice');
            const payload = result.payload as any;
            if (payload?.invoice?._id) {
                navigate(`/sales/invoice/${payload.invoice._id}`);
            }
        }
    };

    const challanArray = Array.isArray(challans) ? challans : [];

    const metrics = useMemo(() => {
        const total = challanArray.length;
        const delivered = challanArray.filter(c => c.status === 'Delivered').length;
        const converted = challanArray.filter(c => c.status === 'Converted').length;
        const draft = challanArray.filter(c => c.status === 'Draft').length;
        return { total, delivered, converted, draft };
    }, [challanArray]);

    const filteredChallans = useMemo(() => {
        return challanArray.filter(challan => {
            const matchesSearch = challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (challan.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || challan.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [challanArray, searchTerm, statusFilter]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Converted':
                return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2, text: 'FISCAL CONVERTED' };
            case 'Delivered':
                return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Truck, text: 'DISPATCHED' };
            default:
                return { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock, text: 'DRAFT PROTOCOL' };
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-x-hidden flex flex-col transition-colors animate-fade-in relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8">
                {/* Modern Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Delivery <span className="text-amber-500">Challans</span>
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                                Dispatch Matrix
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Logistics Pipeline Active // Status: Ready</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => dispatch(getAllDeliveryChallans() as any)}
                            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:scale-110 transition-transform shadow-sm group"
                        >
                            <RefreshCw className={`w-4 h-4 text-neutral-500 group-hover:text-amber-500 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
                        </button>
                        <button
                            onClick={() => {
                                dispatch(reset());
                                navigate('/sales/delivery-challan');
                            }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                        >
                            <Plus className="w-4 h-4" /> Initialize Dispatch
                        </button>
                    </div>
                </header>

                {/* Industrial KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Protocols', value: metrics.total, icon: Package, color: 'text-neutral-500', trend: 'Global', detail: 'Gross Dispatch Count' },
                        { label: 'Active Dispatches', value: metrics.delivered, icon: Truck, color: 'text-blue-500', trend: 'Live', detail: 'Fulfillment Active' },
                        { label: 'Fiscal Transitions', value: metrics.converted, icon: CheckCircle2, color: 'text-emerald-500', trend: 'Verified', detail: 'Invoiced Protocols' },
                        { label: 'Pending Drafts', value: metrics.draft, icon: Clock, color: 'text-amber-500', trend: 'Draft', detail: 'Matrix Initialized' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm group hover:border-amber-500/30 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-500/5 to-transparent rounded-bl-[100px]"></div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${stat.color.replace('text', 'bg')}/10 ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                        {stat.trend}
                                    </span>
                                </div>
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
                                <div className="text-3xl font-display font-black text-neutral-900 dark:text-white tracking-tighter mt-auto">
                                    {stat.value}
                                </div>
                                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-2">{stat.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Institutional Data Matrix */}
                <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
                    {/* Matrix Control Bar */}
                    <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
                        <div className="relative w-full md:max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 group-focus-within:scale-110 transition-transform" />
                            <input
                                type="text"
                                placeholder="Scan Matrix (Challan #, Entity...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold focus:border-amber-500/50 outline-none transition-all dark:text-white shadow-inner"
                            />
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-1.5 rounded-2xl">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none text-neutral-500 dark:text-neutral-400 cursor-pointer"
                                >
                                    <option value="all">All Dispatch Protocols</option>
                                    <option value="Draft">Draft Protocols</option>
                                    <option value="Delivered">Delivered / Active</option>
                                    <option value="Converted">Fiscal Transitions</option>
                                </select>
                            </div>
                            <button className="p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:text-amber-500 transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Data Matrix */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-950/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Protocol Node</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Customer Entity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Operational Log</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 text-center">Manifest Qty</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Status Protocol</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] animate-pulse">Syncing Dispatch Matrix...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredChallans.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-neutral-300 dark:text-neutral-700">
                                                <FileText className="w-16 h-16 opacity-20" />
                                                <p className="text-xs font-black uppercase tracking-widest">Dispatch Matrix Empty</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredChallans.map((challan) => (
                                        <tr 
                                            key={challan._id} 
                                            className="group hover:bg-amber-500/[0.02] transition-colors cursor-pointer"
                                            onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">{challan.challanNumber}</span>
                                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">ID: {challan._id?.slice(-8).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{challan.customer?.name || 'Unknown Entity'}</span>
                                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{challan.customer?.phone || 'No Contact Data'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar className="w-3 h-3 text-amber-500" /> {new Date(challan.challanDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                                        <Clock className="w-3 h-3" /> Log: {new Date(challan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {(challan.items || []).length} Units
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {(() => {
                                                    const config = getStatusConfig(challan.status);
                                                    const Icon = config.icon;
                                                    return (
                                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${config.bg} ${config.color} border border-${config.color.split('-')[1]}-500/20 shadow-sm`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{config.text}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/sales/delivery-challan/${challan._id}`); }}
                                                        className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                        title="Matrix View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {challan.status !== 'Converted' && (
                                                        <>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setConvertConfirm(challan._id); }}
                                                                className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                                title="Fiscal Transition"
                                                            >
                                                                <ArrowRightCircle className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(challan._id); }}
                                                                className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                                title="Purge Node"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Matrix Status Bar */}
                    <div className="p-8 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-200 dark:bg-neutral-800 overflow-hidden shadow-xl shadow-black/5 flex items-center justify-center">
                                        <User className="w-5 h-5 text-neutral-400" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">Active Dispatch Fleet</span>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Protocol v4.0 // Logistic Stable</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Operational Pulse</span>
                                <div className="w-48 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden shadow-inner">
                                    <div className="w-[92%] h-full bg-emerald-500 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <button className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-black/5">
                                <ShieldCheck className="w-4 h-4 text-amber-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-[100px]" />
                        <div className="relative z-10 text-center">
                            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-display font-black text-neutral-900 dark:text-white uppercase tracking-tight mb-2">Purge Protocol?</h3>
                            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8 leading-relaxed">
                                Are you sure you want to purge this dispatch protocol? Logistical data will be permanently erased.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-6 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="px-6 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                                >
                                    Purge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Convert Confirmation Modal */}
            {convertConfirm && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px]" />
                        <div className="relative z-10 text-center">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <ArrowRight className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-display font-black text-neutral-900 dark:text-white uppercase tracking-tight mb-2">Transition Protocol?</h3>
                            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8 leading-relaxed">
                                Transition this dispatch protocol to a Fiscal Invoice? This will lock the logistical matrix.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setConvertConfirm(null)}
                                    className="px-6 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleConvert(convertConfirm)}
                                    className="px-6 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    Transition
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryChallanList;
