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
    Package,
    TrendingUp,
    BarChart3,
    Edit,
    Trash2,
    X,
    Check
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import api from '../../services/api';
import Layout from '../../components/shared/Layout';

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
    avgItemsPerCategory: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    stats?: Stats;
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
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter/Sort Configuration
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState<keyof Category>('stockValue');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // New Category Modal State
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [newCategoryForm, setNewCategoryForm] = useState({
        name: '',
        description: '',
        color: '#6366f1',
        gstRate: 5,
        defaultUnit: 'pcs'
    });
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);

    // Export State
    const [isExporting, setIsExporting] = useState(false);

    // Sector Context
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { user } = useSelector((state: RootState) => state.auth);
    const currentTenant = tenants.find(t => t.id === user?.tenantId);
    const sector = currentTenant?.sector || 'General';

    // Debounce Search Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Data Fetching
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get<CategoriesResponse>('/api/inventory/categories', {
                params: {
                    page,
                    limit: 25,
                    search: debouncedSearch,
                    sortBy,
                    order,
                    sector
                }
            });

            const catData = response.data;

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
            const message = err.response?.data?.message || err.message || 'Network Error';
            setError(message);
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
            setOrder('desc');
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

    const openNewCategoryModal = () => {
        setNewCategoryForm({ name: '', description: '', color: '#6366f1', gstRate: 5, defaultUnit: 'pcs' });
        setCreateCategoryError(null);
        setShowNewCategoryModal(true);
    };

    const closeNewCategoryModal = () => {
        if (isCreatingCategory) return;
        setShowNewCategoryModal(false);
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newCategoryForm.name.trim();
        if (!name) {
            setCreateCategoryError('Category name is required');
            return;
        }
        setIsCreatingCategory(true);
        setCreateCategoryError(null);
        try {
            const response = await api.post<ApiResponse<Category>>('/api/inventory/categories', {
                name,
                description: newCategoryForm.description.trim() || undefined,
                color: newCategoryForm.color,
                gstRate: newCategoryForm.gstRate,
                defaultUnit: newCategoryForm.defaultUnit.trim() || 'pcs'
            });
            if (response.data.success) {
                setShowNewCategoryModal(false);
                setPage(1);
                fetchData();
            } else {
                throw new Error(response.data.message || 'Failed to create category');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to create category';
            setCreateCategoryError(message);
        } finally {
            setIsCreatingCategory(false);
        }
    };

    // Escapes a value for safe inclusion in a CSV cell: wraps in quotes and
    // doubles any embedded quotes whenever the value contains a comma, quote,
    // or newline that would otherwise break column alignment.
    const csvEscape = (value: unknown): string => {
        const str = value === null || value === undefined ? '' : String(value);
        if (/[",\n]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Pull the full (unpaginated) list respecting the current search,
            // rather than just the 25 rows visible on the current page.
            const response = await api.get<CategoriesResponse>('/api/inventory/categories', {
                params: {
                    page: 1,
                    limit: 100000,
                    search: debouncedSearch,
                    sortBy,
                    order,
                    sector
                }
            });

            const catData = response.data;
            if (!catData.success) {
                throw new Error(catData.message || 'Failed to export categories');
            }

            const headers = ['Name', 'Description', 'Item Count', 'Stock Value', 'Default Unit', 'GST Rate', 'Risk Status', 'Pricing Health', 'Active'];
            const rows = catData.data.map(cat => [
                cat.name,
                cat.description || '',
                cat.itemCount,
                cat.stockValue,
                cat.defaultUnit || '',
                cat.gstRate,
                cat.riskFlag || '',
                cat.pricingHealth || '',
                cat.isActive ? 'Yes' : 'No'
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.map(csvEscape).join(','))
                .join('\r\n');

            // Prepend a UTF-8 BOM so Excel renders non-ASCII characters (e.g. ₹) correctly.
            const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            link.href = url;
            link.setAttribute('download', `categories-export-${timestamp}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Export failed:', err);
            alert(err.response?.data?.message || err.message || 'Failed to export categories');
        } finally {
            setIsExporting(false);
        }
    };

    // Render Helpers
    const getSortIcon = (field: keyof Category) => {
        if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-50" />;
        return order === 'asc'
            ? <ArrowUp className="w-3 h-3 text-primary" />
            : <ArrowDown className="w-3 h-3 text-primary" />;
    };

    if (error) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center p-12 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-sm h-[500px]">
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Connection Failed</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-center max-w-md">
                        Unable to retrieve category data. Please ensure the backend server is running and accessible.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Retry Connection
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
        <div className="text-neutral-900 dark:text-neutral-100 space-y-6 animate-in fade-in duration-500 pt-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-primary" />
                        Category Management
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                        Enterprise taxonomy control and inventory grouping.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
                    </button>
                    <button
                        onClick={openNewCategoryModal}
                        className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
                    >
                        <FolderPlus className="w-4 h-4" /> New Category
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Categories', value: stats?.totalCategories.toLocaleString() || '-', icon: Layers, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Total Items SKUs', value: stats?.totalItems.toLocaleString() || '-', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Stock Valuation', value: stats ? `₹${(stats.totalStockValue / 1000000).toFixed(2)}M` : '-', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Avg Items / Cat', value: stats?.avgItemsPerCategory.toLocaleString() || '-', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-neutral-800 p-5 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                {/* Controls Toolbar */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-50/50 dark:bg-neutral-700/50">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                        {isLoading && search && (
                            <Loader2 className="w-3 h-3 text-primary absolute right-3 top-3 animate-spin" />
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" onClick={refreshData} title="Refresh Data">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm">
                            <Filter className="w-3.5 h-3.5" /> Filters
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-700/50 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-xs tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary/20"
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
                                        className={`px-6 py-4 cursor-pointer group hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-${col.align}`}
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
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded ml-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-8 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-700 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-24 text-center text-neutral-500">
                                        <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-1">No results found</h4>
                                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary/20"
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
                                                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{cat.name}</p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">{cat.description || 'No description provided'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold ${cat.itemCount > 0 ? 'text-primary' : 'text-neutral-400'}`}>
                                                {cat.itemCount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-neutral-600 dark:text-neutral-400 font-bold">
                                            ₹{cat.stockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded text-xs font-bold border border-neutral-200 dark:border-neutral-600">
                                                {cat.defaultUnit || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded text-xs font-bold border border-neutral-200 dark:border-neutral-600">
                                                {cat.gstRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${cat.riskFlag === 'HEALTHY' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30' :
                                                cat.riskFlag === 'OVERSTOCKED' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30' :
                                                    'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/30'
                                                }`}>
                                                {(cat.riskFlag || 'HEALTHY').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${cat.pricingHealth === 'GOOD' ? 'bg-emerald-500' :
                                                    cat.pricingHealth === 'LOW_MARGIN' ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`} />
                                                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                    {(cat.pricingHealth || 'GOOD').replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-neutral-400">
                                                <button className="p-2 hover:bg-white dark:hover:bg-neutral-700 hover:text-primary rounded-lg hover:shadow-sm border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600 transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 rounded-lg border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 transition-all">
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
                <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-700/50 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Page <span className="font-bold text-neutral-900 dark:text-neutral-100">{page}</span> of <span className="font-bold text-neutral-900 dark:text-neutral-100">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isLoading}
                            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-1"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {showNewCategoryModal && (
            <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={closeNewCategoryModal}
            >
                <div
                    className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-xl w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <FolderPlus className="w-5 h-5 text-primary" /> New Category
                        </h3>
                        <button
                            onClick={closeNewCategoryModal}
                            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateCategory}>
                        <div className="px-6 py-5 space-y-4">
                            {createCategoryError && (
                                <div className="px-3 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createCategoryError}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                    Category Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newCategoryForm.name}
                                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Electronics"
                                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={newCategoryForm.description}
                                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional description"
                                    rows={2}
                                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                        GST Rate
                                    </label>
                                    <select
                                        value={newCategoryForm.gstRate}
                                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, gstRate: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    >
                                        {[0, 5, 12, 18, 28].map(rate => (
                                            <option key={rate} value={rate}>{rate}%</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                        Default Unit
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategoryForm.defaultUnit}
                                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, defaultUnit: e.target.value }))}
                                        placeholder="pcs"
                                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                    Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={newCategoryForm.color}
                                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                                        className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer bg-transparent"
                                    />
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: newCategoryForm.color }}>
                                        {(newCategoryForm.name.charAt(0) || '?').toUpperCase()}
                                    </div>
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">{newCategoryForm.color}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeNewCategoryModal}
                                disabled={isCreatingCategory}
                                className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreatingCategory}
                                className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Create Category
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </Layout>
    );
};

export default CategoryManager;
