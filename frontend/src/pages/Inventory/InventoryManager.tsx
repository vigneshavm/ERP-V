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
    updateItem
} from "../../redux/slices/inventorySlice";
import ProductModal from "./ProductModal";
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
    const { items, isLoading, agingReport } = useSelector((state: RootState) => state.inventory);
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [showAgingModal, setShowAgingModal] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        dispatch(getAllItems());
    }, [dispatch]);

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

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const categories = useMemo(() => {
        const cats = new Set(items.map((i: any) => i.category).filter(Boolean));
        return ['ALL', ...Array.from(cats)];
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter((item: any) => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, selectedCategory]);

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredItems.length && filteredItems.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredItems.map((i: any) => i._id)));
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

    const inventoryMetrics = useMemo(() => {
        const totalItems = items.length;
        const lowStock = items.filter((i: any) => i.stockQty <= i.lowStockLimit).length;
        const totalValuation = items.reduce((acc, i) => acc + (i.stockQty * (i.costPrice || 0)), 0);
        return { totalItems, lowStock, totalValuation };
    }, [items]);

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
                            {categories.map(cat => (
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
                        <button className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-main rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all shadow-sm">
                            More Actions
                        </button>
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
                                            {selectedItems.size === filteredItems.length && filteredItems.length > 0 ?
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
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-24 text-center text-neutral-400 font-black uppercase tracking-[0.3em] text-xs italic opacity-50">
                                            No SKUs found in this node
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item: any) => {
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
                                                            <div className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-tight truncate max-w-[200px] group-hover:text-primary transition-colors">{item.name}</div>
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
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                            title="Edit SKU"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSingle(item._id, item.name)}
                                                            className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                            title="Delete SKU"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"><MoreVertical className="w-4 h-4" /></button>
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
                            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Showing {filteredItems.length} of {items.length} Registered Products</div>
                            <div className="flex items-center gap-4">
                                <button className="p-2.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-400 hover:text-primary hover:border-primary transition-all shadow-sm rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-inner text-main">Page 01</span>
                                <button className="p-2.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-400 hover:text-primary hover:border-primary transition-all shadow-sm rounded-xl"><ChevronRight className="w-5 h-5" /></button>
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
