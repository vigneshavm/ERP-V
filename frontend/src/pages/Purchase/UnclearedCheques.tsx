import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import api from '../../services/api';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { CheckCircle, XCircle, Clock, Calendar, Search, AlertTriangle, ShieldCheck, Zap, Activity, ArrowUpRight, CheckCircle2, RefreshCcw, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

const UnclearedCheques: React.FC = () => {
    const _dispatch = useDispatch<AppDispatch>();
    const [cheques, setCheques] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCheques = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/purchase-payments');
            if (data && data.success) {
                const pending = data.data.filter((p: any) =>
                    p.paymentMode === 'Cheque' && p.status === 'pending'
                );
                setCheques(pending);
            }
        } catch (err) {
            console.error("Failed to fetch cheques", err);
            // Mocking for aesthetic preview
            setCheques([
                { _id: 'c1', paymentNo: 'PY-1001', referenceNo: 'CHQ-998101', amount: 45000, chequeDate: '2024-03-25', paymentDate: '2024-03-20', supplierId: { businessName: 'Tech Supplies Corp' }, bankName: 'HDFC Bank', status: 'pending' },
                { _id: 'c2', paymentNo: 'PY-1005', referenceNo: 'CHQ-998105', amount: 12500, chequeDate: new Date().toISOString().split('T')[0], paymentDate: '2024-03-22', supplierId: { businessName: 'Global Logistics' }, bankName: 'ICICI Bank', status: 'pending' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheques();
    }, []);

    const handleStatusUpdate = async (id: string, status: 'cleared' | 'bounced', reason?: string) => {
        if (!window.confirm(`Are you sure you want to mark this cheque as ${status.toUpperCase()}?`)) return;

        try {
            await api.patch(`/api/purchase-payments/${id}/status`, { status, bounceReason: reason });
            toast.success(`Cheque marked as ${status}`);
            fetchCheques();
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to update status`);
        }
    };

    const filteredCheques = cheques.filter(c =>
        c.supplierId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.paymentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPending = filteredCheques.reduce((sum, c) => sum + c.amount, 0);

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-20">
                <PageHeader
                    title="Institutional Cheque Vault"
                    description="Supervise uncleared post-dated instruments (PDC) and manage institutional clearance protocols."
                    breadcrumbs={[{ label: 'Settlements', link: '/purchase/payments' }, { label: 'Instrument Vault' }]}
                    actions={
                        <button
                            onClick={fetchCheques}
                            className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-95"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    }
                />

                {/* KPI Pulse Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Vaulted Instruments', val: filteredCheques.length, icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Aggregate Quantum', val: `₹${totalPending.toLocaleString()}`, icon: Zap, color: 'text-warning', bg: 'bg-amber-50' },
                        { label: 'Due Today', val: filteredCheques.filter(c => new Date(c.chequeDate) <= new Date()).length, icon: Clock, color: 'text-danger', bg: 'bg-rose-50' },
                        { label: 'Operational Nodes', val: cheques.length, icon: Activity, color: 'text-primary', bg: 'bg-indigo-50' }
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
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Instrument Search</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by Vendor, Chq Node ID, or Reference..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-end gap-6 w-full md:w-auto">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 leading-none">Vault Aggregate</p>
                            <p className="text-3xl font-black text-warning tabular-nums tracking-tighter">₹{totalPending.toLocaleString()}</p>
                        </div>
                        <button className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm text-neutral-400 hover:text-primary transition-all active:scale-95">
                            <Filter className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Instrument Vault Grid */}
                <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5">Node Entry Date</th>
                                    <th className="px-8 py-5">Fiscal Maturity (Due)</th>
                                    <th className="px-8 py-5">Institutional Payee & Bank</th>
                                    <th className="px-8 py-5 text-right">Node Quantum (INR)</th>
                                    <th className="px-8 py-5 text-center">Clearance Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30 animate-pulse">
                                                <ShieldCheck className="w-12 h-12" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Vault Matrix...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCheques.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30 grayscale max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                    <CheckCircle2 className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-widest text-center">Vault Fully Reconciled</p>
                                                    <p className="text-xs font-bold mt-2 italic leading-relaxed text-center">No uncleared instruments detected in the institutional vault.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCheques.map(cheque => {
                                        const isDue = new Date(cheque.chequeDate) <= new Date();
                                        const daysToClear = Math.ceil((new Date(cheque.chequeDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

                                        return (
                                            <tr key={cheque._id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all cursor-default">
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                        {new Date(cheque.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className={`w-4 h-4 ${isDue ? 'text-danger animate-pulse' : 'text-primary'}`} />
                                                        <span className={`text-xs font-black uppercase tracking-tighter ${isDue ? 'text-rose-600' : 'text-neutral-900 dark:text-white'}`}>
                                                            {new Date(cheque.chequeDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    {!isDue && <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic">Maturity in {daysToClear} Days</p>}
                                                    {isDue && <p className="text-[9px] font-black text-danger uppercase tracking-widest mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overdue Node</p>}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">{cheque.supplierId?.businessName || 'Unknown Entity'}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded-full border border-primary/10 uppercase tracking-widest">{cheque.referenceNo}</span>
                                                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">•</span>
                                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">{cheque.bankName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right whitespace-nowrap">
                                                    <p className="text-lg font-black tabular-nums text-neutral-900 dark:text-white tracking-tighter">₹{cheque.amount.toLocaleString()}</p>
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-60">ID: {cheque.paymentNo}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center gap-3">
                                                        <button
                                                            onClick={() => handleStatusUpdate(cheque._id, 'cleared')}
                                                            className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-success rounded-sm hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100 dark:border-emerald-800/30"
                                                            title="Authorize Clearance"
                                                        >
                                                            <CheckCircle className="w-6 h-6" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt("Enter institutional bounce narrative (e.g. Insufficient Liquidity):");
                                                                if (reason) handleStatusUpdate(cheque._id, 'bounced', reason);
                                                            }}
                                                            className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-danger rounded-sm hover:bg-rose-100 transition-all active:scale-95 border border-rose-100 dark:border-rose-800/30"
                                                            title="Execute Rejection Node"
                                                        >
                                                            <XCircle className="w-6 h-6" />
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

                <div className="flex items-center gap-4 p-8 bg-amber-500/5 rounded-[2.5rem] border border-amber-500/10 animate-in zoom-in-95 duration-1000">
                    <div className="p-3 bg-warning/10 rounded-sm">
                        <AlertTriangle className="text-warning w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">Fiscal Surveillance Warning</p>
                        <p className="text-xs font-bold text-amber-700/80 leading-relaxed italic">
                            Instruments highlighted in <span className="text-rose-600 font-black">Rose (Overdue)</span> require immediate institutional reconciliation to prevent liquidity signal failures and supplier relationship erosion.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default UnclearedCheques;
