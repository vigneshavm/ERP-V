import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from "../../../components/shared/Layout/Layout";
import api from "../../../services/api";
import { toast } from 'react-toastify';
import {
    FileText,
    Plus,
    Search,
    Eye,
    Trash2,
    Calculator,
    CheckCircle,
    Clock,
    XCircle,
    ShieldCheck,
    Activity,
    ArrowUpRight,
    TrendingUp,
    ChevronRight,
    Zap,
    History,
    Filter,
    BarChart3,
    ArrowRightLeft,
    Target
} from 'lucide-react';
import { Estimate } from '../../../types/sales';

const EstimateList = () => {
    const navigate = useNavigate();
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchEstimates();
    }, []);

    const fetchEstimates = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const response = await api.get(
                    `/api/estimates`,
                    {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }
                );
                setEstimates(response.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Protocol sync failure');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                await api.delete(
                    `/api/estimates/${id}`,
                    {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }
                );
                toast.success('Resolution purged');
                fetchEstimates();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Purge failed');
        }
    };

    const totalValue = estimates.reduce((sum, est) => sum + (est.totalAmount || 0), 0);
    const acceptedCount = estimates.filter(e => e.status === 'accepted').length;
    const conversionRate = estimates.length ? ((acceptedCount/estimates.length)*100).toFixed(1) : 0;

    const filteredEstimates = estimates.filter((est) => {
        const customerName = typeof est.customer === 'object' && est.customer ? est.customer.name : '';
        const matchesSearch = est.estimateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || est.status === statusFilter;
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
                <div className="flex flex-col items-center justify-center py-64 space-y-8">
                    <div className="relative">
                        <div className="w-20 h-20 border-2 border-indigo-500/20 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                        <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                    <div className="space-y-2 text-center">
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.5em] animate-pulse">Synchronizing Synthesis Registry</p>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Lattice Network Connection: Active</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
                {/* Background High-Fidelity Accents */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-40"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-20"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-10">
                    {/* Master Tactical Header */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-indigo-500 font-black text-[10px] uppercase tracking-[0.5em]">
                                <ShieldCheck className="w-4 h-4" />
                                Operational Protocol: SYNTHESIS_V3
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-5xl md:text-6xl font-display font-black text-main tracking-tighter uppercase leading-none">
                                    Quotation <br />
                                    <span className="text-secondary italic">Synthesis Registry</span>
                                </h1>
                                <p className="text-secondary/60 text-xs font-medium uppercase tracking-widest flex items-center gap-3">
                                    High-fidelity resolution tracking 
                                    <span className="w-1 h-1 bg-indigo-500/40 rounded-full"></span>
                                    {estimates.length} Active Projections
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/sales/estimate')}
                                className="group px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-indigo-900/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4 overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                Initiate Synthesis
                            </button>
                        </div>
                    </div>

                    {/* Intelligence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Aggregated Exposure', value: `₹${totalValue.toLocaleString()}`, icon: TrendingUp, color: 'indigo', trend: '+12.4%' },
                            { label: 'Conversion Velocity', value: `${conversionRate}%`, icon: Zap, color: 'emerald', trend: 'Optimal' },
                            { label: 'Registry Magnitude', value: estimates.length, icon: History, color: 'slate', trend: 'Live' },
                            { label: 'Strategic Reach', value: Array.from(new Set(estimates.map(e => typeof e.customer === 'object' ? e.customer?.name : ''))).length, icon: Target, color: 'indigo', trend: 'Expanding' }
                        ].map((kpi, idx) => (
                            <GlassPanel key={idx} className="relative group overflow-hidden p-8 border border-white/5 hover:border-white/10 transition-all">
                                <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700 text-${kpi.color}-500`}>
                                    <kpi.icon className="w-32 h-32" />
                                </div>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.3em]">{kpi.label}</div>
                                        <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-${kpi.color}-500/10 text-${kpi.color}-500 border border-${kpi.color}-500/20`}>
                                            {kpi.trend}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-3xl font-display font-black text-main tracking-tighter tabular-nums">{kpi.value}</div>
                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-secondary/40">
                                            <Activity className={`w-3 h-3 text-${kpi.color}-500`} />
                                            Lattice Synchronized
                                        </div>
                                    </div>
                                </div>
                                <div className={`absolute top-0 left-0 w-1 h-full bg-${kpi.color}-500/40 group-hover:bg-${kpi.color}-500 transition-colors`}></div>
                            </GlassPanel>
                        ))}
                    </div>

                    {/* Operational Hub Controls */}
                    <GlassPanel className="p-6 bg-white/[0.02]">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full lg:w-auto group/search">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/40 group-focus-within/search:text-indigo-500 group-hover/search:text-indigo-400 transition-all" />
                                <input
                                    type="text"
                                    placeholder="SCAN FOR RESOLUTION HASH OR COUNTERPARTY MARKS..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-[11px] font-black tracking-[0.2em] text-main placeholder:text-secondary/20 focus:outline-none focus:border-indigo-500/40 focus:ring-8 focus:ring-indigo-500/5 transition-all"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-20">
                                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/10 text-[8px] font-black">CTRL</kbd>
                                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/10 text-[8px] font-black">K</kbd>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 w-full lg:w-auto">
                                <div className="relative flex-1 lg:flex-none min-w-[220px]">
                                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/40" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full lg:w-[220px] pl-14 pr-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-secondary uppercase tracking-widest focus:outline-none focus:border-indigo-500/40 focus:ring-8 focus:ring-indigo-500/5 appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="all" className="bg-neutral-900">All Lifecycle Phases</option>
                                        <option value="draft" className="bg-neutral-900">Draft / Projection</option>
                                        <option value="accepted" className="bg-neutral-900">Resolved / Accepted</option>
                                        <option value="rejected" className="bg-neutral-900">Terminated</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-indigo-500/40 rotate-45 mb-1"></div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => fetchEstimates()}
                                    className="p-5 glass-panel border border-white/10 hover:border-indigo-500/30 text-secondary hover:text-indigo-500 transition-all active:rotate-180 duration-500"
                                >
                                    <ArrowRightLeft className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </GlassPanel>

                    {/* Registry Manifest Table */}
                    <GlassPanel className="p-0 border border-white/5 bg-white/[0.01]">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02]">
                                        <th className="px-10 py-6 text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em] italic">Protocol Hash</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em] italic">Counterparty Identification</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em] italic">Temporal Mark</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em] italic text-right">Exposure Value</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em] italic text-center">Lifecycle Phase</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em] italic text-right">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence mode="popLayout">
                                        {filteredEstimates.map((est, idx) => (
                                            <motion.tr 
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={est._id} 
                                                className="group hover:bg-white/[0.03] transition-all cursor-pointer relative"
                                                onClick={() => navigate(`/sales/estimate/${est._id}`)}
                                            >
                                                <td className="px-10 py-8 relative">
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-0 group-hover:h-12 bg-indigo-500 transition-all rounded-r-full"></div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                                            <ShieldCheck className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-main uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                                                                {est.estimateNo}
                                                            </div>
                                                            <div className="text-[8px] font-bold text-secondary/40 uppercase tracking-widest mt-1">
                                                                SYN-{est._id?.substring(0, 8).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-black text-main uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-block">
                                                            {(typeof est.customer === 'object' && est.customer?.name) || 'Walk-in Counterparty'}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-secondary/40 flex items-center gap-2">
                                                            <ChevronRight className="w-3 h-3 text-indigo-500" />
                                                            Commercial Entity Verified
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40"></div>
                                                        <div className="text-[10px] font-black text-secondary/60 uppercase tracking-widest tabular-nums">
                                                            {new Date(est.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="space-y-1">
                                                        <div className="text-lg font-display font-black text-main tracking-tighter tabular-nums leading-none">
                                                            ₹{est.totalAmount?.toLocaleString()}
                                                        </div>
                                                        <div className="text-[8px] font-black text-secondary/40 uppercase tracking-widest">Net Resolution</div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="inline-flex">
                                                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-2xl transition-all group-hover:scale-105 ${
                                                            est.status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-900/10' : 
                                                            est.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-rose-900/10' :
                                                            'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-900/10'
                                                        }`}>
                                                            {est.status === 'accepted' ? 'Resolved / Accepted' : 
                                                             est.status === 'rejected' ? 'Terminated' : 'Draft Projection'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all">
                                                        <button 
                                                            onClick={() => navigate(`/sales/estimate/${est._id}`)}
                                                            className="p-4 hover:bg-indigo-500/10 rounded-2xl text-indigo-500 transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-indigo-500/20"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(est._id || '')}
                                                            className="p-4 hover:bg-rose-500/10 rounded-2xl text-rose-500 transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-rose-500/20"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {filteredEstimates.length === 0 && (
                                <div className="py-32 flex flex-col items-center justify-center space-y-6 opacity-40">
                                    <div className="w-24 h-24 bg-white/5 border border-dashed border-white/20 rounded-full flex items-center justify-center">
                                        <Calculator className="w-10 h-10 text-secondary" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Resolutions Found In Sub-Sector</p>
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-secondary/40">Adjust filter parameters or initiate new synthesis</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassPanel>
                </div>
            </div>

            <style>{`
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border-radius: 2.5rem; }
                .font-display { font-family: 'Outfit', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }
            `}</style>
        </Layout>
    );
};

export default EstimateList;
