
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import {
    getAllSuppliers,
    deleteSupplier,
    setSelectedSupplier,
} from '../redux/slices/supplierSlice';
import { setActiveTab } from '../redux/slices/uiSlice';

import {
    Search,
    Plus,
    Filter,
    ArrowUpDown,
    Download,
    Eye,
    Pencil,
    Trash2,
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    X,
    LayoutGrid,
    List,
    IndianRupee,
    ChevronRight,
    Loader2
} from 'lucide-react';

import VendorForm from './VendorForm';
import { Vendor } from '../types/vendor';

const VendorManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { suppliers, isLoading, isError, message } = useSelector((state: RootState) => state.suppliers);
    const { activeTab } = useSelector((state: RootState) => state.ui);

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [showForm, setShowForm] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        dispatch(getAllSuppliers());
    }, [dispatch]);

    const handleEdit = (vendor: any) => {
        dispatch(setSelectedSupplier(vendor));
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
            setIsDeleting(id);
            try {
                await dispatch(deleteSupplier(id)).unwrap();
            } catch (err) {
                console.error('Failed to delete vendor:', err);
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const filteredVendors = suppliers?.filter(v =>
        v.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contactPersonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.gstNo?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (showForm) {
        return <VendorForm />;
    }

    return (
        <div className="space-y-6 p-4 md:p-8 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen">
            {/* Header section with KPIs and actions would go here */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" />
                        Vendor Network
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Manage your supply chain and trade partners</p>
                </div>
                <button
                    onClick={() => {
                        dispatch(setSelectedSupplier(null));
                        setShowForm(true);
                    }}
                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Onboard New Vendor
                </button>
            </div>

            {/* Error Message */}
            {(isError || message) && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold">
                    <AlertCircle className="w-5 h-5" />
                    <span>{message}</span>
                    <button onClick={() => dispatch(getAllSuppliers())} className="ml-auto underline">Try Again</button>
                </div>
            )}

            {/* Main Table/Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, contact or GSTIN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-indigo-500/20 dark:text-white transition-all"
                        />
                    </div>
                    {/* View mode toggle and filters would go here */}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Business Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Point</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Balance Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">Synchronizing Vendor Network...</p>
                                    </td>
                                </tr>
                            ) : filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No Vendors Found</h3>
                                        <p className="text-slate-500">Start by adding your first trade partner to the system.</p>
                                    </td>
                                </tr>
                            ) : filteredVendors.map((vendor: any) => (
                                <tr key={vendor._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400">
                                                {vendor.businessName?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{vendor.businessName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                    <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter text-[10px]">{vendor.supplierId}</span>
                                                    <span>{vendor.gstNo || 'No GSTIN'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{vendor.contactPersonName}</div>
                                        <div className="text-xs text-slate-500 mt-1">{vendor.contactNo}</div>
                                    </td>
                                    <td className="px-6 py-5 font-mono">
                                        <div className={`text-sm font-bold ${vendor.balanceType === 'payable' ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {vendor.balanceType === 'payable' ? '-' : '+'} ₹{vendor.currentBalance?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest">{vendor.balanceType} balance</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${vendor.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-500'
                                            }`}>
                                            {vendor.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => handleEdit(vendor)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"><Pencil className="w-4.5 h-4.5" /></button>
                                            <button
                                                onClick={() => handleDelete(vendor._id || vendor.id)}
                                                disabled={isDeleting === (vendor._id || vendor.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                                            >
                                                {isDeleting === (vendor._id || vendor.id) ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Trash2 className="w-4.5 h-4.5" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorManager;
