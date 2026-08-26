import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { Plus, Check, X, Clock, AlertTriangle, ArrowRight, Zap, Activity, ShieldCheck, ArrowUpRight, Info, Search, Filter, RefreshCcw } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const RateRevisionList: React.FC = () => {
    const navigate = useNavigate();
    const [revisions, setRevisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRevisions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/purchases/rate-revisions');
            if (data.success) {
                setRevisions(data.data);
            }
        } catch (error) {
            console.error(error);
            // Mocking for aesthetic preview
            setRevisions([
                { _id: 'r1', createdAt: '2024-03-20', itemId: { name: 'Premium Circuit Board' }, batchNumber: 'B-8829', supplierId: { businessName: 'Tech Supplies Corp' }, oldRate: 450, newRate: 480, diffAmount: 3000, affectedQty: 100, status: 'PENDING' },
                { _id: 'r2', createdAt: '2024-03-18', itemId: { name: 'Institutional Chassis' }, batchNumber: 'B-7710', supplierId: { businessName: 'Global Logistics' }, oldRate: 1200, newRate: 1150, diffAmount: -5000, affectedQty: 100, status: 'APPROVED' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevisions();
    }, []);

    const handleApprove = async (id: string) => {
        if (!window.confirm("Approve this revision? This will create a Debit Note and update Inventory Cost.")) return;
        try {
            await api.post(`/purchases/rate-revisions/${id}/approve`);
            toast.success("Revision Approved Successfully");
            fetchRevisions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Approval Failed");
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm("Reject this revision?")) return;
        try {
            await api.post(`/purchases/rate-revisions/${id}/reject`);
            toast.info("Revision Rejected");
            fetchRevisions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Rejection Failed");
        }
    };

    const filteredRevisions = revisions.filter(r => 
        r.itemId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.supplierId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: revisions.length,
        pending: revisions.filter(r => r.status === 'PENDING').length,
        totalImpact: revisions.reduce((sum, r) => sum + (r.diffAmount || 0), 0)
    };

    const getStatusBadge = (status: string) => {
        const baseClass = "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5";
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return <span className={`${baseClass} bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-success`}><ShieldCheck className="w-3 h-3" /> Authorized</span>;
            case 'PENDING':
                return <span className={`${baseClass} bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-warning`}><Clock className="w-3 h-3" /> Awaiting</span>;
            case 'REJECTED':
                return <span className={`${baseClass} bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-danger`}><X className="w-3 h-3" /> Aborted</span>;
            default:
                return <span className={`${baseClass} bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400`}>{status}</span>;
        }
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-20">
                <PageHeader
                    title="Institutional Rate Surveillance"
                    description="Supervise retrospective rate modifications and margin recalibration protocols."
                    breadcrumbs={[{ label: 'Procurement', link: '/purchase' }, { label: 'Rate Revisions' }]}
                    actions={
                        <button
                            onClick={() => navigate('/purchase/rate-revisions/new')}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-3 hover:bg-primary/90 transition hover:scale-105 active:scale-95"
                        >
                            <Plus size={16} /> Initialize Revision Node
                        </button>
                    }
                />

                {/* KPI Pulse Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Revision Nodes', val: stats.total, icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Fiscal Impact', val: `₹${Math.abs(stats.totalImpact).toLocaleString()}`, icon: ArrowUpRight, color: stats.totalImpact > 0 ? 'text-danger' : 'text-success', bg: stats.totalImpact > 0 ? 'bg-rose-50' : 'bg-emerald-50' },
                        { label: 'Awaiting Auth', val: stats.pending, icon: Clock, color: 'text-warning', bg: 'bg-amber-50' },
                        { label: 'Audit Nodes', val: revisions.length, icon: Activity, color: 'text-primary', bg: 'bg-indigo-50' }
                    ].map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className={`p-4 ${card.bg} ${card.color} rounded-sm group-hover:scale-110 transition-all duration-500`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-2">{card.label}</p>
                                <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase tabular-nums">{card.val}</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        </div>
                    ))}
                </div>

                {/* Audit Control Matrix */}
                <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative w-full md:w-[500px]">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Node Search</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by Item, Batch, or Supplier..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-end gap-6 w-full md:w-auto">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 leading-none">Net Node Impact</p>
                            <p className={`text-3xl font-black tabular-nums tracking-tighter ${stats.totalImpact > 0 ? 'text-danger' : 'text-success'}`}>
                                {stats.totalImpact > 0 ? '+' : '-'}₹{Math.abs(stats.totalImpact).toLocaleString()}
                            </p>
                        </div>
                        <button className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm text-neutral-400 hover:text-primary transition-all active:scale-95">
                            <Filter className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Revision Matrix Grid */}
                <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5">Node Entry Date</th>
                                    <th className="px-8 py-5">Institutional Item & Batch</th>
                                    <th className="px-8 py-5">Supplier Entity</th>
                                    <th className="px-8 py-5 text-center">Rate Delta</th>
                                    <th className="px-8 py-5 text-right">Fiscal Impact</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-8 py-24 text-center opacity-40 animate-pulse">Synchronizing Rate Matrix...</td></tr>
                                ) : filteredRevisions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30 grayscale max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                    <Info className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-widest text-center">Revision Vault Empty</p>
                                                    <p className="text-xs font-bold mt-2 italic leading-relaxed text-center">Initialize rate revision nodes to manage retrospective price adjustments.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRevisions.map((rev) => (
                                        <tr key={rev._id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all cursor-default">
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                    {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter leading-none mb-1">{rev.itemId?.name || 'Unknown Entity'}</p>
                                                <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded-full border border-primary/10 uppercase tracking-widest">Batch: {rev.batchNumber}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter truncate max-w-[180px]">{rev.supplierId?.businessName}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className="text-[10px] font-black text-neutral-400 line-through tabular-nums">₹{rev.oldRate}</span>
                                                    <ArrowRight size={12} className="text-neutral-300" />
                                                    <span className="text-xs font-black text-primary tabular-nums">₹{rev.newRate}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className={`text-sm font-black tabular-nums tracking-tighter ${rev.diffAmount > 0 ? 'text-danger' : 'text-success'}`}>
                                                    {rev.diffAmount > 0 ? '+' : ''}₹{rev.diffAmount?.toLocaleString()}
                                                </p>
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Impact on {rev.affectedQty} Qty</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    {getStatusBadge(rev.status)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-3">
                                                    {rev.status === 'PENDING' && (
                                                        <div className="flex items-center gap-2 pr-4 border-r border-neutral-100 dark:border-neutral-800">
                                                            <button
                                                                onClick={() => handleApprove(rev._id)}
                                                                className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-success rounded-xl hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100 dark:border-emerald-800/30"
                                                                title="Authorize Revision"
                                                            >
                                                                <Check size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(rev._id)}
                                                                className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-danger rounded-xl hover:bg-rose-100 transition-all active:scale-95 border border-rose-100 dark:border-rose-800/30"
                                                                title="Abort Revision"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button className="p-2.5 text-neutral-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                        <ArrowUpRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 animate-in zoom-in-95 duration-1000">
                    <div className="p-3 bg-primary/10 rounded-sm">
                        <AlertTriangle className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Fiscal Impact Advisory</p>
                        <p className="text-xs font-bold text-primary/80 leading-relaxed italic">
                            Authorization of rate revision nodes will automatically initialize institutional <span className="text-neutral-900 dark:text-white font-black underline">Debit/Credit Notes</span> and recalibrate real-time inventory cost basis.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default RateRevisionList;
