import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import api from "@/shared/api/api";
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
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    ArrowUpRight,
    Filter
} from 'lucide-react';
import { Estimate } from '@repo/shared';

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
                    `/estimates`,
                    {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }
                );
                setEstimates(response.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch estimates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Exterminate this estimate artifact?')) return;

        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                await api.delete(
                    `/estimates/${id}`,
                    {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }
                );

                toast.success('Artifact successfully purged');
                fetchEstimates();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to purge artifact');
        }
    };

    // KPI calculations
    const totalEstimates = estimates.length;
    const totalValue = estimates.reduce((sum, est) => sum + (est.totalAmount || 0), 0);
    const acceptedCount = estimates.filter(e => e.status === 'accepted').length;
    const draftCount = estimates.filter(e => e.status === 'draft').length;

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { bg: string, text: string, icon: any, color: string }> = {
            draft: { bg: 'bg-neutral-500/10', text: 'text-neutral-500', icon: Clock, color: 'text-neutral-500' },
            sent: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: FileText, color: 'text-blue-500' },
            accepted: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle, color: 'text-emerald-500' },
            rejected: { bg: 'bg-rose-500/10', text: 'text-rose-500', icon: XCircle, color: 'text-rose-500' }
        };
        return configs[status] || configs.draft;
    };

    const filteredEstimates = estimates.filter((est) => {
        const customerName = typeof est.customer === 'object' && est.customer ? est.customer.name : '';
        const matchesSearch = est.estimateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || est.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <Calculator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Syncing Estimate Stream...</p>
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
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">Proposal Hub</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Analytics v8.0</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Estimates Intelligence <TrendingUp className="w-8 h-8 text-indigo-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Surveillance and management of active market proposals.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/sales/estimate')}
                        className="px-8 py-4 bg-neutral-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden group relative"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> 
                        Create Artifact
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Proposals', value: totalEstimates, icon: FileText, color: 'indigo' },
                        { label: 'Liquidity Projection', value: `₹${totalValue.toLocaleString()}`, icon: Calculator, color: 'emerald' },
                        { label: 'Conversion Success', value: acceptedCount, icon: CheckCircle, color: 'teal' },
                        { label: 'Active Drafts', value: draftCount, icon: Clock, color: 'amber' },
                    ].map((kpi, i) => (
                        <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700`}>
                                <kpi.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                                    <h3 className="text-3xl font-black text-neutral-900 dark:text-main tracking-tighter italic">{kpi.value}</h3>
                                </div>
                                <div className="mt-6 flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full bg-${kpi.color}-500 animate-pulse`} />
                                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none">Live Metric</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Island + Table */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    {/* Modern Filter Bar */}
                    <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
                        {/* Search Component */}
                        <div className="relative w-full lg:max-w-xl group/search">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Scan by ID or counterparty identity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-neutral-900 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                            />
                        </div>

                        {/* Status Matrix Toggle */}
                        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 w-full lg:w-auto">
                            <div className="p-3 text-neutral-400"><Filter className="w-4 h-4" /></div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex-1 lg:flex-none px-6 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                            >
                                <option value="all">Global Matrix</option>
                                <option value="draft">Internal Drafts</option>
                                <option value="sent">Dispatched</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* High-Fidelity Table */}
                    <div className="overflow-x-auto px-2">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-2">Artifact #</th>
                                    <th className="px-8 py-2">Counterparty Entity</th>
                                    <th className="px-8 py-2">Fiscal Date</th>
                                    <th className="px-8 py-2 text-right">Liquidity Value</th>
                                    <th className="px-8 py-2">Status Node</th>
                                    <th className="px-8 py-2 text-right">Command</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEstimates.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2rem] mb-6 text-indigo-200 animate-pulse">
                                                    <ShieldCheck className="w-16 h-16" />
                                                </div>
                                                <p className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter">Vortex Entry Detected</p>
                                                <p className="text-sm font-bold text-neutral-500 mt-2 italic">Zero proposal artifacts found in current matrix.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEstimates.map((estimate) => {
                                        const status = getStatusConfig(estimate.status);
                                        const Icon = status.icon;
                                        return (
                                            <tr key={estimate._id} className="group/row hover:transform hover:-translate-y-1 transition-all duration-500">
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-indigo-500/20 group-hover/row:shadow-xl group-hover/row:shadow-indigo-500/5 transition-all">
                                                        <button
                                                            onClick={() => navigate(`/sales/estimate/${estimate._id}`)}
                                                            className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter italic flex items-center gap-2 group/btn"
                                                        >
                                                            {estimate.estimateNo}
                                                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-all translate-y-1 group-hover/btn:translate-y-0" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                        <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-1">
                                                            {(typeof estimate.customer === 'object' && estimate.customer?.name) || 'Walk-in Client'}
                                                        </p>
                                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">Verified Identity</span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-tight text-xs">
                                                        {new Date(estimate.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1 text-right">
                                                     <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                        <span className="text-xl font-black text-neutral-900 dark:text-neutral-100 font-mono tracking-tighter italic">
                                                            ₹{estimate.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                     </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${status.bg} ${status.text} border-current/10`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                            {estimate.status}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1 text-right">
                                                    <div className="flex justify-end gap-3 px-4">
                                                        <button
                                                            onClick={() => navigate(`/sales/estimate/${estimate._id}`)}
                                                            className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(estimate._id || '')}
                                                            className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
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
            </PageShell>
        </Layout>
    );
};

export default EstimateList;
