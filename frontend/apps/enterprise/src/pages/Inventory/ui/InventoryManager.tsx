import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "../../redux/store";
import {
    getAgingReport,
    applyAgingAction,
    getAllItems,
    deleteItem as deleteSingleItem,
    deleteItemsBatch,
    addItem,
    updateItem,
    bulkUpdateCategory,
    bulkAdjustStock,
    duplicateItem,
    toggleItemStatus,
    getStockHistory,
    getInventoryStats
} from "../../redux/slices/inventorySlice";
import ProductModal from "./ProductModal";
import { BulkCategoryModal, BulkAdjustmentModal } from "./BulkActionModals";
import { StockHistoryDrawer } from "./StockHistoryPanel";
import StockTransferModal from "./StockTransferModal";
import { Product } from "../../types/product";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import {
    Box,
    Search,
    Plus,
    Tag,
    Warehouse,
    TrendingUp,
    AlertTriangle,
    ArrowRightLeft,
    Edit3,
    Barcode,
    Image as ImageIcon,
    Download,
    ChevronLeft,
    ChevronRight,
    Zap,
    MoreVertical,
    CheckSquare,
    Square,
    X,
    AlertOctagon,
    Percent,
    Eye,
    EyeOff,
    History,
    MoreHorizontal,
    Copy,
    Trash2,
} from 'lucide-react';

const MetricCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-${color}-500/20 transition-all`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-1 italic tracking-tight">{value}</h3>
                {subtext && (
                    <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-neutral-400'}`}>
                        {subtext}
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl bg-neutral-100 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400 group-hover:text-primary transition-colors`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    </div>
);

const InventoryManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items, isLoading, agingReport, pagination, stockHistory, inventoryStats } = useSelector((state: RootState) => state.inventory);
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [showAgingModal, setShowAgingModal] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);

    // Bulk Action States
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [showCategoryMoveModal, setShowCategoryMoveModal] = useState(false);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Row Action States
    const [rowActionDropdown, setRowActionDropdown] = useState<string | null>(null);
    const [showStockHistory, setShowStockHistory] = useState(false);
    const [historyItem, setHistoryItem] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        dispatch(getAllItems({ page, limit: 20, search: debouncedSearch, category: selectedCategory }));
        dispatch(getInventoryStats());
    }, [dispatch, page, debouncedSearch, selectedCategory]);

    const handleOpenAgingReport = () => {
        dispatch(getAgingReport());
        setShowAgingModal(true);
    };

    const handleAgingAction = async (itemId: string, action: 'CLEARANCE' | 'REDUCE_MARGIN', currentPrice: number) => {
        let value = 0;
        if (action === 'REDUCE_MARGIN') {
            const p = window.prompt("Enter new selling price:", (currentPrice * 0.8).toFixed(2));
            if (!p) return;
            value = parseFloat(p);
            if (isNaN(value) || value <= 0) {
                alert("Invalid price");
                return;
            }
        }
        await dispatch(applyAgingAction({ itemId, action, value }) as any);
        dispatch(getAgingReport());
    };


    const categoryList = useMemo(() => {
        const cats = new Set(items.map((i: any) => i.category).filter(Boolean));
        return ['ALL', ...Array.from(cats)];
    }, [items]);

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === items.length && items.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map((i: any) => i._id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
            await dispatch(deleteItemsBatch(Array.from(selectedItems)));
            setSelectedItems(new Set());
        }
    };

    const handleDeleteSingle = async (id: string, name: string) => {
        if (window.confirm(`Delete item "${name}"?`)) {
            await dispatch(deleteSingleItem(id));
        }
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (productData: Partial<Product>) => {
        try {
            if (editingProduct) {
                await dispatch(updateItem({ id: editingProduct._id as string, itemData: productData })).unwrap();
            } else {
                await dispatch(addItem(productData)).unwrap();
            }
            setIsProductModalOpen(false);
            dispatch(getAllItems());
        } catch (error: any) {
            alert(error || "Failed to save product");
        }
    };

    const handleImportSKUsOpen = () => {
        setShowImportModal(true);
    };

    const onBulkCategoryConfirm = async (category: string) => {
        await dispatch(bulkUpdateCategory({ ids: Array.from(selectedItems), category }));
        setSelectedItems(new Set());
        dispatch(getAllItems({ page, limit: 20, search: debouncedSearch, category: selectedCategory }));
    };

    const onBulkAdjustmentConfirm = async (adjustment: number, type: 'ADD' | 'SUBTRACT' | 'SET') => {
        await dispatch(bulkAdjustStock({ ids: Array.from(selectedItems), adjustment, type }));
        setSelectedItems(new Set());
        dispatch(getAllItems({ page, limit: 20, search: debouncedSearch, category: selectedCategory }));
    };

    const handleDuplicateItem = async (id: string) => {
        await dispatch(duplicateItem(id));
        setRowActionDropdown(null);
    };

    const handleToggleStatus = async (id: string) => {
        await dispatch(toggleItemStatus(id));
        setRowActionDropdown(null);
    };

    const handleViewHistory = async (id: string, name: string) => {
        setHistoryItem({ id, name });
        await dispatch(getStockHistory(id));
        setShowStockHistory(true);
        setRowActionDropdown(null);
    };

    const inventoryMetrics = useMemo(() => {
        if (inventoryStats) {
            return {
                totalItems: inventoryStats.totalItems,
                lowStock: inventoryStats.lowStockCount,
                totalValuation: inventoryStats.totalValuation
            };
        }
        // Fallback to page-level if stats not yet loaded
        const totalItems = items.length;
        const lowStock = items.filter((i: any) => i.stockQty <= i.lowStockLimit).length;
        const totalValuation = items.reduce((acc, i) => acc + (i.stockQty * (i.costPrice || 0)), 0);
        return { totalItems, lowStock, totalValuation };
    }, [items, inventoryStats]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-main pb-16">
                <PageHeader
                    title="Inventory Core Manager"
                    description={`Central stock authority and metadata control for ${tenant_id}`}
                    actions={
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:border-primary/50 transition-all uppercase tracking-widest text-main shadow-sm">
                                <Download className="w-4 h-4" /> Export
                            </button>
                            <button onClick={handleOpenAgingReport} className="px-4 py-2 bg-rose-50 dark:bg-rose-900/10 text-rose-600 border border-rose-200 dark:border-rose-900/20 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all uppercase tracking-widest shadow-sm">
                                <AlertOctagon className="w-4 h-4" /> Stock Aging
                            </button>
                            <button
                                onClick={() => setIsTransferModalOpen(true)}
                                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 border border-indigo-200 dark:border-indigo-900/20 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest shadow-sm"
                            >
                                <ArrowRightLeft className="w-4 h-4" /> Transfer
                            </button>
                            <button
                                onClick={handleAddProduct}
                                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/25 flex items-center gap-2 hover:bg-primary/90 transition-all uppercase tracking-widest"
                            >
                                <Plus className="w-5 h-5" /> Register SKU
                            </button>
                        </div>
                    }
                />

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total SKU Count"
                        value={inventoryMetrics.totalItems}
                        subtext="Across all nodes"
                        icon={Box}
                        color="primary"
                        trend="flat"
                    />
                    <MetricCard
                        title="Low Stock Alerts"
                        value={inventoryMetrics.lowStock}
                        subtext="Immediate restock needed"
                        icon={AlertTriangle}
                        color="rose"
                        trend="down"
                    />
                    <MetricCard
                        title="Estimated Valuation"
                        value={`₹${(inventoryMetrics.totalValuation / 100000).toFixed(2)}L`}
                        subtext="Total Asset Value"
                        icon={TrendingUp}
                        color="emerald"
                        trend="up"
                    />
                    <div className="bg-neutral-900 text-white p-6 rounded-xl shadow-xl relative overflow-hidden group border border-white/5">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition duration-700 stroke-[3]" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 italic">Agent Pulse</p>
                        <p className="text-sm font-bold leading-relaxed text-neutral-200">
                            {inventoryMetrics.lowStock > 0 ? (
                                <>Inventory needs attention. <span className="text-primary underline decoration-2 underline-offset-4 font-black">{items.find((i: any) => i.stockQty <= i.lowStockLimit)?.sku || 'Some SKUs'}</span> is low.</>
                            ) : (
                                <>Inventory healthy. <span className="text-emerald-400 font-black italic">Perfectly balanced.</span></>
                            )}
                        </p>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-stretch md:items-center">
                        <div className="relative flex-1 xl:w-[450px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by SKU, Name or Barcode..."
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-main placeholder:text-neutral-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] outline-none hover:border-primary transition-all text-main cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categoryList.map(cat => (
                                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto justify-end">
                        {selectedItems.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-6 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.15em] shadow-xl shadow-rose-600/20 flex items-center gap-2 hover:bg-rose-700 transition-all active:scale-95"
                            >
                                Trash ({selectedItems.size})
                            </button>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreActions(!showMoreActions)}
                                className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-main rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all shadow-sm flex items-center gap-2"
                            >
                                More Actions <MoreVertical className="w-4 h-4" />
                            </button>

                            {showMoreActions && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-700 mb-1">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Bulk Operations</p>
                                    </div>
                                    <button
                                        disabled={selectedItems.size === 0}
                                        onClick={() => { setShowMoreActions(false); /* handlePrintLabels(); */ }}
                                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Barcode className="w-4 h-4" /> Print Labels ({selectedItems.size})
                                    </button>
                                    <button
                                        disabled={selectedItems.size === 0}
                                        onClick={() => { setShowMoreActions(false); setShowCategoryMoveModal(true); }}
                                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Tag className="w-4 h-4" /> Change Category
                                    </button>
                                    <button
                                        disabled={selectedItems.size === 0}
                                        onClick={() => { setShowMoreActions(false); setShowAdjustmentModal(true); }}
                                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckSquare className="w-4 h-4" /> Stock Adjustment
                                    </button>
                                    <div className="h-px bg-neutral-100 dark:bg-neutral-700 mx-2 my-1"></div>
                                    <button
                                        onClick={() => { setShowMoreActions(false); setShowImportModal(true); }}
                                        className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-emerald-500/5 hover:text-emerald-500 transition-all flex items-center gap-3"
                                    >
                                        <Download className="w-4 h-4" /> Import Excel/CSV
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Ledger */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm tabular-nums border-collapse">
                            <thead className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 font-black uppercase tracking-[0.25em] text-[10px]">
                                <tr>
                                    <th className="px-6 py-5 w-10">
                                        <button onClick={toggleSelectAll} className="text-neutral-400 hover:text-primary transition-all">
                                            {selectedItems.size === items.length && items.length > 0 ?
                                                <CheckSquare className="w-5 h-5 text-primary" /> :
                                                <Square className="w-5 h-5" />
                                            }
                                        </button>
                                    </th>
                                    <th className="px-6 py-5">Product Master</th>
                                    <th className="px-6 py-5">Classification</th>
                                    <th className="px-6 py-5">Stock Node</th>
                                    <th className="px-6 py-5 text-right">Pricing</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
                                            <p className="mt-4 text-xs font-black uppercase tracking-widest text-neutral-400">Indexing Stock...</p>
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-24 text-center text-neutral-400 font-black uppercase tracking-[0.3em] text-xs italic opacity-50">
                                            No SKUs found in this node
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item: any) => {
                                        const isLowStock = item.stockQty <= item.lowStockLimit;
                                        const isSelected = selectedItems.has(item._id);
                                        return (
                                            <tr key={item._id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all group ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                                <td className="px-6 py-5">
                                                    <button onClick={() => toggleSelect(item._id)} className="text-neutral-400 hover:text-primary transition-all">
                                                        {isSelected ?
                                                            <CheckSquare className="w-5 h-5 text-primary" /> :
                                                            <Square className="w-5 h-5" />
                                                        }
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
                                                            {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-neutral-400" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div
                                                                className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-tight truncate max-w-[200px] group-hover:text-primary transition-colors cursor-pointer"
                                                                onClick={() => handleEditProduct(item)}
                                                            >
                                                                {item.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-neutral-500 font-bold">SKU: {item.sku || 'N/A'}</span>
                                                                {item.barcode && <div className="flex items-center gap-1"><Barcode className="w-3 h-3 text-neutral-400" /><span className="text-[10px] text-neutral-500 font-bold">{item.barcode}</span></div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded text-[9px] font-black uppercase tracking-widest w-fit border border-neutral-200 dark:border-neutral-600">{item.category}</span>
                                                        <span className="text-[10px] text-primary font-bold italic">{item.brand || 'No Brand'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <div className={`text-sm font-black italic ${isLowStock ? 'text-rose-500' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                                            {item.stockQty} {item.unit}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Warehouse className="w-3 h-3 text-neutral-400" />
                                                            <span className="text-[10px] text-neutral-400 font-bold uppercase">{item.location || 'General Floor'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="font-bold text-neutral-400 text-[10px] uppercase tracking-wider line-through decoration-rose-500/30">₹{item.costPrice?.toLocaleString()}</div>
                                                    <div className="font-black text-primary text-xl italic tracking-tight mt-0.5">₹{item.sellingPrice?.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${isLowStock ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/30'}`}>
                                                        {isLowStock ? 'Critical Low' : 'In Stock'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right relative">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setRowActionDropdown(rowActionDropdown === item._id ? null : item._id)}
                                                            className={`p-2.5 rounded-xl transition-all shadow-sm ${rowActionDropdown === item._id ? 'bg-primary text-white' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-primary'}`}
                                                            title="More Actions"
                                                        >
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>

                                                        {rowActionDropdown === item._id && (
                                                            <div className="absolute right-6 top-16 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                                                                <button
                                                                    onClick={() => { handleEditProduct(item); setRowActionDropdown(null); }}
                                                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-3"
                                                                >
                                                                    <Edit3 className="w-4 h-4" /> Edit Specifications
                                                                </button>
                                                                <button
                                                                    onClick={() => handleViewHistory(item._id, item.name)}
                                                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-3"
                                                                >
                                                                    <History className="w-4 h-4" /> Stock History
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDuplicateItem(item._id)}
                                                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-3"
                                                                >
                                                                    <Copy className="w-4 h-4" /> Duplicate SKU
                                                                </button>
                                                                <div className="h-px bg-neutral-100 dark:bg-neutral-700 mx-2 my-1"></div>
                                                                <button
                                                                    onClick={() => handleToggleStatus(item._id)}
                                                                    className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${item.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                                >
                                                                    {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                    {item.isActive ? 'Deactivate Record' : 'Activate Record'}
                                                                </button>
                                                                <button
                                                                    onClick={() => { handleDeleteSingle(item._id, item.name); setRowActionDropdown(null); }}
                                                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-3"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> Archive Product
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="px-8 py-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/30 dark:bg-neutral-800/30 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Showing {items.length} of {pagination?.total || items.length} Registered Products</div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-400 hover:text-primary hover:border-primary transition-all shadow-sm rounded-xl disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-inner text-main">
                                    Page {page.toString().padStart(2, '0')}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={pagination ? page >= pagination.pages : items.length < 20}
                                    className="p-2.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-400 hover:text-primary hover:border-primary transition-all shadow-sm rounded-xl disabled:opacity-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation Advisory */}
                <div className="bg-neutral-900 dark:bg-neutral-800/50 text-white p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
                    <TrendingUp className="absolute -bottom-16 -right-16 w-64 h-64 text-primary opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000" />
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.25em] mb-6">
                                <Zap className="w-4 h-4 fill-current" /> Automation Pipeline Active
                            </div>
                            <h4 className="text-3xl font-black mb-4 italic tracking-tight">Streamline your <span className="text-primary underline decoration-4 underline-offset-8">Stock Authority.</span></h4>
                            <p className="text-sm text-neutral-400 font-bold leading-relaxed italic max-w-3xl">
                                Enable auto-restocking protocols for items identified as "Critical Velocity" to avoid stock-outs. The agent currently monitors 14 high-volume SKUs for optimal reorder timing.
                            </p>
                        </div>
                        <button className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-[0.25em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">
                            Enable Auto-Restock
                        </button>
                    </div>
                </div>
            </div>

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={handleSaveProduct}
                product={editingProduct}
                isLoading={isLoading}
            />

            <StockTransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onTransfer={async (data) => {
                    console.log("Transferring stock:", data);
                    // In a real app, dispatch an action here
                    // e.g. await dispatch(transferStock(data)).unwrap();
                    setIsTransferModalOpen(false);
                }}
                items={items}
                isLoading={isLoading}
            />

            <BulkCategoryModal
                isOpen={showCategoryMoveModal}
                onClose={() => setShowCategoryMoveModal(false)}
                onConfirm={onBulkCategoryConfirm}
                selectedCount={selectedItems.size}
                categories={categoryList}
            />

            <BulkAdjustmentModal
                isOpen={showAdjustmentModal}
                onClose={() => setShowAdjustmentModal(false)}
                onConfirm={onBulkAdjustmentConfirm}
                selectedCount={selectedItems.size}
            />

            <StockHistoryDrawer
                isOpen={showStockHistory}
                onClose={() => setShowStockHistory(false)}
                itemName={historyItem?.name || ''}
                history={stockHistory}
                isLoading={isLoading}
            />

            {/* Stock Aging Modal */}
            {showAgingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-800 w-full max-w-5xl rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-10 py-8 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-700/50">
                            <div>
                                <h3 className="text-2xl font-black italic flex items-center gap-3 text-neutral-900 dark:text-neutral-100">
                                    <AlertOctagon className="w-8 h-8 text-rose-600" /> Dead Stock Analysis
                                </h3>
                                <p className="text-[10px] font-black text-neutral-400 mt-1 uppercase tracking-[0.2em]">Identified items with stock age {'>'} 180 days</p>
                            </div>
                            <button onClick={() => setShowAgingModal(false)} className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-rose-600 rounded-full transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-32 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
                                    <p className="mt-4 font-black text-neutral-400 uppercase tracking-[0.25em] text-xs">Running aging algorithm...</p>
                                </div>
                            ) : (!agingReport || agingReport.length === 0) ? (
                                <div className="p-32 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-900/30">
                                        <CheckSquare className="w-10 h-10 text-emerald-600 stroke-[3]" />
                                    </div>
                                    <h4 className="text-xl font-black text-neutral-900 dark:text-neutral-100 mb-2 italic tracking-tight">Inventory Healthy</h4>
                                    <p className="font-bold text-neutral-500 text-sm italic">No dead stock detected. Outstanding maintenance!</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 font-black uppercase tracking-[0.25em] text-[10px] sticky top-0 z-10">
                                        <tr>
                                            <th className="px-8 py-5">Product</th>
                                            <th className="px-8 py-5">Stock Age</th>
                                            <th className="px-8 py-5 text-right">Valuation</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        {agingReport.map((item: any) => (
                                            <tr key={item._id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="font-bold text-neutral-900 dark:text-neutral-100 text-base uppercase tracking-tight group-hover:text-primary transition-colors">{item.name}</div>
                                                    <div className="text-[10px] text-neutral-400 font-black uppercase mt-1 tracking-widest">SKU: {item.sku}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-xs font-black border border-rose-200 dark:border-rose-900/30">
                                                        <AlertTriangle className="w-3 h-3 fill-current" /> {item.ageInDays} Days
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="font-black text-neutral-900 dark:text-neutral-100 text-lg italic">₹{item.valuation?.toLocaleString()}</div>
                                                    <div className="text-[10px] text-neutral-400 font-black uppercase mt-1 tracking-widest">Qty: {item.stockQty}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => handleAgingAction(item._id, 'CLEARANCE', item.sellingPrice)}
                                                            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 hover:text-neutral-900 dark:hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-neutral-200 dark:border-neutral-600 flex items-center gap-2"
                                                        >
                                                            <Tag className="w-3 h-3" /> Clearance
                                                        </button>
                                                        <button
                                                            onClick={() => handleAgingAction(item._id, 'REDUCE_MARGIN', item.sellingPrice)}
                                                            className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                                        >
                                                            <Percent className="w-3 h-3" /> Mark Down
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="px-10 py-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-700/50 flex justify-end">
                            <button onClick={() => setShowAgingModal(false)} className="px-8 py-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl">
                                Close Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default InventoryManager;
