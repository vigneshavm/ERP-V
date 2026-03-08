import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Layout from "../../../components/shared/Layout/Layout";
import { getAllDeliveryChallans, deleteDeliveryChallan, convertToInvoice, reset } from "../../../redux/slices/deliveryChallanSlice";
import { RootState } from "../../../redux/store";
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
    ShieldCheck,
    Activity,
    Zap,
    ArrowUpRight,
    TrendingUp,
    Navigation,
    Layers,
    History
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
            toast.error(message || "Protocol decryption failure");
        }
        return () => {
            dispatch(reset());
        };
    }, [isError, message, dispatch]);

    const handleDelete = async (id: string) => {
        await dispatch(deleteDeliveryChallan(id) as any);
        setDeleteConfirm(null);
        toast.success('Protocol Purged: Manifest alignment successful');
        dispatch(getAllDeliveryChallans() as any);
    };

    const handleConvert = async (id: string) => {
        const result = await dispatch(convertToInvoice(id) as any);
        setConvertConfirm(null);

        if (result.type.includes('fulfilled')) {
            toast.success('Protocol Success: Revenue Certificate Generated');
            const payload = result.payload as any;
            if (payload?.invoice?._id) {
                navigate(`/sales/invoice/${payload.invoice._id}`);
            }
        }
    };

    const challanArray = Array.isArray(challans) ? challans : [];
    const totalItems = challanArray.reduce((sum, c) => sum + (c.items?.length || 0), 0);

    const filteredChallans = challanArray.filter(challan => {
        const matchesSearch = (challan.challanNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (challan.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || challan.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const GlassPanel = ({ children, className = "" }: any) => (
        <div className={`glass-panel border border-white/5 shadow-2xl overflow-hidden ${className}`}>
            {children}
        </div>
    );

    if (isLoading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Syncing Logistics Registry...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48 opacity-30"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em]">
                                <ShieldCheck className="w-4 h-4" />
                                Operational Protocol: 2036.04
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter uppercase">
                                Logistics <span className="text-emerald-500 italic">Registry</span>
                            </h1>
                            <p className="text-secondary text-sm font-medium opacity-60">Real-time centralized registry for all fulfillment manifests and asset movement protocols.</p>
                        </div>

                        <button
                            onClick={() => {
                                dispatch(reset());
                                navigate('/sales/delivery-challan');
                            }}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4"
                        >
                            <Plus className="w-5 h-5" />
                            Initiate Fulfillment
                        </button>
                    </div>

                    {/* KPI Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Asset Magnitude', value: totalItems, icon: Box, color: 'emerald' },
                            { label: 'Manifest registry', value: challanArray.length, icon: History, color: 'slate' },
                            { label: 'Logistics Integrity', value: '98.4%', icon: Navigation, color: 'emerald' }
                        ].map((kpi, idx) => (
                            <GlassPanel key={idx} className="relative group overflow-hidden p-8">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                    <kpi.icon className="w-24 h-24 text-emerald-500" />
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">{kpi.label}</div>
                                    <div className="text-3xl font-display font-black text-main tracking-tighter">{kpi.value}</div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                        <Activity className="w-3 h-3" />
                                        Protocol Synchronized
                                    </div>
                                </div>
                            </GlassPanel>
                        ))}
                    </div>

                    {/* Control Hub */}
                    <GlassPanel className="p-4">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full lg:w-auto overflow-hidden group/search">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40 group-focus-within/search:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SCAN FOR MANIFEST HASH OR COUNTERPARTY MARKS..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-[10px] font-black tracking-[0.2em] text-main placeholder:text-secondary/20 focus:outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                />
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-secondary uppercase tracking-widest focus:outline-none focus:border-emerald-500/40 appearance-none flex-1 lg:flex-none cursor-pointer min-w-[180px]"
                                >
                                    <option value="all" className="bg-neutral-900">All Status Flags</option>
                                    <option value="Draft" className="bg-neutral-900">Draft Status</option>
                                    <option value="Delivered" className="bg-neutral-900">Delivered</option>
                                    <option value="Converted" className="bg-neutral-900">Converted</option>
                                </select>
                            </div>
                        </div>
                    </GlassPanel>

                    {/* Registry Table */}
                    <GlassPanel className="p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Protocol Index</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Date Marker</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Counterparty</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-center">Asset Magnitude</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredChallans.map((challan) => (
                                        <tr key={challan._id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6">
                                                <button 
                                                    onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                                    className="text-xs font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-tight flex items-center gap-2"
                                                >
                                                    {challan.challanNumber}
                                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                </button>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-[10px] font-bold text-secondary uppercase tracking-tight">
                                                    {new Date(challan.challanDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-[10px] font-black text-main uppercase tracking-widest">
                                                    {challan.customer?.name || 'Walk-in Counterparty'}
                                                </div>
                                                {challan.customer?.phone && <div className="text-[8px] font-bold text-secondary/40 mt-1 uppercase italic">{challan.customer.phone}</div>}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-black text-main">
                                                    {(challan.items || []).length} ASSETS
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                    challan.status === 'Converted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                                                    challan.status === 'Delivered' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                }`}>
                                                    {challan.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                                        className="p-3 hover:bg-white/10 rounded-xl text-secondary hover:text-main transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {challan.status !== 'Converted' && (
                                                        <>
                                                            <button 
                                                                onClick={() => setConvertConfirm(challan._id)}
                                                                className="p-3 hover:bg-emerald-500/10 rounded-xl text-emerald-500 transition-colors"
                                                            >
                                                                <ArrowRightCircle className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeleteConfirm(challan._id)}
                                                                className="p-3 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassPanel>
                </div>
            </div>

            {/* Modals */}
             <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm glass-panel border border-rose-500/20 p-8 shadow-2xl relative z-10 text-center">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-display font-black text-main uppercase tracking-tight mb-2">Registry Purge?</h2>
                            <p className="text-xs text-secondary opacity-60 mb-8 lowercase tracking-wide">This action will restore associated assets and retrieve this manifest permanently.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest hover:text-main transition-all">Abort</button>
                                <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 shadow-xl shadow-rose-900/20 transition-all">Purge</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {convertConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConvertConfirm(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm glass-panel border border-emerald-500/20 p-8 shadow-2xl relative z-10 text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ArrowRightCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-display font-black text-main uppercase tracking-tight mb-2">Revenue Sync?</h2>
                            <p className="text-xs text-secondary opacity-60 mb-8 lowercase tracking-wide">Are you prepared to convert this fulfillment protocol into a finalized revenue certificate?</p>
                            <div className="flex gap-4">
                                <button onClick={() => setConvertConfirm(null)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest hover:text-main transition-all">Abort</button>
                                <button onClick={() => convertConfirm && handleConvert(convertConfirm)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 transition-all">Synchronize</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border-radius: 2rem; }
                .font-display { font-family: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );
};

export default DeliveryChallanList;
