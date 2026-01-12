import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../../types/product';
import { Sector } from '../../types/common';
import { Search, Package, Check } from 'lucide-react';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard = React.memo<ProductCardProps>(({ product, onAddToCart }) => {
    return (
        <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
            className={`text-left group relative flex flex-col bg-white dark:bg-neutral-800 rounded-xl border transition-all duration-200 ${product.stock <= 0
                ? 'opacity-50 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary dark:hover:border-primary hover:shadow-md'
                }`}
        >
            <div className="h-28 w-full bg-neutral-100 dark:bg-neutral-700/50 rounded-t-xl overflow-hidden relative">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-600">
                        <Package className="w-8 h-8" />
                    </div>
                )}
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${product.stock > 10 ? 'bg-success/10 text-success' :
                    product.stock > 0 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                    }`}>
                    {product.stock} {product.unit === 'Meter' ? 'm' : ''}
                </div>
            </div>

            <div className="p-3 flex flex-col flex-1">
                <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm line-clamp-2 mb-1">{product.name}</h3>
                <div className="mt-auto flex justify-between items-end">
                    <span className="text-xs text-neutral-500 font-mono">{product.sku}</span>
                    <span className="font-bold text-primary">₹{product.price}</span>
                </div>
            </div>

            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                {product.stock > 0 && <div className="bg-primary text-white p-2 rounded-full shadow-lg"><Check className="w-5 h-5" /></div>}
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
            const match = products.find(p => p.sku === query || p.barcode === query);

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
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 relative">
            {/* Search & Filter Header */}
            <div className="p-4 space-y-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search Name, SKU, Barcode... (Ctrl+F)"
                        className="w-full pl-10 pr-14 py-2 bg-neutral-100 dark:bg-neutral-700 border-none rounded-lg text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-primary transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleScanKeyDown}
                        autoFocus
                    />
                    <kbd className="absolute right-2 top-2 text-[9px] bg-neutral-200 dark:bg-neutral-600 px-1 py-0.5 rounded text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-500 font-mono">Ctrl+F</kbd>
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
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Subcategories (Conditional) */}
                {selectedCategory !== 'All' && subcategories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-t border-neutral-100 dark:border-neutral-700/50 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {subcategories.map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubcategory(sub)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${selectedSubcategory === sub
                                    ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-sm'
                                    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
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
                            className="col-span-full py-4 text-primary font-bold hover:bg-primary/5 dark:hover:bg-neutral-700 rounded-xl transition-colors border-2 border-dashed border-neutral-200 dark:border-neutral-700"
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
