import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getAllDeliveryChallans, deleteDeliveryChallan, convertToInvoice, reset } from "../../../redux/slices/deliveryChallanSlice";
import { RootState } from "../../../redux/store";
import {
    Truck, Plus, Search, Eye, Trash2, FileText,
    CheckCircle2, Clock, ArrowRightCircle, Package,
    RefreshCw, Calendar, User, ShieldCheck, Zap,
    Download, ArrowRight, Filter
} from 'lucide-react';
import Layout from '../../../components/shared/Layout';

const DeliveryChallanList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { challans, isLoading, isError, message } = useSelector((state: RootState) => state.deliveryChallan);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [convertConfirm, setConvertConfirm] = useState<string | null>(null);

    useEffect(() => { dispatch(getAllDeliveryChallans() as any); }, [dispatch]);

    useEffect(() => {
        if (isError) toast.error(message);
        return () => { dispatch(reset()); };
    }, [isError, message, dispatch]);

    const handleDelete = async (id: string) => {
        await dispatch(deleteDeliveryChallan(id) as any);
        setDeleteConfirm(null);
        toast.success('Challan deleted successfully.');
        dispatch(getAllDeliveryChallans() as any);
    };

    const handleConvert = async (id: string) => {
        const result = await dispatch(convertToInvoice(id) as any);
        setConvertConfirm(null);
        if (result.type.includes('fulfilled')) {
            toast.success('Challan converted to invoice.');
            const payload = result.payload as any;
            if (payload?.invoice?._id) navigate(`/sales/invoice/${payload.invoice._id}`);
        }
    };

    const challanArray = Array.isArray(challans) ? challans : [];

    const metrics = useMemo(() => ({
        total: challanArray.length,
        delivered: challanArray.filter(c => c.status === 'Delivered').length,
        converted: challanArray.filter(c => c.status === 'Converted').length,
        draft: challanArray.filter(c => c.status === 'Draft').length,
    }), [challanArray]);

    const filteredChallans = useMemo(() => challanArray.filter(c => {
        const matchSearch = c.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchSearch && matchStatus;
    }), [challanArray, searchTerm, statusFilter]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Converted': return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', icon: CheckCircle2, text: 'Converted' };
            case 'Delivered': return { color: 'text-info',    bg: 'bg-info/10',    border: 'border-info/30',    icon: Truck,         text: 'Delivered' };
            default:          return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', icon: Clock,         text: 'Draft' };
        }
    };

    const kpiCards = [
        { label: 'Total Challans',   value: metrics.total,     icon: Package,     color: 'text-primary', bg: 'bg-primary/10',  border: 'border-primary/30',  sub: 'All Challans' },
        { label: 'Dispatched',       value: metrics.delivered,  icon: Truck,       color: 'text-info',    bg: 'bg-info/10',     border: 'border-info/30',     sub: 'Delivery Active' },
        { label: 'Converted',        value: metrics.converted,  icon: CheckCircle2,color: 'text-success', bg: 'bg-success/10',  border: 'border-success/30',  sub: 'Invoiced' },
        { label: 'Pending Drafts',   value: metrics.draft,      icon: Clock,       color: 'text-warning', bg: 'bg-warning/10',  border: 'border-warning/30',  sub: 'Awaiting Dispatch' },
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
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="relative pl-5">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning rounded-full shadow-[0_0_15px_rgba(var(--color-warning),0.5)]" />
                            <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                                Delivery <span className="text-warning">Challans</span>
                                <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-sm text-[10px] font-black uppercase tracking-widest">
                                    Dispatch Register
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-secondary">
                                    {challanArray.length} challans synced
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => dispatch(getAllDeliveryChallans() as any)}
                                className={`p-2.5 bg-card border border-default rounded-sm hover:bg-surface transition-all ${isLoading ? 'animate-spin' : ''}`}
                            >
                                <RefreshCw className="w-4 h-4 text-warning" />
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-card border border-default rounded-sm text-xs font-black uppercase tracking-widest text-muted hover:text-main hover:border-warning/30 transition-all">
                                <Download className="w-4 h-4" /> Export
                            </button>
                            <button
                                onClick={() => { dispatch(reset()); navigate('/sales/delivery-challan'); }}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-warning text-warning-fg rounded-sm shadow-lg shadow-warning/20 transition-all text-xs font-black uppercase tracking-widest hover:opacity-90"
                            >
                                <Plus className="w-4 h-4" /> New Challan
                            </button>
                        </div>
                    </header>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kpiCards.map((card, i) => (
                            <div key={i} className="card-interactive p-6 relative overflow-hidden group bg-card/60 backdrop-blur-2xl border border-default">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-sm ${card.bg} ${card.color} border ${card.border}`}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-[10px] font-black text-success bg-success/10 border border-success/30 px-2 py-1 rounded-sm uppercase tracking-widest">
                                        Live
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

                    {/* Toolbar — standalone bordered card */}
                    <div className="glass-panel rounded-sm border border-default p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-warning" />
                            <input
                                type="text"
                                placeholder="Search challan number or customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-card border border-default rounded-sm py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-warning/50 focus:ring-2 focus:ring-warning/10 transition-all text-main placeholder:text-secondary"
                            />
                        </div>
                        <div className="flex bg-surface p-1 rounded-sm border border-default overflow-x-auto gap-1">
                            {[
                                { val: 'all', label: 'All' },
                                { val: 'Draft', label: 'Draft' },
                                { val: 'Delivered', label: 'Delivered' },
                                { val: 'Converted', label: 'Converted' },
                            ].map(({ val, label }) => (
                                <button
                                    key={val}
                                    onClick={() => setStatusFilter(val)}
                                    className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        statusFilter === val
                                            ? 'bg-card text-warning shadow-sm border border-default'
                                            : 'text-secondary hover:text-main'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table — standalone bordered card */}
                    <div className="glass-panel flex flex-col overflow-hidden rounded-sm border border-default">
                        <div className="flex-1 overflow-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-surface/50 sticky top-0 z-20 border-b border-default">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary">Challan No.</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary">Customer</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary">Date</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary text-center">Items</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary text-center">Status</th>
                                        <th className="px-6 py-4 w-28" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
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
                                    ) : filteredChallans.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-6 bg-surface rounded-sm border border-default">
                                                        <FileText className="w-10 h-10 text-secondary opacity-30" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-main uppercase tracking-widest">No Challans Found</h3>
                                                        <p className="text-sm text-secondary mt-1">Create your first delivery challan.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredChallans.map((challan) => {
                                            const config = getStatusConfig(challan.status);
                                            const Icon = config.icon;
                                            return (
                                                <tr
                                                    key={challan._id}
                                                    className="hover:bg-warning/[0.03] transition-all group border-l-4 border-l-transparent hover:border-l-warning cursor-pointer"
                                                    onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-sm bg-warning/10 border border-warning/20 flex items-center justify-center">
                                                                <Truck className="w-4 h-4 text-warning" />
                                                            </div>
                                                            <div>
                                                                <span className="font-mono text-sm font-bold text-main group-hover:text-warning transition-colors tracking-tighter">{challan.challanNumber}</span>
                                                                <div className="text-[9px] text-secondary font-bold uppercase tracking-widest mt-0.5">ID: {challan._id?.slice(-8).toUpperCase()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-sm bg-warning/10 border border-warning/20 flex items-center justify-center text-[10px] font-black text-warning">
                                                                {challan.customer?.name?.[0]?.toUpperCase() || 'C'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-black text-main uppercase tracking-tight">{challan.customer?.name || 'Unknown'}</div>
                                                                <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">{challan.customer?.phone || '—'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                                                            <Calendar className="w-3.5 h-3.5 text-warning" />
                                                            {new Date(challan.challanDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="px-3 py-1 bg-surface border border-default text-secondary rounded-sm text-[10px] font-black uppercase tracking-widest">
                                                            {(challan.items || []).length} Items
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.color} ${config.border}`}>
                                                                <Icon className="w-3.5 h-3.5" /> {config.text}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/sales/delivery-challan/${challan._id}`); }}
                                                                className="p-2 text-secondary hover:text-warning hover:bg-warning/10 rounded-sm transition-all"
                                                                title="View"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {challan.status !== 'Converted' && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setConvertConfirm(challan._id); }}
                                                                        className="p-2 text-secondary hover:text-success hover:bg-success/10 rounded-sm transition-all"
                                                                        title="Convert to Invoice"
                                                                    >
                                                                        <ArrowRightCircle className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(challan._id); }}
                                                                        className="p-2 text-secondary hover:text-danger hover:bg-danger/10 rounded-sm transition-all"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
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

                        {/* Footer */}
                        <div className="p-5 border-t border-default bg-surface/20 flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">
                                Showing <span className="text-main">{filteredChallans.length}</span> of <span className="text-main">{challanArray.length}</span> challans
                            </p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-warning" />
                                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Dispatch Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="glass-panel rounded-sm border border-default p-8 max-w-md w-full shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-danger/10 border border-danger/30 text-danger rounded-sm flex items-center justify-center mx-auto mb-5">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-display font-black text-main uppercase tracking-tight mb-2">Delete Challan?</h3>
                            <p className="text-sm font-bold text-secondary uppercase tracking-widest mb-6 leading-relaxed">
                                This challan will be permanently deleted and cannot be recovered.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-5 py-3 bg-card border border-default text-main rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="px-5 py-3 bg-danger text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-danger/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Convert Confirmation Modal */}
            {convertConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="glass-panel rounded-sm border border-default p-8 max-w-md w-full shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-success/10 border border-success/30 text-success rounded-sm flex items-center justify-center mx-auto mb-5">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-display font-black text-main uppercase tracking-tight mb-2">Convert to Invoice?</h3>
                            <p className="text-sm font-bold text-secondary uppercase tracking-widest mb-6 leading-relaxed">
                                This challan will be converted to a sales invoice. This action cannot be undone.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setConvertConfirm(null)}
                                    className="px-5 py-3 bg-card border border-default text-main rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleConvert(convertConfirm)}
                                    className="px-5 py-3 bg-success text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-success/20"
                                >
                                    Convert
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default DeliveryChallanList;
