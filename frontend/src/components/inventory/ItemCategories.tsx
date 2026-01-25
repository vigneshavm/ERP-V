import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { productTypes } from '../../data/demo/productTypes';
import {
    Search,
    Layers,
    FolderPlus,
    Edit,
    Trash2,
    Package,
    BarChart3,
    TrendingUp,
    Check,
    X,
    Palette,
    ChevronLeft,
    ChevronRight,
    Filter,
    Download,
    MoreVertical
} from 'lucide-react';

interface Category {
    id: string;
    name: string;
    description?: string;
    color: string;
    parentId?: string;
    itemCount: number;
    stockValue: number;
    isActive: boolean;
    deadstockPercentage: number;
    avgSellThroughDays: number;
    riskFlag: 'HEALTHY' | 'OVERSTOCKED' | 'LOW_TURNOVER' | 'STOCKOUT_RISK';
    recommendedAction: string;
    gstCompliance: 'OK' | 'MIXED' | 'NOT_MATCHING';
    pricingHealth: 'GOOD' | 'LOW_MARGIN' | 'PROMO_NEEDED';
    gstRate?: number;
}

const PRESET_COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'
];

const ItemCategories: React.FC = () => {
    const { products, categories: storeCategories } = useSelector((state: RootState) => state.inventory);

    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [page, setPage] = useState(1);
    const rowsPerPage = 25;

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formColor, setFormColor] = useState('#3b82f6');
    const [formParentId, setFormParentId] = useState<string>('');

    // Extract categories from products
    const inventoryCategories: Category[] = useMemo(() => {
        const categoryMap = new Map<string, { count: number; value: number; deadCount: number; lowMarginCount: number; gstMismatchCount: number }>();

        products.forEach(product => {
            const cat = product.category || 'Uncategorized';
            const existing = categoryMap.get(cat) || { count: 0, value: 0, deadCount: 0, lowMarginCount: 0, gstMismatchCount: 0 };
            const isDead = product.stock > 0 && Math.random() > 0.8;
            const isLowMargin = (product.price - product.cost) / product.price < 0.15;

            categoryMap.set(cat, {
                count: existing.count + 1,
                value: existing.value + (product.stock * product.cost),
                deadCount: existing.deadCount + (isDead ? 1 : 0),
                lowMarginCount: existing.lowMarginCount + (isLowMargin ? 1 : 0),
                gstMismatchCount: existing.gstMismatchCount
            });
        });

        return Array.from(categoryMap.entries()).map(([name, data], idx) => {
            const deadstockPercentage = Math.round((data.deadCount / data.count) * 100);
            const pricingHealth = data.lowMarginCount > (data.count * 0.3) ? 'LOW_MARGIN' : (deadstockPercentage > 25 ? 'PROMO_NEEDED' : 'GOOD');
            let riskFlag: Category['riskFlag'] = 'HEALTHY';
            if (deadstockPercentage > 30) riskFlag = 'LOW_TURNOVER';
            else if (data.value > 100000 && deadstockPercentage > 15) riskFlag = 'OVERSTOCKED';

            return {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                color: PRESET_COLORS[idx % PRESET_COLORS.length],
                itemCount: data.count,
                stockValue: data.value,
                isActive: true,
                deadstockPercentage,
                avgSellThroughDays: Math.floor(Math.random() * 40 + 10),
                riskFlag,
                recommendedAction: riskFlag === 'LOW_TURNOVER' ? 'Relocate stock' : 'Maintain levels',
                gstCompliance: data.gstMismatchCount > 0 ? 'MIXED' : 'OK',
                pricingHealth
            };
        });
    }, [products, storeCategories]);

    // Convert productTypes to Category format
    const productTypeCategories: Category[] = useMemo(() => {
        return productTypes.map((pt, idx) => ({
            id: pt.id,
            name: pt.name,
            description: pt.nameTamil || undefined,
            color: PRESET_COLORS[idx % PRESET_COLORS.length],
            itemCount: 0,
            stockValue: 0,
            isActive: true,
            deadstockPercentage: 0,
            avgSellThroughDays: 0,
            riskFlag: 'HEALTHY' as const,
            recommendedAction: 'Quick Entry Type',
            gstCompliance: 'OK' as const,
            pricingHealth: 'GOOD' as const,
            gstRate: pt.gstRate
        }));
    }, []);

    // Combine categories
    const categories = useMemo(() => {
        const inventoryNames = new Set(inventoryCategories.map(c => c.name.toUpperCase()));
        const uniqueProductTypes = productTypeCategories.filter(pt => !inventoryNames.has(pt.name.toUpperCase()));
        return [...inventoryCategories, ...uniqueProductTypes];
    }, [inventoryCategories, productTypeCategories]);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCategories.length / rowsPerPage);
    const displayedCategories = filteredCategories.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    // Summary stats
    const totalCategories = categories.length;
    const totalItems = categories.reduce((acc, c) => acc + c.itemCount, 0);
    const totalStockValue = categories.reduce((acc, c) => acc + c.stockValue, 0);

    const handleAddCategory = () => {
        if (!formName.trim()) return;
        console.log('Adding category:', { name: formName, description: formDescription, color: formColor, parentId: formParentId });
        resetForm();
    };

    const resetForm = () => {
        setFormName('');
        setFormDescription('');
        setFormColor('#3b82f6');
        setFormParentId('');
        setShowAddForm(false);
        setEditingCategory(null);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-6 h-6 text-primary" />
                        Item Categories
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">Manage {totalCategories} categories • {totalItems} items • ₹{totalStockValue.toLocaleString()} stock value</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <FolderPlus className="w-4 h-4" /> Add Category
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 uppercase font-medium">Categories</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalCategories}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                        <Package className="w-5 h-5 text-success" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 uppercase font-medium">Total Items</p>
                        <p className="text-xl font-bold text-success">{totalItems}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 uppercase font-medium">Stock Value</p>
                        <p className="text-xl font-bold text-warning">₹{(totalStockValue / 1000).toFixed(0)}k</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 uppercase font-medium">Avg Items/Cat</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalCategories > 0 ? Math.round(totalItems / totalCategories) : 0}</p>
                    </div>
                </div>
            </div>

            {/* Add/Edit Form Modal */}
            {(showAddForm || editingCategory) && (
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Name *</label>
                            <input
                                type="text"
                                placeholder="Category name..."
                                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Description</label>
                            <input
                                type="text"
                                placeholder="Brief description..."
                                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm"
                                value={formDescription}
                                onChange={e => setFormDescription(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block flex items-center gap-1">
                                <Palette className="w-3 h-3" /> Color
                            </label>
                            <div className="flex gap-1.5 flex-wrap">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`w-6 h-6 rounded-md border-2 ${formColor === color ? 'border-neutral-900 dark:border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleAddCategory} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2">
                            <Check className="w-4 h-4" /> {editingCategory ? 'Save' : 'Add'}
                        </button>
                        <button onClick={resetForm} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold flex items-center gap-2">
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                {/* Search & Filters */}
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <span>Showing <b className="text-neutral-900 dark:text-white">{displayedCategories.length}</b> of <b className="text-neutral-900 dark:text-white">{filteredCategories.length}</b></span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px] md:min-w-0">
                        <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-3 w-12 hidden sm:table-cell">#</th>
                                <th className="p-3">Category</th>
                                <th className="p-3 text-center">Items</th>
                                <th className="p-3 text-right hidden md:table-cell">Stock Value</th>
                                <th className="p-3 text-center hidden lg:table-cell">GST %</th>
                                <th className="p-3 text-center hidden md:table-cell">Status</th>
                                <th className="p-3 text-center hidden lg:table-cell">Health</th>
                                <th className="p-3 w-20 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {displayedCategories.map((category, idx) => (
                                <tr key={category.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                    <td className="p-3 text-neutral-400 font-mono text-xs hidden sm:table-cell">{(page - 1) * rowsPerPage + idx + 1}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div
                                                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: category.color }}
                                            >
                                                {category.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-neutral-900 dark:text-white truncate">{category.name}</p>
                                                {category.description && <p className="text-xs text-neutral-500 truncate">{category.description}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`font-bold ${category.itemCount > 0 ? 'text-primary' : 'text-neutral-400'}`}>
                                            {category.itemCount}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-mono hidden md:table-cell">
                                        {category.stockValue > 0 ? (
                                            <span className="text-success font-bold">₹{category.stockValue.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-neutral-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center hidden lg:table-cell">
                                        <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                            {category.gstRate ?? 5}%
                                        </span>
                                    </td>
                                    <td className="p-3 text-center hidden md:table-cell">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${category.riskFlag === 'HEALTHY' ? 'bg-success/10 text-success' :
                                            category.riskFlag === 'OVERSTOCKED' ? 'bg-warning/10 text-warning' :
                                                'bg-error/10 text-error'
                                            }`}>
                                            {category.riskFlag}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center hidden lg:table-cell">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${category.pricingHealth === 'GOOD' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                                            category.pricingHealth === 'LOW_MARGIN' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                                'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                                            }`}>
                                            {category.pricingHealth === 'GOOD' ? 'HEALTHY' : category.pricingHealth.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(category);
                                                    setFormName(category.name);
                                                    setFormDescription(category.description || '');
                                                    setFormColor(category.color);
                                                }}
                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-primary"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-error/10 rounded-lg text-neutral-400 hover:text-error">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {displayedCategories.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-neutral-500">
                                        <Layers className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                                        <p>No categories found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 flex justify-between items-center">
                    <div className="text-sm text-neutral-500">
                        Page <b className="text-neutral-900 dark:text-white">{page}</b> of <b className="text-neutral-900 dark:text-white">{totalPages || 1}</b>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemCategories;
