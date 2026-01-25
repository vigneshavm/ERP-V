import { useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addToCart } from '../../store';
import { Product } from '../../types/product';
import { getProductRecommendations, searchProductsByImage } from '../../services/geminiService';

export const useStorefrontLogic = () => {
    const dispatch = useDispatch();
    const { products } = useSelector((state: RootState) => state.inventory);
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);

    // --- View State ---
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showAi, setShowAi] = useState(false);

    // --- Search & AI State ---
    const [searchTerm, setSearchTerm] = useState('');
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
    const baseProducts = useMemo(() => {
        return products.filter(p =>
            p.sector === currentSector && (currentBranch === 'All' || p.branchId === currentBranch)
        );
    }, [products, currentSector, currentBranch]);

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

    const resetFilters = () => {
        setSelectedCategories([]);
        setPriceRange({ min: '', max: '' });
        setInStockOnly(false);
        clearAi();
        setSearchTerm('');
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
            if (!isNaN(min) && p.price < min) return false;
            if (!isNaN(max) && p.price > max) return false;
            if (inStockOnly && p.stock <= 0) return false;
            return true;
        }).sort((a, b) => {
            switch (sortBy) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });
    }, [baseProducts, aiResult, searchTerm, selectedCategories, priceRange, inStockOnly, sortBy]);

    const addToCartHandler = (product: Product) => {
        dispatch(addToCart({ ...product, qty: 1 }));
    };

    return {
        // State
        viewMode, setViewMode,
        showMobileFilters, setShowMobileFilters,
        showAi, setShowAi,
        searchTerm, setSearchTerm,
        aiQuery, setAiQuery,
        aiThinking,
        aiResult,
        visualSearchImage,
        isVisualSearching,
        fileInputRef,
        priceRange, setPriceRange,
        selectedCategories,
        sortBy, setSortBy,
        inStockOnly, setInStockOnly,
        // Derived
        availableCategories,
        filteredProducts,
        // Handlers
        handleAiSearch,
        handleVisualSearch,
        clearAi,
        toggleCategory,
        resetFilters,
        addToCartHandler
    };
};
