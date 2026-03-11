import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "@/shared/ui/Layout/Layout";
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
    XCircle
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
        if (!confirm('Delete this estimate?')) return;

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
                toast.success('Estimate deleted');
                fetchEstimates();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete estimate');
        }
    };

    // KPI calculations
    const totalEstimates = estimates.length;
    const totalValue = estimates.reduce((sum, est) => sum + (est.totalAmount || 0), 0);
    const acceptedCount = estimates.filter(e => e.status === 'accepted').length;
    const draftCount = estimates.filter(e => e.status === 'draft').length;

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string, text: string, icon: any }> = {
            draft: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
            sent: { bg: 'bg-blue-50', text: 'text-blue-700', icon: FileText },
            accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
            rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle }
        };
        const badge = badges[status] || badges.draft;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
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
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading estimates...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <Calculator className="w-6 h-6 text-indigo-600" />
                            Estimates
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">View and manage all estimates</p>
                    </div>
                    <button
                        onClick={() => navigate('/sales/estimate')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-medium"
                    >
                        <Plus className="w-4 h-4" /> Create Estimate
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Estimates</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalEstimates}</h3>
                            </div>
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">₹{totalValue.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <Calculator className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accepted</p>
                                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{acceptedCount}</h3>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts</p>
                                <h3 className="text-2xl font-bold text-slate-600 mt-1">{draftCount}</h3>
                            </div>
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Island + Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative w-full md:max-w-md group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search estimate # or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all shadow-sm"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-3">Estimate #</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredEstimates.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-slate-100 p-3 rounded-full mb-3">
                                                    <FileText className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-600 font-medium">No estimates found</p>
                                                <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEstimates.map((estimate) => (
                                        <tr key={estimate._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/sales/estimate/${estimate._id}`)}
                                                    className="font-bold text-indigo-600 hover:text-indigo-800"
                                                >
                                                    {estimate.estimateNo}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                                                {(typeof estimate.customer === 'object' && estimate.customer?.name) || 'Walk-in Customer'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(estimate.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 text-right">
                                                ₹{estimate.totalAmount?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(estimate.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/sales/estimate/${estimate._id}`)}
                                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(estimate._id || '')}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Delete"
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
                </div>
            </div>
        </Layout>
    );
};

export default EstimateList;

