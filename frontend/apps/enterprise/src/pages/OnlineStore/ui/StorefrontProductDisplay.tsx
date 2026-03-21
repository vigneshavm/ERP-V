import React from 'react';
import { ChevronDown, Grid3X3, List as ListIcon, Star, Heart, ShoppingCart } from 'lucide-react';
import { Product } from "@repo/shared";

interface StorefrontProductDisplayProps {
    filteredProducts: Product[];
    viewMode: 'grid' | 'list';
    setViewMode: (val: 'grid' | 'list') => void;
    sortBy: string;
    setSortBy: (val: string) => void;
    onAddToCart: (p: Product) => void;
}

export const StorefrontProductDisplay: React.FC<StorefrontProductDisplayProps> = ({
    filteredProducts,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    onAddToCart
}) => {
    const getProductImage = (product: Product) => {
        if (product.image) return product.image;
        return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80`;
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <p className="text-sm text-muted dark:text-muted font-medium">
                    Showing <span className="font-bold text-main">{filteredProducts.length}</span> products
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative group flex-1 sm:flex-none">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full sm:w-48 appearance-none bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default text-secondary dark:text-slate-200 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="featured">Featured</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name">Name: A-Z</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-2.5 pointer-events-none" />
                    </div>

                    <div className="flex bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-lg p-1 shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-[var(--erp-bg-sunken)] dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-muted'}`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-[var(--erp-bg-sunken)] dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-muted'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="group bg-white dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                            <div className="aspect-[4/3] bg-[var(--erp-bg-sunken)] dark:bg-slate-700 relative overflow-hidden">
                                <img
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-[var(--erp-bg)]/90 backdrop-blur rounded-full shadow-sm cursor-pointer hover:text-red-500 transition-colors">
                                    <Heart className="w-4 h-4 text-muted hover:text-red-500" />
                                </div>
                                {product.stockQty < 10 && (
                                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                                        Only {product.stockQty} left
                                    </div>
                                )}
                            </div>

                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">{product.category}</span>
                                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span className="text-muted dark:text-muted font-medium">4.5</span>
                                    </div>
                                </div>

                                <h3 className="font-bold text-main text-lg mb-1 leading-tight line-clamp-2">{product.name}</h3>
                                <p className="text-xs text-muted dark:text-muted mb-4">{product.productType}</p>

                                <div className="mt-auto flex items-center justify-between">
                                    <span className="block text-xl font-bold text-main">₹{product.sellingPrice.toLocaleString()}</span>
                                    <button
                                        onClick={() => onAddToCart(product)}
                                        disabled={product.stockQty <= 0}
                                        className="p-2.5 bg-[var(--erp-bg)] dark:bg-indigo-600 text-white rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-muted disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="group bg-white dark:bg-[var(--erp-card)] rounded-xl border border-default dark:border-default p-4 flex gap-6 items-center hover:shadow-lg transition-all">
                            <div className="w-24 h-24 bg-[var(--erp-bg-sunken)] dark:bg-slate-700 rounded-lg overflow-hidden shrink-0">
                                <img
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--erp-bg-sunken)] dark:bg-slate-700 text-secondary dark:text-muted px-2 py-0.5 rounded">{product.category}</span>
                                    {product.stockQty < 10 && <span className="text-[10px] font-bold text-red-500 uppercase">Low Stock</span>}
                                </div>
                                <h3 className="font-bold text-main text-lg truncate">{product.name}</h3>
                                <p className="text-sm text-muted dark:text-muted">{product.productType} &bull; {product.branchId}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-main mb-2">₹{product.sellingPrice.toLocaleString()}</span>
                                <button
                                    onClick={() => onAddToCart(product)}
                                    disabled={product.stockQty <= 0}
                                    className="px-4 py-2 bg-[var(--erp-bg)] dark:bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-muted text-sm font-bold transition-colors"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

