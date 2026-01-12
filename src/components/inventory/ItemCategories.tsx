import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Search,
    Layers,
    FolderPlus,
    Edit,
    Trash2,
    ChevronDown,
    ChevronUp,
    Package,
    BarChart3,
    TrendingUp,
    Plus,
    Check,
    X,
    Palette,
    Zap
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
    // Intelligence Fields
    deadstockPercentage: number;
    avgSellThroughDays: number;
    riskFlag: 'HEALTHY' | 'OVERSTOCKED' | 'LOW_TURNOVER' | 'STOCKOUT_RISK';
    recommendedAction: string;
    gstCompliance: 'OK' | 'MIXED' | 'NOT_MATCHING';
    pricingHealth: 'GOOD' | 'LOW_MARGIN' | 'PROMO_NEEDED';
}

const PRESET_COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'
];

const ItemCategories: React.FC = () => {
    const { products, categories: storeCategories } = useSelector((state: RootState) => state.inventory);

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formColor, setFormColor] = useState('#3b82f6');
    const [formParentId, setFormParentId] = useState<string>('');

    // Extract categories from products with Intelligence Engine
    const categories: Category[] = useMemo(() => {
        const categoryMap = new Map<string, { count: number; value: number; deadCount: number; lowMarginCount: number; gstMismatchCount: number }>();
        const defaultGSTRate = 18; // Mock default GST for categories

        products.forEach(product => {
            const cat = product.category || 'Uncategorized';
            const existing = categoryMap.get(cat) || { count: 0, value: 0, deadCount: 0, lowMarginCount: 0, gstMismatchCount: 0 };

            // Intelligence Logic
            const isDead = product.stock > 0 && Math.random() > 0.8; // Mock deadstock detection
            const isLowMargin = (product.price - product.cost) / product.price < 0.15; // Mock margin check
            // Fix: Cast product.tax or check property name if available. Assuming 18 for now.
            const hasGSTMismatch = false;

            categoryMap.set(cat, {
                count: existing.count + 1,
                value: existing.value + (product.stock * product.cost),
                deadCount: existing.deadCount + (isDead ? 1 : 0),
                lowMarginCount: existing.lowMarginCount + (isLowMargin ? 1 : 0),
                gstMismatchCount: existing.gstMismatchCount + (hasGSTMismatch ? 1 : 0)
            });
        });

        return Array.from(categoryMap.entries()).map(([name, data], idx) => {
            const deadstockPercentage = Math.round((data.deadCount / data.count) * 100);
            const pricingHealth = data.lowMarginCount > (data.count * 0.3) ? 'LOW_MARGIN' : (deadstockPercentage > 25 ? 'PROMO_NEEDED' : 'GOOD');

            // Risk Flag Logic
            let riskFlag: Category['riskFlag'] = 'HEALTHY';
            if (deadstockPercentage > 30) riskFlag = 'LOW_TURNOVER';
            else if (data.value > 100000 && deadstockPercentage > 15) riskFlag = 'OVERSTOCKED';

            const recommendedAction = riskFlag === 'LOW_TURNOVER' ? 'Stop purchases and relocate stock' :
                riskFlag === 'OVERSTOCKED' ? 'Apply 15% clearance discount' :
                    pricingHealth === 'LOW_MARGIN' ? 'Review vendor costs or RSP' : 'Maintain current stock levels';

            return {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                color: PRESET_COLORS[idx % PRESET_COLORS.length],
                itemCount: data.count,
                stockValue: data.value,
                isActive: true,
                deadstockPercentage,
                avgSellThroughDays: Math.floor(Math.random() * 40 + 10), // Mock data
                riskFlag,
                recommendedAction,
                gstCompliance: data.gstMismatchCount > 0 ? 'MIXED' : 'OK',
                pricingHealth
            };
        });
    }, [products, storeCategories]);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Summary stats
    const totalCategories = categories.length;
    const totalItems = categories.reduce((acc, c) => acc + c.itemCount, 0);
    const totalStockValue = categories.reduce((acc, c) => acc + c.stockValue, 0);

    const toggleExpand = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const handleAddCategory = () => {
        if (!formName.trim()) return;
        // Here you would dispatch action to add category
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-6 h-6 text-primary" />
                        Item Categories
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">Organize your inventory into categories</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                >
                    <FolderPlus className="w-4 h-4" /> Add Category
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Total Categories</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{totalCategories}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Layers className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Total Items</p>
                            <p className="text-2xl font-bold text-primary mt-1">{totalItems}</p>
                        </div>
                        <div className="p-3 bg-success/10 rounded-xl">
                            <Package className="w-6 h-6 text-success" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Stock Value</p>
                            <p className="text-2xl font-bold text-success mt-1">₹{totalStockValue.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-warning/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-warning" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase">Avg Items/Category</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                                {totalCategories > 0 ? Math.round(totalItems / totalCategories) : 0}
                            </p>
                        </div>
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingCategory) && (
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Category Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Electronics, Groceries..."
                                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Parent Category</label>
                            <select
                                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={formParentId}
                                onChange={e => setFormParentId(e.target.value)}
                            >
                                <option value="">None (Top Level)</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block">Description</label>
                            <input
                                type="text"
                                placeholder="Brief description of this category..."
                                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                                value={formDescription}
                                onChange={e => setFormDescription(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-neutral-500 font-bold uppercase mb-1 block flex items-center gap-1">
                                <Palette className="w-3 h-3" /> Color
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`w-8 h-8 rounded-lg border-2 ${formColor === color ? 'border-neutral-900 dark:border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleAddCategory}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" /> {editingCategory ? 'Save Changes' : 'Add Category'}
                        </button>
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-neutral-800 p-12 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                        <Layers className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                        <p className="text-neutral-500">No categories found</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold"
                        >
                            Create First Category
                        </button>
                    </div>
                ) : (
                    filteredCategories.map(category => (
                        <div
                            key={category.id}
                            className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Category Header */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                            style={{ backgroundColor: category.color }}
                                        >
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900 dark:text-white">{category.name}</h3>
                                            {category.description && (
                                                <p className="text-xs text-neutral-500">{category.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingCategory(category);
                                                setFormName(category.name);
                                                setFormDescription(category.description || '');
                                                setFormColor(category.color);
                                            }}
                                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                                        >
                                            <Edit className="w-4 h-4 text-neutral-400" />
                                        </button>
                                        <button className="p-2 hover:bg-error/10 rounded-lg">
                                            <Trash2 className="w-4 h-4 text-error" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats & Intelligence Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg flex flex-col items-center justify-center">
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold text-center">Items</p>
                                        <p className="text-lg font-bold text-primary">{category.itemCount}</p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg flex flex-col items-center justify-center">
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold text-center">Value</p>
                                        <p className="text-lg font-bold text-success">₹{category.stockValue > 1000 ? (category.stockValue / 1000).toFixed(1) + 'k' : category.stockValue}</p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg flex flex-col items-center justify-center">
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold text-center">Deadstock</p>
                                        <p className={`text-lg font-bold ${category.deadstockPercentage > 20 ? 'text-error' : 'text-success'}`}>
                                            {category.deadstockPercentage}%
                                        </p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg flex flex-col items-center justify-center">
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold text-center">Risk</p>
                                        <div className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-center ${category.riskFlag === 'HEALTHY' ? 'bg-success/10 text-success' :
                                            category.riskFlag === 'OVERSTOCKED' ? 'bg-warning/10 text-warning' :
                                                'bg-error/10 text-error'
                                            }`}>
                                            {category.riskFlag}
                                        </div>
                                    </div>
                                </div>

                                {/* Reorder Intelligence */}
                                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary uppercase">Strategy</span>
                                    </div>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium italic">
                                        "{category.recommendedAction}"
                                    </p>
                                </div>
                            </div>

                            {/* Compliance & Health Badges */}
                            <div className="px-4 pb-4 flex gap-2">
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase ${category.gstCompliance === 'OK' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                                    }`}>
                                    <Check className="w-2.5 h-2.5" />
                                    GST: {category.gstCompliance}
                                </div>
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase ${category.pricingHealth === 'GOOD' ? 'bg-indigo-100 text-indigo-700' :
                                    category.pricingHealth === 'LOW_MARGIN' ? 'bg-amber-100 text-amber-700' :
                                        'bg-pink-100 text-pink-700'
                                    }`}>
                                    <TrendingUp className="w-2.5 h-2.5" />
                                    Margin: {category.pricingHealth === 'GOOD' ? 'HEALTHY' : category.pricingHealth.replace('_', ' ')}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="border-t border-neutral-100 dark:border-neutral-700 p-2 flex justify-between bg-neutral-50 dark:bg-neutral-900">
                                <button className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg flex items-center gap-1">
                                    <Package className="w-3 h-3" /> View Items
                                </button>
                                <button className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Item
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
                <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Category Tips
                </h4>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 space-y-1">
                    <li>• Organize items into logical groups for easier inventory management</li>
                    <li>• Use parent categories to create hierarchical structures</li>
                    <li>• Assign distinct colors for quick visual identification</li>
                    <li>• Categories help in generating better sales and stock reports</li>
                </ul>
            </div>
        </div>
    );
};

export default ItemCategories;
