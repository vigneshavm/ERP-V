
import React, { useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../redux/store';
import { addToCart } from '../../../redux/slices/posSlice';
import { activateEcommerce } from '../../../redux/thunks/tenantThunks';
import {
    Search, Filter, Star, Heart, ShoppingCart,
    Sparkles, Send, X, Bot, RotateCcw, Image as ImageIcon,
    Grid3X3, List as ListIcon, SlidersHorizontal, ChevronDown,
    Check, Loader2, Rocket, ArrowRight, CheckCircle2, ShoppingBag
} from 'lucide-react';
import { Product } from "../../../types/product";
import { getProductRecommendations, searchProductsByImage } from "../../../services/geminiService";
import GrowHero from './components/GrowHero';
import FeatureMatrix from "./components/FeatureMatrix";
import PricingTiers from "./components/PricingTiers";
import { EcommercePlan } from "../../../types/tenant";

// --- Hero / Setup Component Inline (Refactor of GrowHero) ---
const OnlineStoreSetup: React.FC<{
    isLoading: boolean,
    onActivate: () => void,
    currentPlan: string
}> = ({ isLoading, onActivate, currentPlan }) => {
    return (
        <div className="space-y-12 pb-20">
            <header className="relative overflow-hidden bg-[#020617] border-b border-slate-800 pt-20 pb-40 px-6 lg:px-12 text-center lg:text-left rounded-b-[4rem] shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#4F46E5]/10 blur-[120px] rounded-full -mr-48 -mt-48 motion-safe:animate-pulse transition-opacity duration-300" aria-hidden="true" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#22C55E]/5 blur-[100px] rounded-full -ml-32 -mb-32 transition-opacity duration-300" aria-hidden="true" />

                <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F46E5]/10 rounded-full border border-[#4F46E5]/20 text-[#4F46E5] dark:text-indigo-300 text-xs font-black uppercase tracking-widest mb-8">
                            <Rocket className="w-4 h-4" aria-hidden="true" />
                            Used by Global Stores
                        </div>

                        <h1 className="text-5xl lg:text-[4.5rem] font-black text-[#F8FAFC] tracking-tight leading-[1.1] mb-8">
                            Launch Your <br />
                            <span className="text-[#4F46E5]">Digital Empire</span>
                        </h1>

                        <p className="text-[#64748B] text-xl lg:text-2xl font-medium leading-relaxed max-w-xl mb-12">
                            Turn your store into a 24×7 online business in minutes. Reach global customers with integrated POS and inventory management.
                        </p>

                        <button
                            onClick={onActivate}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-10 py-5 bg-[#4F46E5] text-white rounded-xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all duration-200 focus:ring-4 focus:ring-[#4F46E5]/40 focus:outline-none flex items-center justify-center gap-4 group"
                        >
                            {isLoading ? 'Activating...' : 'Start Free Trial'}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="hidden xl:block w-full max-w-md">
                        <div className="relative aspect-square bg-[#020617] rounded-[3rem] border border-slate-800 p-8 shadow-inner overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/20 to-transparent" />
                            <div className="relative h-full flex flex-col justify-center items-center text-center">
                                <ShoppingBag className="w-24 h-24 text-[#F8FAFC] mb-8" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6">
                <FeatureMatrix />
                <PricingTiers currentPlan={currentPlan} onUpgrade={() => { }} />
            </div>
        </div>
    );
};


const OnlineStore: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { items: products } = useSelector((state: RootState) => state.inventory);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const ecomConfig = activeTenant?.ecommerceConfig;
    const isEnabled = ecomConfig?.isEnabled || false;
    const currentPlan = ecomConfig?.plan || 'STARTER';

    const [isLoading, setIsLoading] = useState(false);

    // --- Actions ---
    const handleActivate = async () => {
        if (!user?.tenantId) return;
        setIsLoading(true);
        await dispatch(activateEcommerce(user.tenantId));
        setIsLoading(false);
    };

    // --- Storefront State ---
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAi, setShowAi] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiThinking, setAiThinking] = useState(false);
    const [aiResult, setAiResult] = useState<{ text: string, ids: string[] } | null>(null);
    const [visualSearchImage, setVisualSearchImage] = useState<string | null>(null);
    const [isVisualSearching, setIsVisualSearching] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [priceRange, setPriceRange] = useState<{ min: string, max: string }>({ min: '', max: '' });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('featured');
    const [inStockOnly, setInStockOnly] = useState(false);

    // --- Data Preparation ---
    const baseProducts = useMemo(() => {
        return products.filter((p: Product) =>
            p.sector === currentSector && (currentBranch === 'All' || p.branchId === currentBranch)
        );
    }, [products, currentSector, currentBranch]);

    const availableCategories = useMemo(() => {
        return Array.from(new Set(baseProducts.map(p => p.category))) as string[];
    }, [baseProducts]);

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
        const url = URL.createObjectURL(file);
        setVisualSearchImage(url);
        setIsVisualSearching(true);
        setAiResult(null);
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

    const filteredProducts = useMemo(() => {
        return baseProducts.filter(p => {
            if (aiResult && aiResult.ids.length > 0) {
                if (!aiResult.ids.includes(p.id)) return false;
            }
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.category.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) {
                return false;
            }
            const min = parseFloat(priceRange.min);
            const max = parseFloat(priceRange.max);
            if (!isNaN(min) && p.sellingPrice < min) return false;
            if (!isNaN(max) && p.sellingPrice > max) return false;
            if (inStockOnly && p.stockQty <= 0) return false;
            return true;
        }).sort((a, b) => {
            switch (sortBy) {
                case 'price-asc': return a.sellingPrice - b.sellingPrice;
                case 'price-desc': return b.sellingPrice - a.sellingPrice;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });
    }, [baseProducts, aiResult, searchTerm, selectedCategories, priceRange, inStockOnly, sortBy]);

    const getProductImage = (product: any) => {
        if (product.image) return product.image;
        return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80`;
    };

    // --- Render ---

    if (!isEnabled) {
        return <OnlineStoreSetup isLoading={isLoading} onActivate={handleActivate} currentPlan={currentPlan} />;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-fade-in relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* --- Top Navigation Bar --- */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
                <div className="flex-1 max-w-2xl relative flex items-center">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-3" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                        title="Search by Image"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleVisualSearch} />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setShowAi(!showAi)}
                        className={`hidden md:flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${showAi ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>AI Assistant</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* --- Sidebar Filters (Desktop) --- */}
                <aside className={`w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto hidden md:block p-8`}>
                    <div className="flex items-center gap-2 mb-8 text-slate-900 dark:text-white font-black text-lg">
                        <Filter className="w-5 h-5" /> Filters
                    </div>
                    {/* Filter Controls (Categories, Price, etc) - Copied from Storefront.tsx */}
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Categories</h4>
                            <div className="space-y-3">
                                {availableCategories.map(cat => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                            {selectedCategories.includes(cat) && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" onChange={() => toggleCategory(cat)} checked={selectedCategories.includes(cat)} />
                                        <span className={`text-sm ${selectedCategories.includes(cat) ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* --- Main Content Area --- */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    {/* ... (AI Feedback Area - same as Storefront.tsx) ... */}
                    {(showAi || aiResult || visualSearchImage) && (
                        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-indigo-100 dark:border-indigo-900 shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                            {/* ... Content ... */}
                            <div className="p-6">
                                {showAi && !visualSearchImage && !aiResult && !aiThinking && (
                                    <div className="relative">
                                        <textarea
                                            value={aiQuery}
                                            onChange={e => setAiQuery(e.target.value)}
                                            placeholder="Describe what you are looking for..."
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 pr-14 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSearch(); } }}
                                        />
                                        <button onClick={handleAiSearch} disabled={!aiQuery.trim()} className="absolute right-4 bottom-4 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {aiResult && <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-medium leading-relaxed">{aiResult.text}</div>}
                            </div>
                        </div>
                    )}

                    {/* Product Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="group bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
                                <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                                    <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full shadow-sm cursor-pointer hover:text-red-500 transition-colors">
                                        <Heart className="w-5 h-5 text-slate-400 hover:text-red-500" />
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 leading-tight line-clamp-2">{product.name}</h3>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="block text-2xl font-black text-slate-900 dark:text-white">₹{product.sellingPrice.toLocaleString()}</span>
                                        <button onClick={() => dispatch(addToCart({ ...product, qty: 1, price: product.sellingPrice }))} disabled={product.stockQty <= 0} className="p-4 bg-[#020617] dark:bg-[#4F46E5] text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-xl">
                                            <ShoppingCart className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OnlineStore;
