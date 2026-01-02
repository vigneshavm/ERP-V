import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, Search, Package, LayoutGrid, Check } from 'lucide-react';
import { Product } from '../../types/product';

interface POSCategoryBrowserModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    categories: string[];
    getSubcategories: (category: string) => string[];
    onAddToCart: (product: Product) => void;
}

export const POSCategoryBrowserModal: React.FC<POSCategoryBrowserModalProps> = ({
    isOpen,
    onClose,
    products,
    categories,
    getSubcategories,
    onAddToCart
}) => {
    const [step, setStep] = useState<'CATEGORIES' | 'SUBCATEGORIES' | 'PRODUCTS'>('CATEGORIES');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSubcategories = useMemo(() => {
        if (!selectedCategory) return [];
        return getSubcategories(selectedCategory);
    }, [selectedCategory, getSubcategories]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const catMatch = !selectedCategory || p.category === selectedCategory;
            const subMatch = !selectedSubcategory || (p.productType === selectedSubcategory || p.subCategory === selectedSubcategory);
            const searchMatch = !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase());
            return catMatch && subMatch && searchMatch;
        });
    }, [products, selectedCategory, selectedSubcategory, searchQuery]);

    if (!isOpen) return null;

    const handleCategorySelect = (cat: string) => {
        setSelectedCategory(cat);
        setStep('SUBCATEGORIES');
    };

    const handleSubcategorySelect = (sub: string) => {
        setSelectedSubcategory(sub);
        setStep('PRODUCTS');
    };

    const handleBack = () => {
        if (step === 'PRODUCTS') {
            setStep('SUBCATEGORIES');
            setSelectedSubcategory('');
        } else if (step === 'SUBCATEGORIES') {
            setStep('CATEGORIES');
            setSelectedCategory('');
        }
    };

    const handleAddToCart = (product: Product) => {
        onAddToCart({ ...product, qty: 1 } as any);
        onClose();
        // Reset state for next time
        setStep('CATEGORIES');
        setSelectedCategory('');
        setSelectedSubcategory('');
        setSearchQuery('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        {step !== 'CATEGORIES' && (
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <LayoutGrid className="w-6 h-6 text-indigo-600" />
                                {step === 'CATEGORIES' ? 'Select Category' :
                                    step === 'SUBCATEGORIES' ? selectedCategory :
                                        selectedSubcategory}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {step === 'CATEGORIES' ? 'Browse products by department' :
                                    step === 'SUBCATEGORIES' ? 'Pick a product type' :
                                        'Select the items to add'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-red-500"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar (Only for products view) */}
                {step === 'PRODUCTS' && (
                    <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search in this category..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {step === 'CATEGORIES' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {categories.filter(c => c !== 'All').map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategorySelect(cat)}
                                    className="group p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-600 dark:hover:bg-indigo-600 rounded-3xl transition-all duration-300 flex flex-col items-center gap-4 border-2 border-transparent hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/20"
                                >
                                    <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Package className="w-8 h-8 text-indigo-600 group-hover:text-indigo-400" />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-white transition-colors">{cat}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'SUBCATEGORIES' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredSubcategories.map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => handleSubcategorySelect(sub)}
                                    className="p-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-500 rounded-3xl transition-all flex flex-col items-center gap-3 hover:shadow-lg"
                                >
                                    <LayoutGrid className="w-8 h-8 text-slate-400" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-center">{sub}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'PRODUCTS' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => handleAddToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={`text-left p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-2 border-transparent hover:border-indigo-500 rounded-2xl transition-all flex flex-col gap-2 ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{product.name}</h4>
                                        <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-black">₹{product.price}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                                        <span>SKU: {product.sku}</span>
                                        <span className={product.stock > 10 ? 'text-emerald-500' : 'text-amber-500'}>Stock: {product.stock}</span>
                                    </div>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Search className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="font-bold">No products match your search</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Check className="w-3 h-3" /> Quick Add Mode Active
                    </p>
                </div>
            </div>
        </div>
    );
};
