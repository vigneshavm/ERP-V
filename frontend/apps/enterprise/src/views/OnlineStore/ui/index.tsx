import { useAuthStore } from '@repo/shared';
import { logger } from '@/shared/lib/logger';

import React, { useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import { addToCart } from "@/entities/sales/model/posSlice";
import { activateEcommerce } from '@/app/store/thunks/tenantThunks';
import {
    Search, Filter, Sparkles, Send, Image as ImageIcon,
    Check, ShoppingCart
} from 'lucide-react';
import { Product } from "@repo/shared";
import { getProductRecommendations, searchProductsByImage } from "@/features/ai-intelligence/lib/GeminiService";
import { Tenant } from "@/entities/session/model/core";

// Components
import OnlineStoreSetup from './OnlineStoreSetup';
import ProductCard from './ProductCard';


const OnlineStore: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const {  user  } = useAuthStore();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { items: products } = useSelector((state: RootState) => state.inventory);
    const {  currentSector, currentBranch  } = useAuthStore();

    const activeTenant = tenants.find((t: Tenant) => t.id === user?.tenantId);
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
        return Array.from(new Set(baseProducts.map((p: Product) => p.category))) as string[];
    }, [baseProducts]);

    const handleAiSearch = async () => {
        if (!aiQuery.trim()) return;
        setAiThinking(true);
        setAiResult(null);
        try {
            const res = await getProductRecommendations(aiQuery, baseProducts);
            setAiResult({ text: res.recommendationText, ids: res.recommendedIds });
        } catch (e: any) {
            logger.error(e);
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
        } catch (err: any) {
            logger.error(err);
            setAiResult({ text: "Could not analyze image.", ids: [] });
        } finally {
            setIsVisualSearching(false);
        }
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const filteredProducts = useMemo(() => {
        return baseProducts.filter((p: Product) => {
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
        }).sort((a: Product, b: Product) => {
            switch (sortBy) {
                case 'price-asc': return a.sellingPrice - b.sellingPrice;
                case 'price-desc': return b.sellingPrice - a.sellingPrice;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });
    }, [baseProducts, aiResult, searchTerm, selectedCategories, priceRange, inStockOnly, sortBy]);

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
                    {(showAi || aiResult || visualSearchImage) && (
                        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-indigo-100 dark:border-indigo-900 shadow-xl overflow-hidden animate-in slide-in-from-top-2">
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
                        {filteredProducts.map((product: Product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={(p) => dispatch(addToCart({ ...p, qty: 1, price: p.sellingPrice }))}
                            />
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4 opacity-20" />
                                <p className="text-slate-500 font-medium text-lg">No products found matching your search.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OnlineStore;
