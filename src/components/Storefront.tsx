
import React, { useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addToCart } from '../store';
import {
    ShoppingBag, Search, Filter, Star, Heart, ShoppingCart,
    Sparkles, Send, X, Bot, RotateCcw, Image as ImageIcon,
    Grid3X3, List as ListIcon, SlidersHorizontal, ChevronDown,
    Check, Loader2, ArrowUpDown
} from 'lucide-react';
import { Product } from '../../types';
import { getProductRecommendations, searchProductsByImage } from '../services/geminiService';

const Storefront: React.FC = () => {
    const dispatch = useDispatch();
    const { products } = useSelector((state: RootState) => state.inventory);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);

    // --- View State ---
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- Search & AI State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [showAi, setShowAi] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiThinking, setAiThinking] = useState(false);
    const [aiResult, setAiResult] = useState<{ text: string, ids: string[] } | null>(null);

    // --- Visual Search State ---
    const [visualSearchImage, setVisualSearchImage] = useState<string | null>(null);
    const [isVisualSearching, setIsVisualSearching] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Filter State ---
    const [priceRange, setPriceRange] = useState<{ min: string, max: string }>({ min: '', max: '' });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('featured');
    const [inStockOnly, setInStockOnly] = useState(false);

    // --- Data Preparation ---
    // 1. Get base products for current store context
    const baseProducts = useMemo(() => {
        return products.filter(p =>
            p.sector === currentSector && (currentBranch === 'All' || p.branch === currentBranch)
        );
    }, [products, currentSector, currentBranch]);

    // 2. Extract available categories dynamically
    const availableCategories = useMemo(() => {
        return Array.from(new Set(baseProducts.map(p => p.category))) as string[];
    }, [baseProducts]);

    // --- Actions ---

    const handleAiSearch = async () => {
        if (!aiQuery.trim()) return;
        setAiThinking(true);
        setAiResult(null);
        try {
            const res = await getProductRecommendations(aiQuery, baseProducts);
            setAiResult({ text: res.recommendationText, ids: res.recommendedIds });
        } catch (e) {
            console.error(e);
            setAiResult({ text: "I'm having trouble connecting to the brain right now. Please try again.", ids: [] });
        } finally {
            setAiThinking(false);
        }
    };

    const handleVisualSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const url = URL.createObjectURL(file);
        setVisualSearchImage(url);
        setIsVisualSearching(true);
        setAiResult(null); // Clear text AI result to prioritize visual

        try {
            const ids = await searchProductsByImage(file, baseProducts);
            setAiResult({
                text: `I found ${ids.length} products that look similar to your image.`,
                ids: ids
            });
        } catch (err) {
            console.error(err);
            setAiResult({ text: "Could not analyze image.", ids: [] });
        } finally {
            setIsVisualSearching(false);
        }
    };

    const clearAi = () => {
        setAiResult(null);
        setAiQuery('');
        setVisualSearchImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    // --- Filtering Logic ---
    const filteredProducts = useMemo(() => {
        return baseProducts.filter(p => {
            // AI Filter (Text or Visual)
            if (aiResult && aiResult.ids.length > 0) {
                if (!aiResult.ids.includes(p.id)) return false;
            }

            // Text Search
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.category.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Category Filter
            if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) {
                return false;
            }

            // Price Filter
            const min = parseFloat(priceRange.min);
            const max = parseFloat(priceRange.max);
            if (!isNaN(min) && p.price < min) return false;
            if (!isNaN(max) && p.price > max) return false;

            // Availability
            if (inStockOnly && p.stock <= 0) return false;

            return true;
        }).sort((a, b) => {
            switch (sortBy) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0; // Featured / Default Order
            }
        });
    }, [baseProducts, aiResult, searchTerm, selectedCategories, priceRange, inStockOnly, sortBy]);

    // Helper to get a relevant image
    const getProductImage = (product: Product) => {
        // If product has a user-uploaded image, use it
        if (product.image) {
            return product.image;
        }
        // Placeholder logic
        return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-fade-in relative">

            {/* --- Top Navigation Bar --- */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4">
                <div className="flex-1 max-w-2xl relative flex items-center">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-12 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-3" />

                    {/* Visual Search Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                        title="Search by Image"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleVisualSearch}
                    />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setShowAi(!showAi)}
                        className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${showAi ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>AI Assistant</span>
                    </button>

                    <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="md:hidden p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                        <SlidersHorizontal className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">

                {/* --- Sidebar Filters (Desktop) --- */}
                <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto hidden md:block p-5`}>
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-white font-bold text-lg">
                        <Filter className="w-5 h-5" /> Filters
                    </div>

                    {/* Categories */}
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Categories</h4>
                        <div className="space-y-2">
                            {availableCategories.map(cat => (
                                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                        {selectedCategories.includes(cat) && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" onChange={() => toggleCategory(cat)} checked={selectedCategories.includes(cat)} />
                                    <span className={`text-sm ${selectedCategories.includes(cat) ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}>{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Range</h4>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                value={priceRange.min}
                                onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                value={priceRange.max}
                                onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="mb-8">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${inStockOnly ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <input type="checkbox" className="hidden" checked={inStockOnly} onChange={() => setInStockOnly(!inStockOnly)} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">In Stock Only</span>
                        </label>
                    </div>

                    {/* Clear All */}
                    <button
                        onClick={() => { setSelectedCategories([]); setPriceRange({ min: '', max: '' }); setInStockOnly(false); clearAi(); setSearchTerm(''); }}
                        className="w-full py-2 text-sm text-slate-500 hover:text-red-500 font-medium transition-colors border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                        Reset Filters
                    </button>
                </aside>

                {/* --- Main Content Area --- */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">

                    {/* --- AI & Visual Search Feedback Area --- */}
                    {(showAi || aiResult || visualSearchImage) && (
                        <div className="mb-8 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                            {/* Text AI Header */}
                            {showAi && !visualSearchImage && (
                                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        <span className="font-bold">AI Shopping Assistant</span>
                                    </div>
                                    <button onClick={() => setShowAi(false)} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-4 h-4" /></button>
                                </div>
                            )}

                            <div className="p-6">
                                {/* Visual Search Preview */}
                                {visualSearchImage && (
                                    <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                        <div className="relative group">
                                            <img src={visualSearchImage} alt="Visual Search" className="w-24 h-24 object-cover rounded-xl border-2 border-indigo-500 shadow-md" />
                                            <button onClick={clearAi} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"><X className="w-3 h-3" /></button>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                                                Visual Search Active
                                                {isVisualSearching && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                                {isVisualSearching ? 'Analyzing image and matching products...' : 'Here are products that visually match your upload.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Chat Input (Only if text mode is active and no visual search pending) */}
                                {showAi && !visualSearchImage && !aiResult && !aiThinking && (
                                    <div className="relative">
                                        <textarea
                                            value={aiQuery}
                                            onChange={e => setAiQuery(e.target.value)}
                                            placeholder="Describe what you are looking for..."
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pr-14 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20 text-slate-900 dark:text-white placeholder:text-slate-400"
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSearch(); } }}
                                        />
                                        <button
                                            onClick={handleAiSearch}
                                            disabled={!aiQuery.trim()}
                                            className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-all"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* AI Loading State */}
                                {aiThinking && (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="w-12 h-12 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                                        <p className="text-slate-800 dark:text-white font-bold animate-pulse">Thinking...</p>
                                    </div>
                                )}

                                {/* AI Result Display */}
                                {aiResult && (
                                    <div className="animate-in fade-in">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                                <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm">
                                                    {aiResult.text}
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                                                        {aiResult.ids.length} Results
                                                    </span>
                                                    <button onClick={clearAi} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-1">
                                                        <RotateCcw className="w-3 h-3" /> Clear Search
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- Toolbar: Sort & View Toggle --- */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Showing <span className="font-bold text-slate-900 dark:text-white">{filteredProducts.length}</span> products
                        </p>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative group flex-1 sm:flex-none">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full sm:w-48 appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="featured">Featured</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name">Name: A-Z</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                            </div>

                            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- Product Grid/List --- */}
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                                    {/* Image Area */}
                                    <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                                        <img
                                            src={getProductImage(product)}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full shadow-sm cursor-pointer hover:text-red-500 transition-colors">
                                            <Heart className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                        </div>
                                        {product.stock < 10 && (
                                            <div className="absolute bottom-3 left-3 px-2 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                                                Only {product.stock} left
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">{product.category}</span>
                                            <div className="flex items-center gap-1 text-amber-400 text-xs">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">4.5</span>
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 leading-tight line-clamp-2">{product.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{product.productType}</p>

                                        <div className="mt-auto flex items-center justify-between">
                                            <div>
                                                <span className="block text-xl font-bold text-slate-900 dark:text-white">₹{product.price.toLocaleString()}</span>
                                            </div>
                                            <button
                                                onClick={() => dispatch(addToCart({ ...product, qty: 1 }))}
                                                disabled={product.stock <= 0}
                                                className="p-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
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
                                <div key={product.id} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex gap-6 items-center hover:shadow-lg transition-all">
                                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0">
                                        <img
                                            src={getProductImage(product)}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{product.category}</span>
                                            {product.stock < 10 && <span className="text-[10px] font-bold text-red-500 uppercase">Low Stock</span>}
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{product.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{product.productType} &bull; {product.branch}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-slate-900 dark:text-white mb-2">₹{product.price.toLocaleString()}</span>
                                        <button
                                            onClick={() => dispatch(addToCart({ ...product, qty: 1 }))}
                                            disabled={product.stock <= 0}
                                            className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-sm font-bold transition-colors"
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- Empty State --- */}
                    {filteredProducts.length === 0 && (
                        <div className="py-20 text-center text-slate-400 dark:text-slate-500">
                            {aiResult ? (
                                <>
                                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">AI couldn't find exact matches for your request.</p>
                                    <button onClick={clearAi} className="mt-4 text-indigo-600 font-bold hover:underline">Clear Search</button>
                                </>
                            ) : (
                                <>
                                    <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">No products found matching your filters.</p>
                                    <button onClick={() => { setSearchTerm(''); setSelectedCategories([]); setPriceRange({ min: '', max: '' }); }} className="mt-4 text-indigo-600 font-bold hover:underline">Clear Filters</button>
                                </>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Storefront;
