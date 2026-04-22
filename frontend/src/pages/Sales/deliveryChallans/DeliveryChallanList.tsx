import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from "../../../components/shared/Layout/Layout";
import { getAllDeliveryChallans, deleteDeliveryChallan, convertToInvoice, reset } from "../../../redux/slices/deliveryChallanSlice";
import { RootState } from "../../../redux/store";
import {
    Truck,
    Plus,
    Search,
    Eye,
    Trash2,
    FileText,
    CheckCircle,
    Clock,
    ArrowRightCircle,
    Package
} from 'lucide-react';

const DeliveryChallanList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { challans, isLoading, isError, message } = useSelector((state: RootState) => state.deliveryChallan);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [convertConfirm, setConvertConfirm] = useState<string | null>(null);

    useEffect(() => {
        dispatch(getAllDeliveryChallans() as any);
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
        return () => {
            dispatch(reset());
        };
    }, [isError, message, dispatch]);

    const handleDelete = async (id: string) => {
        await dispatch(deleteDeliveryChallan(id) as any);
        setDeleteConfirm(null);
        toast.success('Delivery Challan deleted successfully');
        dispatch(getAllDeliveryChallans() as any);
    };

    const handleConvert = async (id: string) => {
        const result = await dispatch(convertToInvoice(id) as any);
        setConvertConfirm(null);

        if (result.type.includes('fulfilled')) {
            toast.success('Converted to Invoice successfully!');
            const payload = result.payload as any;
            if (payload?.invoice?._id) {
                navigate(`/sales/invoice/${payload.invoice._id}`);
            }
        }
    };

    // KPI calculations
    const challanArray = Array.isArray(challans) ? challans : [];
    const totalChallans = challanArray.length;
    const deliveredCount = challanArray.filter(c => c.status === 'Delivered').length;
    const convertedCount = challanArray.filter(c => c.status === 'Converted').length;
    const draftCount = challanArray.filter(c => c.status === 'Draft').length;

    const filteredChallans = challanArray.filter(challan => {
        const matchesSearch = challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (challan.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || challan.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string, text: string, icon: any }> = {
            Draft: { bg: 'bg-surface/50', text: 'text-main opacity-90', icon: Clock },
            Delivered: { bg: 'bg-info/10', text: 'text-blue-700', icon: Truck },
            Converted: { bg: 'bg-success/10', text: 'text-emerald-700', icon: CheckCircle }
        };
        const badge = badges[status] || badges.Draft;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-main tracking-tight flex items-center gap-2">
                            <Truck className="w-6 h-6 text-info" />
                            Delivery Challans
                        </h1>
                        <p className="text-sm text-secondary opacity-70 mt-1">View and manage delivery challans</p>
                    </div>
                    <button
                        onClick={() => {
                            dispatch(reset());
                            navigate('/sales/delivery-challan');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-sm transition-all font-medium"
                    >
                        <Plus className="w-4 h-4" /> Create Challan
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Total Challans</p>
                                <h3 className="text-2xl font-bold text-main mt-1">{totalChallans}</h3>
                            </div>
                            <div className="p-2 bg-info/10 rounded-lg text-info">
                                <Package className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Delivered</p>
                                <h3 className="text-2xl font-bold text-info mt-1">{deliveredCount}</h3>
                            </div>
                            <div className="p-2 bg-info/10 rounded-lg text-info">
                                <Truck className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Converted</p>
                                <h3 className="text-2xl font-bold text-success mt-1">{convertedCount}</h3>
                            </div>
                            <div className="p-2 bg-success/10 rounded-lg text-success">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl shadow-sm border border-default/20 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider">Drafts</p>
                                <h3 className="text-2xl font-bold text-secondary mt-1">{draftCount}</h3>
                            </div>
                            <div className="p-2 bg-surface/50 rounded-lg text-secondary">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Island + Table */}
                <div className="glass-panel rounded-xl shadow-sm border border-default/30 overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-5 border-b border-default/20 bg-surface/30">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:max-w-md group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-secondary opacity-50 group-focus-within:text-primary hover:text-primary-hover transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search challan # or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-default/40 rounded-lg glass-panel placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all shadow-sm"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-default/40 rounded-lg text-sm glass-panel focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Converted">Converted</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                            <p className="text-secondary opacity-70 font-medium">Loading challans...</p>
                        </div>
                    ) : filteredChallans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="bg-surface/50 p-3 rounded-full mb-3">
                                <FileText className="w-6 h-6 text-secondary opacity-50" />
                            </div>
                            <p className="text-secondary font-medium">No delivery challans found</p>
                            <p className="text-sm text-secondary opacity-50 mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface/40 border-b border-default/30">
                                    <tr className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">
                                        <th className="px-6 py-3">Challan No</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Customer</th>
                                        <th className="px-6 py-3 text-center">Items</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default/20 glass-panel">
                                    {filteredChallans.map((challan) => (
                                        <tr key={challan._id} className="hover:bg-surface/40 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                                    className="font-bold text-primary hover:text-indigo-800"
                                                >
                                                    {challan.challanNumber}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                {new Date(challan.challanDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-main">{challan.customer?.name || 'N/A'}</div>
                                                {challan.customer?.phone && (
                                                    <div className="text-xs text-secondary opacity-70">{challan.customer.phone}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface/50 text-main opacity-90">
                                                    {(challan.items || []).length} items
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(challan.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {challan.status !== 'Converted' && (
                                                        <>
                                                            <button
                                                                onClick={() => setConvertConfirm(challan._id)}
                                                                className="p-1.5 text-success hover:bg-success/10 rounded-lg"
                                                                title="Convert to Invoice"
                                                            >
                                                                <ArrowRightCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm(challan._id)}
                                                                className="p-1.5 text-danger hover:bg-danger/10 rounded-lg"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <h3 className="text-lg font-bold text-main mb-4">Confirm Delete</h3>
                            <p className="text-secondary mb-6">
                                Are you sure you want to delete this delivery challan? Stock will be restored.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-default/40 rounded-lg hover:bg-surface/40 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Convert Confirmation Modal */}
                {convertConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <h3 className="text-lg font-bold text-main mb-4">Convert to Invoice</h3>
                            <p className="text-secondary mb-6">
                                Are you sure you want to convert this challan to an invoice? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConvertConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-default/40 rounded-lg hover:bg-surface/40 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleConvert(convertConfirm)}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                                >
                                    Convert
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DeliveryChallanList;
