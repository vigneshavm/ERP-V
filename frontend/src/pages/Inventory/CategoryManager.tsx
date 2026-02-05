import React, { useState, useEffect, useCallback } from 'react';
import {
    Layers,
    Search,
    Download,
    FolderPlus,
    RefreshCw,
    AlertTriangle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Filter,
    CheckCircle2,
    Package,
    TrendingUp,
    BarChart3,
    Edit,
    Trash2
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

interface Category {
    id: string;
    name: string;
    description?: string;
    color: string;
    itemCount: number;
    stockValue: number;
    isActive: boolean;
    riskFlag: 'HEALTHY' | 'OVERSTOCKED' | 'LOW_TURNOVER';
    gstCompliance: 'OK' | 'MIXED';
    pricingHealth: 'GOOD' | 'LOW_MARGIN' | 'PROMO_NEEDED';
    gstRate: number;
    defaultUnit?: string;
}

interface Stats {
    totalCategories: number;
    totalItems: number;
    totalStockValue: number;
    avgItemsPerCategory: number; // Changed from avgItems to match backend
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    stats?: Stats; // Stats are now part of the envelope
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    message?: string;
}

interface CategoriesResponse extends ApiResponse<Category[]> { }

const CategoryManager: React.FC = () => {
    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [stats, setStats] = useState<{ totalCategories: number; totalItems: number; totalStockValue: number; avgItemsPerCategory: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter/Sort Configuration
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState<keyof Category>('stockValue');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedItems, setSelectedItems] = useState<string[]>([]); // Current page selection only

    // Sector Context
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { user } = useSelector((state: RootState) => state.auth);
    const currentTenant = tenants.find(t => t.id === user?.tenantId);
    const sector = currentTenant?.sector || 'General';

    // Debounce Search Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Data Fetching
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch Categories (V1 API includes stats)
            const catRes = await fetch(`http://localhost:5000/api/v1/categories?page=${page}&limit=25&search=${debouncedSearch}&sortBy=${sortBy}&order=${order}&sector=${sector}`);
            const catData: CategoriesResponse = await catRes.json();

            if (catData.success) {
                setCategories(catData.data);
                if (catData.meta) {
                    setTotalPages(catData.meta.totalPages);
                }
                if (catData.stats) {
                    setStats(catData.stats);
                }
            } else {
                throw new Error(catData.message || 'Failed to fetch categories');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Network Error - Ensure Backend is Running');
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, sortBy, order, sector]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers
    const handleSort = (field: keyof Category) => {
        if (sortBy === field) {
            setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setOrder('desc'); // Default to desc for new fields usually better for numbers
        }
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === categories.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(categories.map(c => c.id));
        }
    };

    const toggleSelectItem = (id: string) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const refreshData = () => {
        setPage(1);
        fetchData();
    };

    // Render Helpers
    const getSortIcon = (field: keyof Category) => {
        if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-50" />;
        return order === 'asc'
            ? <ArrowUp className="w-3 h-3 text-indigo-600" />
            : <ArrowDown className="w-3 h-3 text-indigo-600" />;
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-200 rounded-2xl h-[500px]">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Connection Failed</h3>
                <p className="text-slate-500 mb-6 text-center max-w-md">
                    Unable to retrieve category data. Please ensure the backend server is running on port 5000.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-indigo-600" />
                        Category Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Enterprise taxonomy control and inventory grouping.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95">
                        <FolderPlus className="w-4 h-4" /> New Category
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Categories', value: stats?.totalCategories.toLocaleString() || '-', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total Items SKUs', value: stats?.totalItems.toLocaleString() || '-', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Stock Valuation', value: stats ? `₹${(stats.totalStockValue / 1000000).toFixed(2)}M` : '-', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Avg Items / Cat', value: stats?.avgItemsPerCategory.toLocaleString() || '-', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Controls Toolbar */}
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        {isLoading && search && (
                            <Loader2 className="w-3 h-3 text-indigo-600 absolute right-3 top-3 animate-spin" />
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" onClick={refreshData} title="Refresh Data">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-1" />
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
                            <Filter className="w-3.5 h-3.5" /> Filters
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={categories.length > 0 && selectedItems.length === categories.length}
                                        onChange={toggleSelectAll}
                                        disabled={isLoading}
                                    />
                                </th>
                                {[
                                    { id: 'name', label: 'Category Name', align: 'left' },
                                    { id: 'itemCount', label: 'Total Items', align: 'center' },
                                    { id: 'stockValue', label: 'Stock Value', align: 'right' },
                                    { id: 'defaultUnit', label: 'Unit', align: 'center' },
                                    { id: 'gstRate', label: 'GST %', align: 'center' },
                                    { id: 'riskFlag', label: 'Risk Status', align: 'center' },
                                    { id: 'pricingHealth', label: 'Pricing Health', align: 'left' },
                                ].map((col) => (
                                    <th
                                        key={col.id}
                                        className={`px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors text-${col.align}`}
                                        onClick={() => handleSort(col.id as keyof Category)}
                                    >
                                        <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                            {col.label}
                                            {getSortIcon(col.id as keyof Category)}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                // Skeleton Loading State
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-4 bg-slate-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded ml-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-8 bg-slate-200 rounded mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 rounded-full mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-8 w-16 bg-slate-200 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-24 text-center text-slate-500">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-700 mb-1">No results found</h4>
                                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={selectedItems.includes(cat.id)}
                                                onChange={() => toggleSelectItem(cat.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: cat.color }}>
                                                    {cat.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{cat.name}</p>
                                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{cat.description || 'No description provided'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold ${cat.itemCount > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {cat.itemCount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-600 font-bold">
                                            ₹
                                            {cat.stockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                                                {cat.defaultUnit || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                                                {cat.gstRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${cat.riskFlag === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                cat.riskFlag === 'OVERSTOCKED' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                {cat.riskFlag.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${cat.pricingHealth === 'GOOD' ? 'bg-emerald-500' :
                                                    cat.pricingHealth === 'LOW_MARGIN' ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`} />
                                                <span className="text-xs font-medium text-slate-600">
                                                    {cat.pricingHealth.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-400">
                                                <button className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-transparent hover:border-rose-100 transition-all">
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

                {/* Pagination Toolbar */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isLoading}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-1"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
