import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../services/api";
import { toast } from 'react-toastify';
import {
    FileText, Plus, Search, Eye, Trash2, Calculator, TrendingUp, FileCheck, Filter, Calendar, RefreshCw,
    ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import Layout from '../../../components/shared/Layout/index';
import { Estimate } from '../../../types/sales';

const PAGE_SIZE = 10;

const EstimateList = () => {
    const navigate = useNavigate();
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<'estimateNo' | 'createdAt' | 'totalAmount' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => { fetchEstimates(); }, []);

    const fetchEstimates = async () => {
        setIsLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const response = await api.get(`/api/estimates`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setEstimates(response.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch estimates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this estimate? This cannot be undone.')) return;
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                await api.delete(`/api/estimates/${id}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                toast.success('Estimate deleted.');
                fetchEstimates();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete estimate');
        }
    };

    // KPIs
    const stats = useMemo(() => {
        const total = estimates.length;
        const value = estimates.reduce((sum, est) => sum + (est.totalAmount || 0), 0);
        const accepted = estimates.filter(e => e.status === 'accepted').length;
        const conversion = total > 0 ? (accepted / total) * 100 : 0;
        return { total, value, accepted, conversion };
    }, [estimates]);

    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'accepted': return 'text-success bg-success/10 border-success/30';
            case 'sent':     return 'text-warning bg-warning/10 border-warning/30';
            case 'rejected': return 'text-danger bg-danger/10 border-danger/30';
            case 'draft':    return 'text-secondary bg-surface border-default';
            default:         return 'text-secondary bg-surface border-default';
        }
    };

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => (
        <span className={`ml-1 text-[9px] ${sortField === field ? 'text-warning' : 'text-secondary opacity-30'}`}>
            {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    // Filter + sort
    const filtered = useMemo(() => {
        let list = estimates.filter(est => {
            const customerName = typeof est.customer === 'object' && est.customer ? est.customer.name : '';
            const matchSearch = est.estimateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customerName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = statusFilter === 'all' || est.status === statusFilter;
            return matchSearch && matchStatus;
        });
        if (sortField) {
            list = [...list].sort((a, b) => {
                let av: any = a[sortField as keyof typeof a];
                let bv: any = b[sortField as keyof typeof b];
                if (sortField === 'totalAmount') { av = Number(av); bv = Number(bv); }
                if (av < bv) return sortDir === 'asc' ? -1 : 1;
                if (av > bv) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return list;
    }, [estimates, searchTerm, statusFilter, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageRecords = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };
    const handleStatus = (s: string) => { setStatusFilter(s); setCurrentPage(1); };
    const goTo = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

    const pageButtons = useMemo(() => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else {
            pages.push(1);
            if (safePage > 3) pages.push('...');
            for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
            if (safePage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    }, [safePage, totalPages]);

    const kpiCards = [
        { label: 'Total Estimates', value: stats.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', sub: 'All Proformas' },
        { label: 'Total Value', value: `₹${stats.value.toLocaleString()}`, icon: Calculator, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', sub: 'Projected Revenue' },
        { label: 'Accepted', value: stats.accepted, icon: FileCheck, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', sub: 'Converted to Order' },
        { label: 'Conversion Rate', value: `${stats.conversion.toFixed(1)}%`, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', sub: 'Acceptance Ratio' },
    ];

    return (
        <Layout>
            <div className="relative space-y-8 pt-4">
                {/* Ambient Background Blobs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-15%] left-[5%] w-[55%] h-[55%] bg-warning/10 rounded-full blur-[160px] animate-aura opacity-60" />
                    <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px] animate-aura opacity-50" style={{ animationDelay: '7s' }} />
                    <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] animate-aura opacity-40" style={{ animationDelay: '3s' }} />
                </div>
                <div className="relative z-10 space-y-8">

                {/* Header — matches Sales Register style exactly */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning rounded-full shadow-[0_0_15px_rgba(var(--color-warning),0.5)]" />
                        <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                            Estimates <span className="text-warning">Register</span>
                            <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-sm text-[10px] font-black uppercase tracking-widest">
                                Proforma
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-secondary">
                                {estimates.length} estimates synced
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={fetchEstimates}
                            className={`p-2.5 bg-card border border-default rounded-sm hover:bg-surface transition-all ${isLoading ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw className="w-4 h-4 text-warning" />
                        </button>
                        <button
                            onClick={() => navigate('/sales/estimates/new')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-warning text-warning-fg rounded-sm shadow-lg transition-all text-xs font-black uppercase tracking-widest hover:opacity-90"
                        >
                            <Plus className="w-4 h-4" /> New Estimate
                        </button>
                    </div>
                </header>

                {/* KPI Cards — same pattern as Sales Register */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiCards.map((card, i) => (
                        <div key={i} className="card-interactive p-6 relative overflow-hidden group bg-card/60 backdrop-blur-2xl border border-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border ${card.border}`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <div className="text-[10px] font-black text-success bg-success/10 border border-success/30 px-2 py-1 rounded-sm uppercase tracking-widest">
                                    +12.4%
                                </div>
                            </div>
                            <h3 className={`text-2xl font-display font-black tracking-tighter tabular-nums ${card.color}`}>
                                {isLoading ? '—' : card.value}
                            </h3>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">{card.label}</p>
                            <div className="mt-3 h-1 w-full bg-border rounded-full overflow-hidden">
                                <div className={`h-full rounded-full w-[65%] ${card.bg.replace('/10', '')}`} />
                            </div>
                            <p className="text-[9px] font-bold text-secondary mt-2 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-warning" /> {card.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Toolbar — standalone bordered card, matching Sales Register */}
                <div className="glass-panel rounded-sm border border-default p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-warning" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Search estimate number or customer..."
                                className="w-full bg-card border border-default rounded-sm py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-warning/50 focus:ring-2 focus:ring-warning/10 transition-all text-main placeholder:text-secondary"
                            />
                        </div>
                        <button className="h-10 px-5 w-full md:w-auto bg-card hover:bg-surface border border-default rounded-sm text-[10px] font-black uppercase tracking-widest text-secondary flex items-center justify-center gap-2 transition-all">
                            <Filter className="w-4 h-4" /> Filters
                        </button>
                    </div>
                    <div className="flex bg-surface p-1 rounded-sm border border-default w-full md:w-auto overflow-x-auto gap-1">
                        {['all', 'draft', 'sent', 'accepted', 'rejected'].map(s => (
                            <button
                                key={s}
                                onClick={() => handleStatus(s)}
                                className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all flex-1 md:flex-none ${
                                    statusFilter === s
                                        ? 'bg-card text-warning shadow-sm border border-default'
                                        : 'text-secondary hover:text-main'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table — standalone bordered card */}
                <div className="glass-panel flex flex-col overflow-hidden rounded-sm border border-default">
                    {/* Table */}
                    <div className="flex-1 overflow-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface/50 sticky top-0 z-20 border-b border-default">
                                <tr>
                                    <th onClick={() => handleSort('estimateNo')} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-warning transition-colors select-none">
                                        Estimate No. <SortIcon field="estimateNo" />
                                    </th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary">Customer</th>
                                    <th onClick={() => handleSort('createdAt')} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-warning transition-colors select-none">
                                        Date <SortIcon field="createdAt" />
                                    </th>
                                    <th onClick={() => handleSort('totalAmount')} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary text-right cursor-pointer hover:text-warning transition-colors select-none">
                                        Amount (INR) <SortIcon field="totalAmount" />
                                    </th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary text-center">Status</th>
                                    <th className="px-6 py-4 w-28" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default/50">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {[...Array(6)].map((_, j) => (
                                                <td key={j} className="px-6 py-5">
                                                    <div className="h-4 bg-surface rounded-sm w-full" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : pageRecords.length > 0 ? (
                                    pageRecords.map(est => {
                                        const customerName = typeof est.customer === 'object' && est.customer
                                            ? est.customer.name : 'Walk-in Customer';
                                        const initial = customerName?.[0]?.toUpperCase() || 'W';
                                        return (
                                            <tr key={est._id} className="hover:bg-warning/[0.03] transition-all group border-l-4 border-l-transparent hover:border-l-warning">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-sm bg-warning/10 border border-warning/20 flex items-center justify-center">
                                                            <Calculator className="w-4 h-4 text-warning" />
                                                        </div>
                                                        <span className="font-mono text-sm font-bold text-main group-hover:text-warning transition-colors tracking-tighter cursor-pointer">
                                                            {est.estimateNo}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-sm bg-warning text-warning-fg flex items-center justify-center text-[10px] font-black">
                                                            {initial}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-main uppercase tracking-tight">{customerName}</div>
                                                            <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">Customer</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                                                        <Calendar className="w-3.5 h-3.5 text-danger" />
                                                        {new Date(est.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="text-lg font-display font-black tracking-tighter text-main tabular-nums">
                                                        ₹{est.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[9px] text-success font-black uppercase tracking-widest mt-1">+ GST INCLUDED</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(est.status)}`}>
                                                            {est.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => navigate(`/sales/estimate/${est._id}`)}
                                                            className="p-2 text-secondary hover:text-warning hover:bg-warning/10 rounded-sm transition-all"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(est._id || '')}
                                                            className="p-2 text-secondary hover:text-danger hover:bg-danger/10 rounded-sm transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-6 bg-surface rounded-sm border border-default">
                                                    <Search className="w-10 h-10 text-secondary opacity-30" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black text-main uppercase tracking-widest">No Estimates Found</h3>
                                                    <p className="text-sm text-secondary mt-1">
                                                        {estimates.length === 0 ? 'No estimates yet. Create your first estimate.' : 'Refine your search or filter.'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentPage(1); }}
                                                    className="mt-2 px-6 py-2 bg-warning/10 border border-warning/30 text-warning text-xs font-black uppercase tracking-widest rounded-sm hover:bg-warning hover:text-warning-fg transition-all"
                                                >
                                                    Clear Filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer — identical to Sales Register */}
                    <div className="p-5 border-t border-default bg-surface/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">
                                Showing{' '}
                                <span className="text-main">{pageRecords.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</span>
                                {' '}of <span className="text-main">{filtered.length}</span> estimates
                                {filtered.length !== estimates.length && (
                                    <span className="text-warning ml-1">(filtered from {estimates.length})</span>
                                )}
                            </p>
                            <div className="h-1 w-24 bg-border rounded-full overflow-hidden">
                                <div className="h-full bg-warning transition-all duration-300 rounded-full"
                                    style={{ width: `${filtered.length === 0 ? 0 : (Math.min(safePage * PAGE_SIZE, filtered.length) / filtered.length) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => goTo(safePage - 1)}
                                disabled={safePage === 1}
                                className="px-3 py-2 bg-card border border-default rounded-sm text-[10px] font-black uppercase tracking-widest text-secondary disabled:opacity-30 hover:border-warning/50 hover:text-warning transition-all flex items-center gap-1 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Prev
                            </button>
                            {pageButtons.map((p, i) =>
                                p === '...' ? (
                                    <span key={`e${i}`} className="px-2 text-secondary text-xs">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => goTo(p as number)}
                                        className={`w-8 h-8 rounded-sm text-[10px] font-black transition-all border ${
                                            safePage === p
                                                ? 'bg-warning text-warning-fg border-warning'
                                                : 'bg-card text-secondary border-default hover:border-warning/50 hover:text-warning'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() => goTo(safePage + 1)}
                                disabled={safePage === totalPages}
                                className="px-3 py-2 bg-card border border-default rounded-sm text-[10px] font-black uppercase tracking-widest text-secondary disabled:opacity-30 hover:border-warning/50 hover:text-warning transition-all flex items-center gap-1 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-50 hidden sm:block">
                            {PAGE_SIZE} per page
                        </p>
                    </div>
                </div>

            </div>{/* end relative z-10 */}
            </div>{/* end relative outer */}
        </Layout>
    );
};

export default EstimateList;
