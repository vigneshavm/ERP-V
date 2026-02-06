import React, { useState, useEffect } from 'react';
import Layout from '../../../components/shared/Layout/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { Search, Filter, Download, Shield, Eye, Calendar } from 'lucide-react';
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title="System Audit Logs"
                    description="Track user activity and system changes securely."
                    breadcrumbs={[
                        { label: 'System', link: '/settings' },
                        { label: 'Audit Logs' }
                    ]}
                />

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end mt-6">
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Entity Type</label>
                        <select
                            name="entity"
                            value={filters.entity}
                            onChange={handleFilterChange}
                            className="p-2 border rounded-lg text-sm bg-gray-50 min-w-[150px]"
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
                        <label className="text-xs font-medium text-gray-500 block mb-1">Action</label>
                        <input
                            type="text"
                            name="action"
                            placeholder="e.g. UPDATE"
                            value={filters.action}
                            onChange={handleFilterChange}
                            className="p-2 border rounded-lg text-sm bg-gray-50 w-40"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="p-2 border rounded-lg text-sm bg-gray-50"
                            />
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="p-2 border rounded-lg text-sm bg-gray-50"
                            />
                        </div>
                    </div>

                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                    >
                        <Filter size={16} /> Filter
                    </button>
                </div>

                {/* Log List */}
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50/50">
                                <th className="px-6 py-3 font-medium">Timestamp</th>
                                <th className="px-6 py-3 font-medium">User</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                                <th className="px-6 py-3 font-medium">Entity</th>
                                <th className="px-6 py-3 font-medium">Changes</th>
                                <th className="px-6 py-3 font-medium text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No audit logs found matching criteria.</td>
                                </tr>
                            ) : (
                                logs.map((log: any) => (
                                    <tr key={log._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                                            {formatDateISO(new Date(log.createdAt))}
                                            <div className="text-xs text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                            {log.user?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium 
                                                ${log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                                                    log.action.includes('UPDATE') ? 'bg-amber-100 text-amber-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">
                                            {log.entityType} <span className="text-xs text-gray-400">#{log.entityId?.substring(0, 8)}...</span>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-gray-500">
                                            {/* Quick Diff Summary if needed, else plain text */}
                                            {log.changes ? `${Object.keys(log.changes).length} fields changed` : 'See details'}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-100">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
                            <button
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Shield size={18} className="text-indigo-600" />
                                    Log Details
                                </h3>
                                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Action ID</label>
                                        <p className="font-mono text-sm">{selectedLog._id}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Integrity Hash</label>
                                        <p className="font-mono text-xs text-green-600 break-all">{selectedLog.currentHash?.substring(0, 20)}...</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">User</label>
                                        <p className="font-medium">{selectedLog.user?.name} ({selectedLog.user?.email})</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Timestamp</label>
                                        <p className="font-medium">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">IP Address</label>
                                        <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-bold text-sm mb-2 text-gray-700">Snapshot Data</h4>

                                    {selectedLog.afterSnapshot ? (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-green-600 uppercase">New/Updated State</p>
                                            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">{JSON.stringify(selectedLog.afterSnapshot, null, 2)}</pre>
                                        </div>
                                    ) : null}

                                    {selectedLog.beforeSnapshot ? (
                                        <div className="space-y-2 mt-4">
                                            <p className="text-xs font-bold text-red-600 uppercase">Previous/Deleted State</p>
                                            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">{JSON.stringify(selectedLog.beforeSnapshot, null, 2)}</pre>
                                        </div>
                                    ) : null}

                                    {!selectedLog.beforeSnapshot && !selectedLog.afterSnapshot && (
                                        <p className="text-sm text-gray-500 italic">No snapshot data available.</p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
