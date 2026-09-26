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
import Layout from '../../components/shared/Layout/index';

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

type CategoriesResponse = ApiResponse<Category[]>;

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
        if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-50" />;
        return order === 'asc'
            ? <ArrowUp className="w-3 h-3 text-primary" />
            : <ArrowDown className="w-3 h-3 text-primary" />;
    };

    if (error) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-sm h-[500px]">
                    <div className="w-12 h-12 bg-danger-soft dark:bg-danger-soft text-danger rounded-xl flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Connection Failed</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
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
        <div className="text-slate-900 dark:text-slate-100 space-y-6 animate-in fade-in duration-500 pt-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-primary" />
                        Category Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Enterprise taxonomy control and inventory grouping.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    { label: 'Total Items SKUs', value: stats?.totalItems.toLocaleString() || '-', icon: Package, color: 'text-success', bg: 'bg-success-soft dark:bg-success-soft' },
                    { label: 'Stock Valuation', value: stats ? `₹${(stats.totalStockValue / 1000000).toFixed(2)}M` : '-', icon: TrendingUp, color: 'text-warning', bg: 'bg-warning-soft dark:bg-warning-soft' },
                    { label: 'Avg Items / Cat', value: stats?.avgItemsPerCategory.toLocaleString() || '-', icon: BarChart3, color: 'text-primary', bg: 'bg-primary-soft dark:bg-primary-soft' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Controls Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-700/50">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        {isLoading && search && (
                            <Loader2 className="w-3 h-3 text-primary absolute right-3 top-3 animate-spin" />
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" onClick={refreshData} title="Refresh Data">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm">
                            <Filter className="w-3.5 h-3.5" /> Filters
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20"
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
                                        className={`px-6 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
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
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded ml-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-24 text-center text-slate-500">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No results found</h4>
                                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20"
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
                                                    <p className="font-bold text-slate-900 dark:text-slate-100">{cat.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{cat.description || 'No description provided'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold ${cat.itemCount > 0 ? 'text-primary' : 'text-slate-400'}`}>
                                                {cat.itemCount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400 font-bold">
                                            ₹{cat.stockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs font-bold border border-slate-200 dark:border-slate-600">
                                                {cat.defaultUnit || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs font-bold border border-slate-200 dark:border-slate-600">
                                                {cat.gstRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${cat.riskFlag === 'HEALTHY' ? 'bg-success-soft dark:bg-success-soft text-success border-success-line dark:border-success/30' :
                                                cat.riskFlag === 'OVERSTOCKED' ? 'bg-warning-soft dark:bg-warning-soft text-warning border-warning-line dark:border-warning/30' :
                                                    'bg-danger-soft dark:bg-danger-soft text-danger border-danger-line dark:border-danger/30'
                                                }`}>
                                                {(cat.riskFlag || 'HEALTHY').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${cat.pricingHealth === 'GOOD' ? 'bg-success' :
                                                    cat.pricingHealth === 'LOW_MARGIN' ? 'bg-warning' : 'bg-danger'
                                                    }`} />
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    {(cat.pricingHealth || 'GOOD').replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-400">
                                                <button className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:text-primary rounded-lg hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-danger-soft dark:hover:bg-danger-soft hover:text-danger rounded-lg border border-transparent hover:border-danger-line dark:hover:border-danger/30 transition-all">
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
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Page <span className="font-bold text-slate-900 dark:text-slate-100">{page}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isLoading}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-1"
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
                    className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FolderPlus className="w-5 h-5 text-primary" /> New Category
                        </h3>
                        <button
                            onClick={closeNewCategoryModal}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateCategory}>
                        <div className="px-6 py-5 space-y-4">
                            {createCategoryError && (
                                <div className="px-3 py-2 bg-danger-soft dark:bg-danger-soft border border-danger-line dark:border-danger/30 text-danger text-sm rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createCategoryError}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                    Category Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newCategoryForm.name}
                                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Electronics"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={newCategoryForm.description}
                                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional description"
                                    rows={2}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                        GST Rate
                                    </label>
                                    <select
                                        value={newCategoryForm.gstRate}
                                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, gstRate: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    >
                                        {[0, 5, 12, 18, 28].map(rate => (
                                            <option key={rate} value={rate}>{rate}%</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                        Default Unit
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategoryForm.defaultUnit}
                                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, defaultUnit: e.target.value }))}
                                        placeholder="pcs"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                    Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={newCategoryForm.color}
                                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                                    />
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: newCategoryForm.color }}>
                                        {(newCategoryForm.name.charAt(0) || '?').toUpperCase()}
                                    </div>
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{newCategoryForm.color}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeNewCategoryModal}
                                disabled={isCreatingCategory}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
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
