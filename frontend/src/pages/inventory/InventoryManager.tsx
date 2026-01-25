import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Layout from '../../components/Layout';
import {
    Box,
    Search,
    Filter,
    Plus,
    Tag,
    Layers,
    Warehouse,
    TrendingUp,
    AlertTriangle,
    Edit3,
    Trash2,
    Barcode,
    Image as ImageIcon,
    Download,
    ChevronLeft,
    ChevronRight,
    Zap,
    Info,
    MoreVertical,
    CheckSquare,
    Square,
} from 'lucide-react';

const InventoryManager: React.FC = () => {
    const { items, isLoading } = useSelector((state: RootState) => state.inventory);
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Categories extraction
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
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredItems.map((i: any) => i._id)));
        }
    };

    const inventoryMetrics = useMemo(() => {
        const totalItems = items.length;
        const lowStock = items.filter((i: any) => i.stockQty <= i.lowStockLimit).length;
        const totalValuation = items.reduce((acc, i) => acc + (i.stockQty * i.costPrice), 0);
        return { totalItems, lowStock, totalValuation };
    }, [items]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight uppercase">
                            <Box className="w-6 h-6 text-primary" />
                            Inventory Core Manager
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5 font-medium">
                            Central stock authority and metadata control for <span className="font-bold text-primary">{tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest">
                            <Plus className="w-4 h-4" /> Register SKU
                        </button>
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Total SKU Count</p>
                        <h3 className="text-3xl font-black italic">{inventoryMetrics.totalItems}</h3>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Low Stock Alerts</p>
                        <h3 className="text-3xl font-black text-error italic">{inventoryMetrics.lowStock}</h3>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Estimated Valuation</p>
                        <h3 className="text-2xl font-black text-primary italic">₹{(inventoryMetrics.totalValuation / 100000).toFixed(2)}L</h3>
                    </div>
                    <div className="bg-neutral-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition duration-700" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 italic">Agent Pulse</p>
                        <p className="text-xs font-bold leading-tight">"Inventory healthy. Reorder <span className="text-primary">SKU-042</span> soon."</p>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-neutral-800 p-4 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <div className="flex gap-4 w-full xl:w-auto items-center">
                        <div className="relative flex-1 xl:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by SKU, Name or Barcode..."
                                className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition shadow-inner font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm transition"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        {selectedItems.size > 0 && (
                            <button className="px-4 py-2 bg-error text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-error/20 flex items-center gap-2 hover:bg-error/90 transition active:scale-95">
                                <Trash2 className="w-4 h-4" /> Bulk Delete ({selectedItems.size})
                            </button>
                        )}
                        <button className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-xl text-xs font-black uppercase tracking-widest transition">
                            More Actions
                        </button>
                    </div>
                </div>

                {/* Desktop Product Ledger */}
                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm shadow-black/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm tabular-nums">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                <tr>
                                    <th className="p-6 w-10">
                                        <button onClick={toggleSelectAll} className="text-neutral-400 hover:text-primary transition-colors">
                                            {selectedItems.size === filteredItems.length && filteredItems.length > 0 ?
                                                <CheckSquare className="w-5 h-5 text-primary" /> :
                                                <Square className="w-5 h-5" />
                                            }
                                        </button>
                                    </th>
                                    <th className="p-6">Product Master</th>
                                    <th className="p-6">Classification</th>
                                    <th className="p-6">Stock Node</th>
                                    <th className="p-6 text-right">Pricing (Cost/Sell)</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-neutral-400 font-black uppercase tracking-widest text-xs italic">
                                            No SKUs registered under this topology
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item: any) => {
                                        const isLowStock = item.stockQty <= item.lowStockLimit;
                                        return (
                                            <tr key={item._id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group cursor-default ${selectedItems.has(item._id) ? 'bg-primary/[0.03]' : ''}`}>
                                                <td className="p-6">
                                                    <button onClick={() => toggleSelect(item._id)} className="text-neutral-400 hover:text-primary transition-colors">
                                                        {selectedItems.has(item._id) ?
                                                            <CheckSquare className="w-5 h-5 text-primary" /> :
                                                            <Square className="w-5 h-5" />
                                                        }
                                                    </button>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                                                            {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="w-5 h-5 text-neutral-300" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-black text-neutral-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px] group-hover:text-primary transition-colors">{item.name}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-neutral-400 font-black">SKU: {item.sku || 'N/A'}</span>
                                                                {item.barcode && <div className="flex items-center gap-1"><Barcode className="w-3 h-3 text-neutral-300" /><span className="text-[10px] text-neutral-400 font-bold">{item.barcode}</span></div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 rounded text-[9px] font-black uppercase tracking-widest w-fit border border-neutral-200 dark:border-neutral-700">{item.category}</span>
                                                        <span className="text-[10px] text-primary font-bold italic">{item.brand || 'No Brand'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <div className={`text-sm font-black italic ${isLowStock ? 'text-error' : 'text-neutral-900 dark:text-white'}`}>
                                                            {item.stockQty} {item.unit}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Warehouse className="w-3 h-3 text-neutral-300" />
                                                            <span className="text-[10px] text-neutral-400 font-bold uppercase">{item.location || 'General Floor'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="font-bold text-neutral-400 text-xs">₹{item.costPrice.toLocaleString()}</div>
                                                    <div className="font-black text-primary text-base italic">₹{item.sellingPrice.toLocaleString()}</div>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isLowStock ? 'bg-error text-white animate-pulse' : 'bg-success/10 text-success'}`}>
                                                        {isLowStock ? 'Low Stock' : 'In Stock'}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 hover:bg-primary/10 text-primary rounded-xl transition" title="Edit Metadata"><Edit3 className="w-4 h-4" /></button>
                                                        <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-400 rounded-xl transition"><MoreVertical className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Showing {filteredItems.length} of {items.length} Registered Products</div>
                        <div className="flex items-center gap-3">
                            <button className="p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl text-neutral-400 hover:text-primary transition shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-[10px] font-black uppercase tracking-widest">Page 01</span>
                            <button className="p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl text-neutral-400 hover:text-primary transition shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                {/* Intelligent Advice Panel */}
                <div className="bg-neutral-950 text-white p-8 rounded-[2.5rem] border border-neutral-800 shadow-2xl relative overflow-hidden group">
                    <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 group-hover:rotate-6 transition duration-1000" />
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                                <Zap className="w-3.5 h-3.5 fill-current" /> Automation Pipeline Active
                            </div>
                            <h4 className="text-2xl font-black mb-2 italic tracking-tight">Streamline your <span className="text-primary underline">Stock Authority.</span></h4>
                            <p className="text-xs text-neutral-400 font-bold leading-relaxed italic max-w-2xl">
                                Enable auto-restocking protocols for items identified as "Critical Velocity" to avoid stock-outs. The agent currently monitors 14 high-volume SKUs for optimal reorder timing.
                            </p>
                        </div>
                        <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            Enable Auto-Restock
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default InventoryManager;
