import React, { useState, useEffect } from 'react';
import Layout from '../../../components/shared/Layout/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { Search, Filter, Download, Shield, Eye, Calendar, Clock, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../services/api';
import { formatDateISO } from '../../../utils/helpers';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        user: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        pages: 1
    });
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            };
            // Clean empty params
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

    useEffect(() => {
        fetchLogs();
    }, [pagination.page]); // Refetch on page change. Filters trigger manual refetch or debounced effect ideally.

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = () => {
        setPagination({ ...pagination, page: 1 });
        fetchLogs();
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto py-8">
                <PageHeader
                    title="System Audit Logs"
                    description="Track user activity and system changes securely."
                    breadcrumbs={[
                        { label: 'System', link: '/settings' },
                        { label: 'Audit Logs' }
                    ]}
                />

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-5 items-end mb-8 transition-colors">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5 uppercase">Entity Type</label>
                        <select
                            name="entity"
                            value={filters.entity}
                            onChange={handleFilterChange}
                            className="w-full p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5 uppercase">Action</label>
                        <input
                            type="text"
                            name="action"
                            placeholder="e.g. UPDATE"
                            value={filters.action}
                            onChange={handleFilterChange}
                            className="w-full p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5 uppercase">Date Range</label>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="pl-9 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                            <span className="text-neutral-400">-</span>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="pl-9 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={applyFilters}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 text-sm font-bold flex items-center gap-2 shadow-sm shadow-primary/20 transition-all"
                    >
                        <Filter size={16} /> Filter
                    </button>
                </div>

                {/* Log List */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
                                    <th className="px-6 py-4 font-bold">Timestamp</th>
                                    <th className="px-6 py-4 font-bold">User</th>
                                    <th className="px-6 py-4 font-bold">Action</th>
                                    <th className="px-6 py-4 font-bold">Entity</th>
                                    <th className="px-6 py-4 font-bold">Changes</th>
                                    <th className="px-6 py-4 font-bold text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm font-medium">Loading audit logs...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-neutral-500 dark:text-neutral-400">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                                                    <Shield className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                                                </div>
                                                <p className="text-sm font-medium">No audit logs found matching criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log: any) => (
                                        <tr key={log._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-400 group-hover:bg-white dark:group-hover:bg-neutral-700 transition-colors">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                                            {formatDateISO(new Date(log.createdAt))}
                                                        </div>
                                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                                                            {new Date(log.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                        {log.user?.name ? log.user.name.substring(0, 2) : 'U'}
                                                    </div>
                                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                                        {log.user?.name || 'Unknown User'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                                                    ${log.action.includes('DELETE') ? 'bg-error/10 text-error border border-error/20' :
                                                        log.action.includes('UPDATE') ? 'bg-warning/10 text-warning border border-warning/20' :
                                                            'bg-success/10 text-success border border-success/20'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-3.5 h-3.5 text-neutral-400" />
                                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{log.entityType}</span>
                                                    <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">#{log.entityId?.substring(0, 8)}...</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                                {/* Quick Diff Summary if needed, else plain text */}
                                                {log.changes ? (
                                                    <span className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                        {Object.keys(log.changes).length} fields changed
                                                    </span>
                                                ) : 'See details'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="inline-flex p-2 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                Showing page <span className="text-neutral-900 dark:text-white font-bold">{pagination.page}</span> of <span className="text-neutral-900 dark:text-white font-bold">{pagination.pages}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                    className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={pagination.page === pagination.pages}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                    className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
                                <h3 className="font-black text-lg text-neutral-900 dark:text-white flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Shield size={18} />
                                    </div>
                                    Audit Log Details
                                </h3>
                                <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1 block">Action ID</label>
                                        <p className="font-mono text-xs text-neutral-900 dark:text-white font-medium truncate" title={selectedLog._id}>{selectedLog._id}</p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80 md:col-span-2">
                                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1 block">Integrity Hash</label>
                                        <p className="font-mono text-xs text-success font-medium truncate" title={selectedLog.currentHash}>{selectedLog.currentHash || 'N/A'}</p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1 block">User</label>
                                        <p className="font-medium text-sm text-neutral-900 dark:text-white truncate" title={selectedLog.user?.email}>{selectedLog.user?.name || 'Unknown'}</p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1 block">Timestamp</label>
                                        <p className="font-medium text-sm text-neutral-900 dark:text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1 block">IP Address</label>
                                        <p className="font-mono text-sm text-neutral-900 dark:text-white">{selectedLog.ipAddress || 'Unknown'}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="font-black text-sm uppercase tracking-wider text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">Snapshot Data</h4>

                                    {selectedLog.afterSnapshot ? (
                                        <div className="space-y-2.5">
                                            <p className="text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-success"></span>
                                                New/Updated State
                                            </p>
                                            <div className="bg-neutral-950 dark:bg-[#0a0a0a] rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-success"></div>
                                                <pre className="text-[11px] font-mono text-neutral-300 p-4 overflow-x-auto custom-scrollbar">
                                                    {JSON.stringify(selectedLog.afterSnapshot, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ) : null}

                                    {selectedLog.beforeSnapshot ? (
                                        <div className="space-y-2.5 mt-6">
                                            <p className="text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-error"></span>
                                                Previous/Deleted State
                                            </p>
                                            <div className="bg-neutral-950 dark:bg-[#0a0a0a] rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
                                                <pre className="text-[11px] font-mono text-neutral-300 p-4 overflow-x-auto custom-scrollbar">
                                                    {JSON.stringify(selectedLog.beforeSnapshot, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ) : null}

                                    {!selectedLog.beforeSnapshot && !selectedLog.afterSnapshot && (
                                        <div className="bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                            <Database className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mb-3" />
                                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No snapshot data available for this action.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-end">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-5 py-2.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                                >
                                    Close Details
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
