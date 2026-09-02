import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Loader2,
    SlidersHorizontal,
    Shirt,
    AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/shared/Layout';

interface InventoryItem {
    _id: string;
    id?: string;
    name: string;
    sku?: string;
    category?: string;
    brand?: string;
    size?: string;
    color?: string;
    shelfCode?: string;
    binLocation?: string;
    shelfType?: 'FULL' | 'HALF';
    stockQty: number;
    reservedStock?: number;
    availableQuantity?: number;
    sellingPrice?: number;
    costPrice?: number;
    unit?: string;
}

interface ShelfOption {
    shelfCode: string;
    shelfType: string;
}

interface InventoryVariantSearchProps {
    embedded?: boolean;
}

export const InventoryVariantSearch: React.FC<InventoryVariantSearchProps> = ({ embedded = false }) => {
    // Filter State
    const [searchProduct, setSearchProduct] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('ALL');
    const [selectedSize, setSelectedSize] = useState('ALL');
    const [selectedColor, setSelectedColor] = useState('ALL');
    const [selectedShelf, setSelectedShelf] = useState('ALL');
    const [selectedShelfType, setSelectedShelfType] = useState('ALL');

    // Data & Loading State
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Filter dropdown options -- always real DB data (GET /api/inventory/filters),
    // never a hardcoded list. An empty catalog just means empty dropdowns; we don't
    // paper over that with made-up brand/size/color/shelf names.
    const [brandList, setBrandList] = useState<string[]>([]);
    const [sizeList, setSizeList] = useState<string[]>([]);
    const [colorList, setColorList] = useState<string[]>([]);
    const [shelfList, setShelfList] = useState<ShelfOption[]>([]);
    const [filtersError, setFiltersError] = useState<string | null>(null);

    // Load filter dropdown options once on mount
    const fetchFilterOptions = useCallback(async () => {
        try {
            const response = await api.get('/api/inventory/filters');
            const data = response.data?.data;
            if (data) {
                setBrandList(data.brands || []);
                setSizeList(data.sizes || []);
                setColorList(data.colors || []);
                setShelfList(data.shelves || []);
            }
            setFiltersError(null);
        } catch (err: any) {
            console.error('Failed to load filter options:', err);
            setFiltersError('Filter options could not be loaded from the server.');
        }
    }, []);

    // Fetch Inventory Data from the real DB-backed search API. On failure this
    // shows a genuine error state -- it never falls back to fabricated demo rows,
    // since an Inventory Manager relying on this page to know real stock levels
    // must never be shown numbers that aren't actually in MongoDB.
    const fetchInventory = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const params: any = {
                page: 1,
                limit: 100,
            };
            if (searchProduct.trim()) params.search = searchProduct.trim();
            if (selectedBrand !== 'ALL') params.brand = selectedBrand;
            if (selectedSize !== 'ALL') params.size = selectedSize;
            if (selectedColor !== 'ALL') params.color = selectedColor;
            if (selectedShelf !== 'ALL') params.shelf = selectedShelf;
            if (selectedShelfType !== 'ALL') params.shelfType = selectedShelfType;

            const response = await api.get('/api/inventory', { params });
            const data = response.data;

            let fetchedItems: InventoryItem[] = [];
            if (Array.isArray(data)) {
                fetchedItems = data;
            } else if (data && Array.isArray(data.items)) {
                fetchedItems = data.items;
                setTotalCount(data.pagination?.total ?? data.items.length);
            } else if (data && Array.isArray(data.data)) {
                fetchedItems = data.data;
            }

            setItems(fetchedItems);
        } catch (err: any) {
            console.error('Inventory Search Error:', err);
            setItems([]);
            setLoadError(
                err?.response?.data?.message || err?.message || 'Could not load inventory from the server. Please try again.'
            );
        } finally {
            setIsLoading(false);
            setHasSearched(true);
        }
    }, [searchProduct, selectedBrand, selectedSize, selectedColor, selectedShelf, selectedShelfType]);

    useEffect(() => {
        fetchFilterOptions();
        fetchInventory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchInventory();
    };

    const handleClearFilters = () => {
        setSearchProduct('');
        setSelectedBrand('ALL');
        setSelectedSize('ALL');
        setSelectedColor('ALL');
        setSelectedShelf('ALL');
        setSelectedShelfType('ALL');
        setTimeout(() => {
            fetchInventory();
        }, 50);
    };

    const content = (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Shirt className="w-6 h-6" />
                        </div>
                        Inventory Variant Search & Stock Finder
                    </h1>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                        Search available inventory quantities filtered by Brand, Size, Color, Shelf Code, and Shelf Type.
                    </p>
                </div>
            </div>

            {filtersError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {filtersError} You can still search by product name; brand/size/color/shelf dropdowns may be incomplete.
                </div>
            )}

            {/* Search & Filter Controls Container */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm space-y-6">
                <form onSubmit={handleSearch} className="space-y-6">
                    {/* Row 1: Product Search Input */}
                    <div>
                        <label className="block text-[10px] font-black text-neutral-400 dark:text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">
                            Product / Item Name
                        </label>
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-4 top-3.5 text-neutral-400" />
                            <input
                                type="text"
                                value={searchProduct}
                                onChange={e => setSearchProduct(e.target.value)}
                                placeholder="Search by Product Name (e.g. Shirt, Saree, Classmate)..."
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold text-neutral-900 dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Row 2: Grid Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {/* Brand Filter */}
                        <div>
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 ml-1">
                                Brand
                            </label>
                            <select
                                value={selectedBrand}
                                onChange={e => setSelectedBrand(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="ALL">All Brands</option>
                                {brandList.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {/* Size Filter */}
                        <div>
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 ml-1">
                                Size
                            </label>
                            <select
                                value={selectedSize}
                                onChange={e => setSelectedSize(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="ALL">All Sizes</option>
                                {sizeList.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Color Filter */}
                        <div>
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 ml-1">
                                Color
                            </label>
                            <select
                                value={selectedColor}
                                onChange={e => setSelectedColor(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="ALL">All Colors</option>
                                {colorList.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Shelf Code Filter */}
                        <div>
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 ml-1">
                                Shelf Code
                            </label>
                            <select
                                value={selectedShelf}
                                onChange={e => setSelectedShelf(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="ALL">All Shelves</option>
                                {shelfList.map(sh => (
                                    <option key={sh.shelfCode} value={sh.shelfCode}>{sh.shelfCode}</option>
                                ))}
                            </select>
                        </div>

                        {/* Shelf Type Filter */}
                        <div>
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 ml-1">
                                Shelf Type
                            </label>
                            <select
                                value={selectedShelfType}
                                onChange={e => setSelectedShelfType(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="ALL">All Shelf Types</option>
                                <option value="FULL">FULL Shelf</option>
                                <option value="HALF">HALF Shelf</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="px-4 py-2.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl flex items-center gap-2 transition-all border border-neutral-200 dark:border-neutral-700"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Clear Filters
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search Stock
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Table */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                            Inventory Results ({items.length}{totalCount > items.length ? ` of ${totalCount}` : ''})
                        </h3>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : loadError ? (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-200">Couldn't load inventory</h4>
                        <p className="text-xs text-neutral-500 mt-1 mb-4">{loadError}</p>
                        <button
                            onClick={() => fetchInventory()}
                            className="px-4 py-2 text-xs font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                ) : !hasSearched || items.length === 0 ? (
                    <div className="p-12 text-center">
                        <XCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-200">No matching inventory found</h4>
                        <p className="text-xs text-neutral-500 mt-1">Try adjusting your size, brand, color, or shelf filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Brand</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Size</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Color</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Shelf Code</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Shelf Type</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Available Qty</th>
                                    <th className="px-6 py-3.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700/60">
                                {items.map((item, idx) => {
                                    // availableQuantity comes from the server (stockQty - reservedStock,
                                    // computed in InventoryService.getAllItemsWithPagination). Fall back to
                                    // raw stockQty only if an older API response doesn't carry it yet -- never
                                    // guess or substitute a default value for a field that's genuinely unset.
                                    const qty = item.availableQuantity ?? item.stockQty ?? 0;
                                    const shelf = item.shelfCode || item.binLocation;
                                    const type = item.shelfType;
                                    const brand = item.brand;
                                    const size = item.size;
                                    const color = item.color;
                                    const colorDot: Record<string, string> = {
                                        blue: '#3b82f6', black: '#000000', white: '#ffffff', red: '#ef4444',
                                        green: '#10b981', yellow: '#eab308', grey: '#6b7280', gray: '#6b7280'
                                    };

                                    return (
                                        <tr key={item._id || item.id || idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm text-neutral-900 dark:text-white">{item.name}</div>
                                                {item.sku && <div className="text-[10px] font-mono text-neutral-400">{item.sku}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                {brand || <span className="text-neutral-400 font-medium">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {size ? (
                                                    <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md text-xs font-black">
                                                        {size}
                                                    </span>
                                                ) : <span className="text-neutral-400 text-xs">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {color ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full border border-black/10"
                                                            style={{ backgroundColor: colorDot[color.toLowerCase()] || '#9ca3af' }}
                                                        />
                                                        {color}
                                                    </span>
                                                ) : <span className="text-neutral-400 text-xs">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                                {shelf || <span className="text-neutral-400 font-medium">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {type ? (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${type === 'FULL' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/50' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50'}`}>
                                                        {type}
                                                    </span>
                                                ) : <span className="text-neutral-400 text-xs">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-mono text-base font-black ${qty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {qty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {qty > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        In Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-full">
                                                        <XCircle className="w-3 h-3" />
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    return embedded ? content : <Layout>{content}</Layout>;
};

export default InventoryVariantSearch;
