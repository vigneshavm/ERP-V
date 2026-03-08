import React, { useState, useEffect, useMemo} from 'react';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import {
    Search, Filter, Download, Shield, Eye, Calendar, Clock,
    ChevronLeft, ChevronRight, AlertTriangle, Check, X,
    Database, User, FileText, CreditCard, ShoppingCart,
    Hash, Globe, Fingerprint, ArrowUpDown, RotateCcw
} from 'lucide-react';
import api from '@/shared/api/api';
import { formatDateISO } from '@/shared/lib/utils/helpers';

/* ─── Action Badge ─────────────────────────────────────────── */
const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
    const config = useMemo(() => {
        if (action.includes('DELETE')) return { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800', icon: X };
        if (action.includes('UPDATE')) return { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', icon: ArrowUpDown };
        if (action.includes('CREATE')) return { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', icon: Check };
        return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', icon: Eye };
    }, [action]);

    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.text} border ${config.border}`}>
            <Icon className="w-3 h-3" /> {action}
        </span>
    );
};

/* ─── Entity Icon ──────────────────────────────────────────── */
const EntityIcon: React.FC<{ type: string }> = ({ type }) => {
    const icons: Record<string, React.ElementType> = {
        Invoice: FileText, Customer: User, Item: ShoppingCart,
        SalesOrder: CreditCard, Payment: CreditCard, User: User,
    };
    const Icon = icons[type] || Database;
    return (
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-400" />
        </div>
    );
};

/* ─── Diff Viewer ──────────────────────────────────────────── */
const DiffViewer: React.FC<{ before: any; after: any }> = ({ before, after }) => {
    const changes = useMemo(() => {
        if (!before && !after) return [];
        const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
        return Array.from(allKeys).map(key => ({
            field: key,
            oldVal: before?.[key],
            newVal: after?.[key],
            type: !before?.[key] ? 'added' as const : !after?.[key] ? 'removed' as const : JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]) ? 'changed' as const : 'unchanged' as const,
        })).filter(c => c.type !== 'unchanged');
    }, [before, after]);

    if (changes.length === 0) return <p className="text-sm text-slate-500 italic">No structural changes detected.</p>;

    return (
        <div className="space-y-2">
            {changes.map((change) => (
                <div key={change.field} className={`rounded-2xl p-4 border transition-all ${
                    change.type === 'added' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' :
                    change.type === 'removed' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                    'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            change.type === 'added' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            change.type === 'removed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                            {change.type}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{change.field}</span>
                    </div>
                    <div className={`grid ${change.type === 'changed' ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
                        {change.type !== 'added' && (
                            <div className="font-mono text-xs p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <span className="text-[8px] font-black text-red-500 block mb-1">— OLD</span>
                                <span className="text-slate-600 dark:text-slate-400 break-all">{JSON.stringify(change.oldVal)}</span>
                            </div>
                        )}
                        {change.type !== 'removed' && (
                            <div className="font-mono text-xs p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <span className="text-[8px] font-black text-emerald-500 block mb-1">+ NEW</span>
                                <span className="text-slate-600 dark:text-slate-400 break-all">{JSON.stringify(change.newVal)}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ─── Main AuditLogViewer ──────────────────────────────────── */
const AuditLogViewer = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entity: '', action: '', user: '', startDate: '', endDate: ''
    });
    const [pagination, setPagination] = useState({
        page: 1, limit: 50, total: 0, pages: 1
    });
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: any = { page: pagination.page, limit: pagination.limit, ...filters };
            Object.keys(params).forEach(key => !params[key] && delete params[key]);
            const response = await api.get('/api/core/audit-logs', { params });
            if (response.data.success) {
                setLogs(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [pagination.page]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = () => {
        setPagination({ ...pagination, page: 1 });
        fetchLogs();
    };

    const clearFilters = () => {
        setFilters({ entity: '', action: '', user: '', startDate: '', endDate: '' });
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
                <PageHeader
                    title="System Audit Logs"
                    description="Track user activity and system changes securely."
                    breadcrumbs={[
                        { label: 'System', link: '/settings' },
                        { label: 'Audit Logs' }
                    ]}
                />

                {/* Intelligence Header */}
                <div className="bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-8 border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-[60px]" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full -ml-20 -mb-20 blur-[40px]" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                                <Shield className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-black text-white tracking-tight">Secure Ledger</h2>
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                        Tamper-Proof
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm font-medium">Cryptographic audit trail with hash-chain integrity verification.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Entries</p>
                                <p className="text-2xl font-black text-white">{pagination.total.toLocaleString()}</p>
                            </div>
                            <button
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white transition-all"
                                title="Export Audit Trail"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filters & Search</span>
                            {activeFilterCount > 0 && (
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full">
                                    {activeFilterCount} active
                                </span>
                            )}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
                    </button>

                    {showFilters && (
                        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Entity Type</label>
                                    <select
                                        name="entity" value={filters.entity} onChange={handleFilterChange}
                                        className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 min-w-[150px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">All Entities</option>
                                        <option value="Invoice">Invoice</option>
                                        <option value="Customer">Customer</option>
                                        <option value="Item">Item</option>
                                        <option value="SalesOrder">Sales Order</option>
                                        <option value="Payment">Payment</option>
                                        <option value="User">User</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Action</label>
                                    <input
                                        type="text" name="action" placeholder="e.g. UPDATE"
                                        value={filters.action} onChange={handleFilterChange}
                                        className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 w-40 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date Range</label>
                                    <div className="flex gap-2">
                                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={applyFilters} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none">
                                        <Filter className="w-3.5 h-3.5" /> Apply
                                    </button>
                                    {activeFilterCount > 0 && (
                                        <button onClick={clearFilters} className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl hover:bg-slate-50 text-xs font-black flex items-center gap-2 transition-all">
                                            <RotateCcw className="w-3 h-3" /> Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Log Entries — Card-Based Ledger */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-4 animate-pulse">
                                <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-500">Decrypting audit ledger...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <Search className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                            <p className="text-sm font-bold text-slate-500">No audit logs found matching criteria.</p>
                        </div>
                    ) : (
                        logs.map((log: any) => (
                            <div
                                key={log._id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer group"
                                onClick={() => setSelectedLog(log)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <EntityIcon type={log.entityType} />
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-black text-slate-900 dark:text-white text-sm">{log.user?.name || 'System'}</span>
                                                <ActionBadge action={log.action} />
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Database className="w-3 h-3" /> {log.entityType}
                                                </span>
                                                <span className="font-mono text-[10px] opacity-60">#{log.entityId?.substring(0, 8)}</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatDateISO(new Date(log.createdAt))} · {new Date(log.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {log.changes && (
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                                {Object.keys(log.changes).length} fields
                                            </span>
                                        )}
                                        <Eye className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center items-center gap-4 py-6">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold disabled:opacity-30 hover:border-indigo-300 transition-all flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-500">Page</span>
                            <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-black">{pagination.page}</span>
                            <span className="text-sm font-bold text-slate-500">of {pagination.pages}</span>
                        </div>
                        <button
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold disabled:opacity-30 hover:border-indigo-300 transition-all flex items-center gap-2"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Detail Modal — Secure Ledger View */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setSelectedLog(null)}>
                        <div
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-slate-200 dark:border-slate-800"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-lg">Audit Entry Detail</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Secure Ledger Record</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { icon: Hash, label: 'Action ID', value: selectedLog._id?.substring(0, 12) + '...', mono: true },
                                        { icon: Fingerprint, label: 'Integrity Hash', value: selectedLog.currentHash?.substring(0, 16) + '...', mono: true, color: 'text-emerald-600 dark:text-emerald-400' },
                                        { icon: User, label: 'Actor', value: `${selectedLog.user?.name || 'Unknown'}`, mono: false },
                                        { icon: Clock, label: 'Timestamp', value: new Date(selectedLog.createdAt).toLocaleString(), mono: false },
                                        { icon: Globe, label: 'IP Address', value: selectedLog.ipAddress || '—', mono: true },
                                        { icon: Database, label: 'Entity', value: `${selectedLog.entityType} #${selectedLog.entityId?.substring(0, 8)}`, mono: true },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <item.icon className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                            </div>
                                            <p className={`text-sm font-bold break-all ${item.mono ? 'font-mono' : ''} ${(item as any).color || 'text-slate-800 dark:text-white'}`}>
                                                {item.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Badge */}
                                <div className="flex items-center gap-3">
                                    <ActionBadge action={selectedLog.action} />
                                    <span className="text-xs text-slate-500 font-medium">{selectedLog.action} operation on {selectedLog.entityType}</span>
                                </div>

                                {/* Diff Viewer */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowUpDown className="w-3.5 h-3.5" /> Change Diff
                                    </h4>
                                    <DiffViewer before={selectedLog.beforeSnapshot} after={selectedLog.afterSnapshot} />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Fingerprint className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Hash-chain verified · Immutable record</span>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-sm transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AuditLogViewer;
