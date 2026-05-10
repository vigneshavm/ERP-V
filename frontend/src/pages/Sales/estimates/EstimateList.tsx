import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    ArrowLeft,
    TrendingUp,
    FileCheck,
    AlertCircle,
    Download,
    Filter,
    ChevronRight,
    Calendar,
    Briefcase,
    Zap,
    RefreshCw,
    User
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
        setIsLoading(true);
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
            toast.error(error.response?.data?.message || 'Failed to fetch estimates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Critical: Proceed with estimate deletion protocol?')) return;

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
                toast.success('Estimate purged from system matrix.');
                fetchEstimates();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Deletion protocol failed');
        }
    };

    // KPI calculations
    const stats = useMemo(() => {
        const total = estimates.length;
        const value = estimates.reduce((sum, est) => sum + (est.totalAmount || 0), 0);
        const accepted = estimates.filter(e => e.status === 'accepted').length;
        const conversion = total > 0 ? (accepted / total) * 100 : 0;
        return { total, value, accepted, conversion };
    }, [estimates]);

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'accepted':
                return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
            case 'sent':
                return "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
            case 'rejected':
                return "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(225,29,72,0.1)]";
            default:
                return "text-neutral-500 bg-neutral-500/10 border-neutral-500/20";
        }
    };

    const filteredEstimates = useMemo(() => {
        return estimates.filter((est) => {
            const customerName = typeof est.customer === 'object' && est.customer ? est.customer.name : '';
            const matchesSearch = est.estimateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customerName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || est.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [estimates, searchTerm, statusFilter]);

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
                            Estimate <span className="text-amber-500">Intelligence</span>
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                                Proforma Matrix
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Syncing Institutional Valuation Node // {estimates.length} Objects</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={fetchEstimates}
                            className={`p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all ${isLoading ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw className="w-4 h-4 text-amber-500" />
                        </button>
                        <button
                            onClick={() => navigate('/sales/estimates/new')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                        >
                            <Plus className="w-4 h-4" /> New Proforma
                        </button>
                    </div>
                </header>

                {/* Metrics Hub */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Cumulative Volume', value: stats.total, icon: FileText, color: 'amber', sub: 'Active Proformas' },
                        { label: 'Matrix Valuation', value: `₹${stats.value.toLocaleString()}`, icon: Calculator, color: 'rose', sub: 'Projected Revenue' },
                        { label: 'Acceptance Nodes', value: stats.accepted, icon: FileCheck, color: 'emerald', sub: 'Converted Objects' },
                        { label: 'Conversion Ratio', value: `${stats.conversion.toFixed(1)}%`, icon: TrendingUp, color: 'amber', sub: 'Protocol Yield' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm group hover:border-amber-500/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color}-500/10 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase tracking-widest">+12.4%</div>
                            </div>
                            <h3 className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white">{stat.value}</h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">{stat.label}</p>
                            <div className="mt-4 h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div className={`h-full bg-${stat.color}-500 w-[65%] rounded-full`} />
                            </div>
                            <p className="text-[9px] font-bold text-neutral-500 mt-2 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500" /> {stat.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Intelligence Workspace */}
                <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
                    {/* Filter Protocol Bar */}
                    <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
                        <div className="relative w-full md:max-w-md group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 group-focus-within:scale-110 transition-transform">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Scan Registry (Node ID, Client...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-amber-500/50 outline-none transition-all dark:text-white placeholder:text-neutral-400 shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                            {['all', 'draft', 'sent', 'accepted', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                                        statusFilter === status 
                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                        : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] bg-neutral-50/30 dark:bg-neutral-950/30">
                                    <th className="px-8 py-6">Reference ID</th>
                                    <th className="px-8 py-6">Client Entity</th>
                                    <th className="px-8 py-6">Emission Date</th>
                                    <th className="px-8 py-6 text-right">Matrix Valuation</th>
                                    <th className="px-8 py-6">Status Protocol</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-8 py-6"><div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full w-full"></div></td>
                                        </tr>
                                    ))
                                ) : filteredEstimates.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500">
                                                    <Briefcase className="w-10 h-10 opacity-40" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">No Node Matches Search Protocol</p>
                                                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-tighter">Adjust filters or initialize new proforma</p>
                                                </div>
                                                <button 
                                                    onClick={() => {setSearchTerm(''); setStatusFilter('all');}}
                                                    className="mt-4 px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                                >
                                                    Clear All Protocols
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEstimates.map((estimate) => (
                                        <tr key={estimate._id} className="hover:bg-amber-500/[0.02] transition-all group border-l-4 border-l-transparent hover:border-l-amber-500">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                                        <Calculator className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                    <span className="text-sm font-black text-neutral-900 dark:text-white tracking-tighter">{estimate.estimateNo}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-amber-500/20">
                                                        {(typeof estimate.customer === 'object' && estimate.customer?.name?.[0]) || 'W'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tight">
                                                            {(typeof estimate.customer === 'object' && estimate.customer?.name) || 'Walk-in Customer'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Entity Client</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                                    {new Date(estimate.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-sm font-black text-neutral-900 dark:text-white font-mono tracking-tighter">
                                                    ₹{estimate.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${getStatusStyles(estimate.status)}`}>
                                                    {estimate.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => navigate(`/sales/estimate/${estimate._id}`)}
                                                        className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                        title="Matrix View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(estimate._id || '')}
                                                        className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                        title="Purge Object"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Matrix Status */}
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
                                <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">Active Stakeholders</span>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Protocol Version 4.02 // Stable</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Matrix Sync 100%</span>
                                <div className="w-48 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden shadow-inner">
                                    <div className="w-[100%] h-full bg-emerald-500 rounded-full" />
                                </div>
                            </div>
                            <button className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-black/5">
                                <Download className="w-4 h-4 text-amber-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EstimateList;

