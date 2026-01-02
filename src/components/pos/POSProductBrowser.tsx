import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../../types/product';
import { Sector } from '../../types/common';
import { Search, Package, Check } from 'lucide-react';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';

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
        const branchProds = products.filter(p => currentBranch === 'All' || p.branchId === currentBranch);
        const cats = new Set(branchProds.map(p => p.category));
        return ['All', ...Array.from(cats)].filter(Boolean);
    }, [products, currentBranch]);

    const subcategories = useMemo(() => {
        if (selectedCategory === 'All') return [];
        const branchProds = products.filter(p => currentBranch === 'All' || p.branchId === currentBranch);
        const filteredByCat = branchProds.filter(p => p.category === selectedCategory);
        const subcats = new Set(filteredByCat.map(p => p.productType || p.subCategory));
        return ['All', ...Array.from(subcats)].filter(Boolean) as string[];
    }, [products, currentBranch, selectedCategory]);

    // Initial Filter (Branch/Category)
    const baseFilteredProducts = useMemo(() => {
        return products.filter(p => {
            const branchMatch = currentBranch === 'All' || p.branchId === currentBranch;
            const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
            const subcatMatch = selectedSubcategory === 'All' || (p.productType === selectedSubcategory || p.subCategory === selectedSubcategory);
            return branchMatch && catMatch && subcatMatch;
        });
    }, [products, currentBranch, selectedCategory, selectedSubcategory]);

    // Fuzzy Search Application (Using debounced search)
    const filteredProducts = useFuzzySearch<Product>(baseFilteredProducts, ['name', 'sku', 'barcode'], debouncedSearch);

    // Pagination
    const paginatedProducts = useMemo(() => {
        return filteredProducts.slice(0, pageSize);
    }, [filteredProducts, pageSize]);

    const handleAddToCart = (product: Product) => {
        if (product.stock <= 0) {
            return;
        }
        onAddToCart({ ...product, qty: 1 } as any);
    };

    const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const query = e.currentTarget.value.trim(); // Use currentTarget value for immediate access
            if (!query) return;

            // Search in full product list for exact match, scoped to sector/branch
            const match = products.find(p =>
                (p.sku === query || p.barcode === query) &&
                (currentBranch === 'All' || p.branchId === currentBranch)
            );

            if (match) {
                e.preventDefault(); // Prevent default enter behavior
                if (match.stock > 0) {
                    onAddToCart({ ...match, qty: 1 } as any);
                    setSearchQuery(''); // Clear field for next scan
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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 relative">
            {/* Search & Filter Header */}
            <div className="p-4 space-y-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search Name, SKU, Barcode... (Ctrl+F)"
                        className="w-full pl-10 pr-14 py-2 bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-slate-800 dark:white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleScanKeyDown}
                        autoFocus
                    />
                    <kbd className="absolute right-2 top-2 text-[9px] bg-slate-200 dark:bg-slate-600 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-500 font-mono">Ctrl+F</kbd>
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
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Subcategories (Conditional) */}
                {selectedCategory !== 'All' && subcategories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-t border-slate-100 dark:border-slate-700/50 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {subcategories.map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubcategory(sub)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${selectedSubcategory === sub
                                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
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
                        <button
                            key={product.id}
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock <= 0}
                            className={`text-left group relative flex flex-col bg-white dark:bg-slate-800 rounded-xl border transition-all duration-200 ${product.stock <= 0
                                ? 'opacity-50 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md'
                                }`}
                        >
                            {/* ... existing card content ... */}
                            <div className="h-28 w-full bg-slate-100 dark:bg-slate-700/50 rounded-t-xl overflow-hidden relative">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                        <Package className="w-8 h-8" />
                                    </div>
                                )}
                                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${product.stock > 10 ? 'bg-emerald-100 text-emerald-700' :
                                    product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {product.stock} {product.unit === 'Meter' ? 'm' : ''}
                                </div>
                            </div>

                            <div className="p-3 flex flex-col flex-1">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-2 mb-1">{product.name}</h3>
                                <div className="mt-auto flex justify-between items-end">
                                    <span className="text-xs text-slate-500 font-mono">{product.sku}</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{product.price}</span>
                                </div>
                            </div>

                            <div className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                {product.stock > 0 && <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg"><Check className="w-5 h-5" /></div>}
                            </div>
                        </button>
                    ))}

                    {filteredProducts.length > pageSize && (
                        <button
                            onClick={() => setPageSize(prev => prev + 20)}
                            className="col-span-full py-4 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl transition-colors border-2 border-dashed border-slate-200 dark:border-slate-700"
                        >
                            Load More (+20)
                        </button>
                    )}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                            <Package className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-sm font-medium">No products found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
