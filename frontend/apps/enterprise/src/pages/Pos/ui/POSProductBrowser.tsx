import React, { useState, useMemo, useEffect } from 'react';
import { Product } from "@repo/shared";
import { Sector } from "@repo/shared";
import { Search, Package, Check, Keyboard } from 'lucide-react';

import { useFuzzySearch } from "@/shared/lib/hooks/useFuzzySearch";

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard = React.memo<ProductCardProps>(({ product, onAddToCart }) => {
    return (
        <button
            onClick={() => onAddToCart(product)}
            disabled={product.stockQty <= 0}
            className={`text-left group relative flex flex-col erp-card transition-all duration-300 rounded-3xl overflow-hidden ${product.stockQty <= 0
                ? 'opacity-40 grayscale cursor-not-allowed shadow-none'
                : 'hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-600/20 hover:-translate-y-1'
                }`}
        >
            <div className="h-28 w-full bg-[var(--erp-bg-sunken)] overflow-hidden relative">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary group-hover:text-muted transition-colors">
                        <Package className="w-8 h-8" />
                    </div>
                )}
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${product.stockQty > 10 ? 'bg-emerald-500/20 text-emerald-400' :
                    product.stockQty > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                    {product.stockQty} {product.unit === 'Meter' ? 'm' : ''}
                </div>
            </div>

            <div className="p-3.5 flex flex-col flex-1">
                <h3 className="font-black text-muted text-xs uppercase tracking-tight line-clamp-1 mb-0.5 group-hover:text-indigo-400 transition-colors">{product.name}</h3>
                {product.nameTamil && <p className="text-[10px] text-muted line-clamp-1 mb-1 font-medium">{product.nameTamil}</p>}
                <div className="mt-auto flex justify-between items-end">
                    <span className="text-[10px] text-secondary font-mono tracking-tighter opacity-60">{product.sku}</span>
                    <span className="font-black text-indigo-400 text-sm">₹{product.sellingPrice}</span>
                </div>
            </div>

            <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {product.stockQty > 0 && <div className="bg-indigo-600 text-white p-2.5 rounded-full shadow-2xl shadow-indigo-600/50 scale-75 group-hover:scale-100 transition-transform"><Check className="w-5 h-5" /></div>}
            </div>
        </button>
    );
});

ProductCard.displayName = 'ProductCard';

interface POSProductBrowserProps {
    products: Product[];
    currentBranch: string;
    currentSector: Sector;
    onAddToCart: (product: Product) => void;
}

export const POSProductBrowser: React.FC<POSProductBrowserProps> = ({ products, currentBranch, currentSector, onAddToCart }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
    const [pageSize, setPageSize] = useState(20);
    const [isManualMode, setIsManualMode] = useState(false);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ['All', ...Array.from(cats)].filter(Boolean);
    }, [products]);

    const subcategories = useMemo(() => {
        if (selectedCategory === 'All') return [];
        const filteredByCat = products.filter(p => p.category === selectedCategory);
        const subcats = new Set(filteredByCat.map(p => p.productType || p.subCategory));
        return ['All', ...Array.from(subcats)].filter(Boolean) as string[];
    }, [products, selectedCategory]);

    // Initial Filter (Branch/Category)
    const baseFilteredProducts = useMemo(() => {
        return products.filter(p => {
            const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
            const subcatMatch = selectedSubcategory === 'All' || (p.productType === selectedSubcategory || p.subCategory === selectedSubcategory);
            return catMatch && subcatMatch;
        });
    }, [products, selectedCategory, selectedSubcategory]);

    // Fuzzy Search Application (Using debounced search)
    const filteredProducts = useFuzzySearch<Product>(baseFilteredProducts, ['name', 'nameTamil', 'sku', 'barcode'], debouncedSearch);

    // Pagination
    const paginatedProducts = useMemo(() => {
        return filteredProducts.slice(0, pageSize);
    }, [filteredProducts, pageSize]);

    const handleAddToCart = (product: Product) => {
        if (product.stockQty <= 0) {
            return;
        }
        onAddToCart({ ...product, qty: 1 } as any);
    };

    const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const query = e.currentTarget.value.trim(); // Use currentTarget value for immediate access
            if (!query) return;

            // In Manual Mode or if no exact match is found, we don't auto-add unless it's an exact match
            // But standard scanner behavior expects auto-add on Enter.
            // If Manual Mode is ON, maybe we want to select the first result instead?
            // For now, let's keep exact match behavior but if fails and manual mode is on, maybe highlight first result?

            // Search in full product list for exact match, scoped to sector/branch
            const match = products.find(p => p.sku === query || p.barcode === query);

            if (match) {
                e.preventDefault(); // Prevent default enter behavior
                if (match.stockQty > 0) {
                    onAddToCart({ ...match, qty: 1 } as any);
                    setSearchQuery(''); // Clear field for next scan
                }
            } else if (isManualMode && filteredProducts.length > 0) {
                // In manual mode, pressing enter with results could add the first item
                // This is a common POS pattern for "Search -> Enter -> Add"
                e.preventDefault();
                const firstMatch = filteredProducts[0];
                if (firstMatch.stockQty > 0) {
                    onAddToCart({ ...firstMatch, qty: 1 } as any);
                    setSearchQuery('');
                }
            }
        }
    };

    React.useEffect(() => {
        const handleFocus = () => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSearchQuery('');
                setIsManualMode(false);
            }
            if (e.key === 'F2') {
                e.preventDefault();
                setIsManualMode(prev => !prev);
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
        };


        window.addEventListener('pos-focus-search', handleFocus);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('pos-focus-search', handleFocus);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-app border-r border-default relative">
            {/* Search & Filter Header */}
            <div className="p-4 space-y-4 bg-[var(--erp-bg-sunken)] border-b border-default">
                {/* Search Bar */}
                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <Search className={`absolute left-3 top-2.5 w-5 h-5 ${isManualMode ? 'text-indigo-400' : 'text-muted'}`} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={isManualMode ? "Type Name or Pattern..." : "Scan Barcode (or Ctrl+F)"}
                            className={`w-full pl-10 pr-14 py-3 erp-card border-none text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-black text-sm uppercase tracking-tight rounded-2xl shadow-inner bg-white dark:bg-neutral-900 ${isManualMode ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' : ''}`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleScanKeyDown}
                            autoFocus
                        />
                        <kbd className="absolute right-2 top-2 text-[8px] bg-[var(--erp-bg-sunken)] px-1 py-0.5 rounded text-muted border border-default font-mono font-black uppercase tracking-tighter">Ctrl+F</kbd>
                    </div>
                    <button
                        onClick={() => {
                            setIsManualMode(!isManualMode);
                            if (!isManualMode) {
                                setTimeout(() => searchInputRef.current?.focus(), 100);
                            }
                        }}
                        className={`p-2 rounded-xl border transition-all ${isManualMode
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                            : 'premium-card text-muted hover:text-muted hover:border-indigo-500/50'
                            }`}
                        title="Manual Lookup Mode (F2)"
                    >
                        <Keyboard className="w-5 h-5" />
                    </button>
                </div>


                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setSelectedCategory(cat);
                                setSelectedSubcategory('All');
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                                : 'premium-card text-muted hover:text-muted'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Subcategories (Conditional) */}
                {selectedCategory !== 'All' && subcategories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-t border-default dark:border-default/50 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {subcategories.map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubcategory(sub)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${selectedSubcategory === sub
                                    ? 'bg-[var(--erp-card)] dark:bg-neutral-200 text-main dark:text-neutral-900 shadow-sm'
                                    : 'bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default text-neutral-500 dark:text-neutral-400 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700'
                                    }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {paginatedProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToCart}
                        />
                    ))}

                    {filteredProducts.length > pageSize && (
                        <button
                            onClick={() => setPageSize(prev => prev + 20)}
                            className="col-span-full py-4 text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:bg-[var(--erp-bg-sunken)] erp-card transition-all border-dashed border-white/20"
                        >
                            Load More (+20)
                        </button>
                    )}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-neutral-400">
                            <Package className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-sm font-medium">No products found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

