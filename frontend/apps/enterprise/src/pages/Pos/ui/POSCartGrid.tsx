import { logger } from '@/shared/lib/logger';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product } from "@repo/shared";
import { CartItem } from "@repo/shared";
import { Sector } from "@repo/shared";
import { Barcode, Search, ShoppingCart, Trash2, Folder } from 'lucide-react';
import { productTypes, ProductType } from '@/entities/inventory/api/productTypes';
// import { CameraScanner } from '../CameraScanner';
// import { searchProductsByImage } from "@/features/ai-intelligence/lib/GeminiService";

interface POSCartGridProps {
    cart: CartItem[];
    products: Product[];
    currentSector: Sector;
    currentBranch: string;
    isProcessing: boolean;
    onAddToCart: (item: CartItem) => void;
    onRemoveFromCart: (id: string) => void;
    onUpdateCartQty: (id: string, qty: number) => void;
    onUpdateCartLength: (id: string, length: number) => void;
    onOpenCategoryBrowser: () => void;
    allProductTypes: string[];
}

import { useFuzzySearch } from "@/shared/lib/hooks/useFuzzySearch";
// import { POSVariantSelectionModal } from './POSVariantSelectionModal';
// import { POSVariantSelectionModal } from './POSVariantSelectionModal';

interface CartItemRowProps {
    item: CartItem;
    idx: number;
    onUpdateCartQty: (id: string, qty: number) => void;
    onUpdateCartLength: (id: string, length: number) => void;
    onRemoveFromCart: (id: string) => void;
    skuInputRef: React.RefObject<HTMLInputElement | null>;
    cartQtyRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>;
}

const CartItemRow = React.memo<CartItemRowProps>(({
    item,
    idx,
    onUpdateCartQty,
    onUpdateCartLength,
    onRemoveFromCart,
    skuInputRef,
    cartQtyRefs
}) => {
    const qtyInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <tr className="hover:bg-indigo-500/5 transition-all bg-transparent border-b border-default group">
            <td className="py-1.5 px-2 text-center text-neutral-400 font-mono hidden md:table-cell text-xs">{idx + 1}</td>
            <td className="py-1.5 px-2">
                <p className="font-black text-muted text-[11px] uppercase tracking-tight">
                    {item.name}
                    {item.qty < 0 && <span className="ml-2 text-[9px] uppercase font-black text-white bg-rose-600 px-1 rounded-sm">RETURN</span>}
                </p>
                <p className="text-[9px] text-secondary font-mono tracking-tighter">
                    {item.sku} {item.unit === 'Meter' && <span className="bg-indigo-500/10 text-indigo-400 px-1 rounded ml-1">Per Meter</span>}
                </p>
                {(item.size || item.color) && (
                    <div className="flex gap-2 mt-0.5">
                        {item.size && <span className="text-[9px] bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300 font-bold">Size: {item.size}</span>}
                        {item.color && <span className="text-[9px] bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300 font-bold">Col: {item.color}</span>}
                    </div>
                )}
            </td>
            <td className="py-1.5 px-2 text-center font-black font-mono text-muted hidden sm:table-cell text-[10px]">
                ₹{item.price.toFixed(2)}
            </td>

            {/* Meter Column */}
            <td className="py-1.5 px-2 text-center">
                {item.unit === 'Meter' ? (
                    <div className="flex items-center justify-center gap-1 bg-indigo-500/10 rounded-lg p-0.5 border border-indigo-500/20 w-fit mx-auto">
                        <input
                            // eslint-disable-next-line react-hooks/immutability -- TODO(TS-FIX): Phase 2/3 fix
                            ref={(el) => { cartQtyRefs.current[item.id] = el; }}
                            type="number"
                            value={item.cutLength || 1}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                    onUpdateCartLength(item.id, val);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') skuInputRef.current?.focus();
                            }}
                            className="w-14 text-center bg-transparent border-none font-black text-indigo-400 focus:ring-0 rounded h-6 text-[10px] spin-hide"
                            placeholder="1.00"
                            step="0.01"
                        />
                        <span className="text-[9px] font-black text-indigo-400/60 mr-1">m</span>
                    </div>
                ) : (
                    <span className="text-neutral-300 text-xs">-</span>
                )}
            </td>

            {/* Quantity Column */}
            <td className="py-1.5 px-2 text-center">
                <div className="flex items-center justify-center gap-1 bg-[var(--erp-bg-sunken)] rounded-lg p-0.5 border border-default w-fit mx-auto">
                    <button
                        onClick={() => onUpdateCartQty(item.id, item.qty - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-[var(--erp-bg-sunken)] hover:bg-white/10 rounded text-muted text-[10px] transition-colors"
                        tabIndex={-1}
                    >-</button>
                    <input
                        // eslint-disable-next-line react-hooks/immutability -- TODO(TS-FIX): Phase 2/3 fix
                        ref={(el) => { if (item.unit !== 'Meter') cartQtyRefs.current[item.id] = el; }}
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                                onUpdateCartQty(item.id, val);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') skuInputRef.current?.focus();
                        }}
                        className="w-10 text-center bg-transparent border-none font-black text-muted focus:ring-0 rounded h-6 text-[10px] spin-hide"
                    />
                    <button
                        onClick={() => onUpdateCartQty(item.id, item.qty + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-[var(--erp-bg-sunken)] hover:bg-white/10 rounded text-muted text-[10px] transition-colors"
                        tabIndex={-1}
                    >+</button>
                </div>
            </td>
            <td className={`py-1.5 px-2 text-right font-black font-mono text-[11px] uppercase tracking-tighter ${(item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty)) < 0
                ? 'text-rose-400'
                : 'text-emerald-400'
                }`}>
                ₹{(item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty)).toFixed(2)}
            </td>
            <td className="py-1.5 px-2 text-center">
                <button
                    onClick={() => onRemoveFromCart(item.id)}
                    className="p-1.5 text-secondary hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                    tabIndex={-1}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    );
});

CartItemRow.displayName = 'CartItemRow';

const CartItemCard = React.memo<CartItemRowProps>(({
    item,
    onUpdateCartQty,
    onRemoveFromCart
}) => {
    return (
        <div className="bg-white dark:bg-[var(--erp-card)] p-3 rounded-xl border border-default dark:border-default shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-neutral-800 dark:text-neutral-100 line-clamp-2">
                        {item.name}
                        {item.qty < 0 && <span className="ml-2 text-[10px] uppercase font-black text-white bg-red-500 px-1 rounded-sm">RET</span>}
                    </p>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.sku}</p>
                    {(item.size || item.color) && (
                        <div className="flex gap-2 mt-1">
                            {item.size && <span className="text-[10px] bg-[var(--erp-bg-sunken)] dark:bg-neutral-700/50 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300">Sz: {item.size}</span>}
                            {item.color && <span className="text-[10px] bg-[var(--erp-bg-sunken)] dark:bg-neutral-700/50 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300">Col: {item.color}</span>}
                        </div>
                    )}
                </div>
                <p className={`font-bold font-mono ${item.qty < 0 ? 'text-red-500' : 'text-success'}`}>
                    ₹{(item.price * item.qty).toFixed(2)}
                </p>
            </div>

            <div className="flex justify-between items-center bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 p-2 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white dark:bg-[var(--erp-card)] rounded-lg border border-default dark:border-default p-0.5 shadow-sm">
                        <button
                            onClick={() => onUpdateCartQty(item.id, Math.max(0, item.qty - 1))}
                            className="w-8 h-8 flex items-center justify-center text-neutral-500 active:bg-[var(--erp-bg-sunken)] rounded-md"
                        >-</button>
                        <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                        <button
                            onClick={() => onUpdateCartQty(item.id, item.qty + 1)}
                            className="w-8 h-8 flex items-center justify-center text-primary active:bg-primary/5 rounded-md"
                        >+</button>
                    </div>
                    <p className="text-xs text-neutral-400">@ ₹{item.price}</p>
                </div>

                <button
                    onClick={() => onRemoveFromCart(item.id)}
                    className="p-2 text-error bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-lg shadow-sm"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
});

CartItemCard.displayName = 'CartItemCard';

// ... (props interface unchanged)

export const POSCartGrid: React.FC<POSCartGridProps> = ({
    cart,
    products,
    currentSector,
    currentBranch,
    isProcessing,
    onAddToCart,
    onRemoveFromCart,
    onUpdateCartQty,
    onUpdateCartLength,
    onOpenCategoryBrowser,
    allProductTypes
}) => {
    // Local State
    const [typeQuery, setTypeQuery] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedTypeIndex, setSelectedTypeIndex] = useState(-1);

    const [nameQuery, setNameQuery] = useState('');
    const [selectedNameIndex, setSelectedNameIndex] = useState(-1);

    // Quick Entry State (for items without barcode)
    const [quickEntryPrice, setQuickEntryPrice] = useState('');
    const [quickEntryQty, setQuickEntryQty] = useState('1');
    const [quickEntryMeter, setQuickEntryMeter] = useState('1');

    // Compute the selected type's unit
    const selectedTypeUnit = useMemo(() => {
        if (!selectedType) return 'Piece';
        const typeInfo = productTypes.find((pt: ProductType) => pt.name === selectedType);
        return typeInfo?.defaultUnit || 'Piece';
    }, [selectedType]);

    // Matrix Modal State - Removed per user request
    // const [isMatrixOpen, setIsMatrixOpen] = useState(false);
    // const [matrixBaseProduct, setMatrixBaseProduct] = useState<Product | null>(null);
    // const [matrixVariants, setMatrixVariants] = useState<Product[]>([]);

    // Refs
    const skuInputRef = useRef<HTMLInputElement>(null);
    const typeInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);
    const cartQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Filter Products Logic (Base)
    const baseFilteredProducts = useMemo(() => {
        return products.filter(p =>
            (currentBranch === 'All' || p.branchId === currentBranch)
        );
    }, [products, currentBranch]);

    // Type Suggestions with Relevance Ranking
    const typeSuggestions = useMemo(() => {
        if (!typeQuery) return [];
        const query = typeQuery.toLowerCase().trim();

        // Score each type by relevance
        const scored = allProductTypes
            .map(type => {
                const typeLower = type.toLowerCase();
                let score = 0;

                // Exact match = highest priority
                if (typeLower === query) {
                    score = 100;
                }
                // Starts with query = high priority
                else if (typeLower.startsWith(query)) {
                    score = 80 - (typeLower.length - query.length); // Shorter = better
                }
                // Word starts with query (e.g., "COTTON SAREE" matches "saree")
                else if (typeLower.split(' ').some(word => word.startsWith(query))) {
                    score = 60;
                }
                // Contains query = lower priority
                else if (typeLower.includes(query)) {
                    score = 40 - typeLower.indexOf(query); // Earlier position = better
                }

                return { type, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(item => item.type);

        return scored;
    }, [allProductTypes, typeQuery]);

    // Name Suggestions (Dependent on Selected Type)
    // Dependent Filter: Products matching selected Type
    const typeFilteredProducts = useMemo(() => {
        if (!selectedType) return [];
        return baseFilteredProducts.filter(p =>
            p.productType === selectedType || p.subCategory === selectedType || p.category === selectedType
        );
    }, [baseFilteredProducts, selectedType]);

    const fuzzyResults = useFuzzySearch(typeFilteredProducts, ['name', 'sellingPrice'], nameQuery);

    const nameSuggestions = useMemo(() => {
        if (!nameQuery) return [];
        return fuzzyResults.slice(0, 10);
    }, [fuzzyResults, nameQuery]);

    // Handlers
    const handleTypeKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedTypeIndex(prev => Math.min(prev + 1, typeSuggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedTypeIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedTypeIndex >= 0 && typeSuggestions[selectedTypeIndex]) {
                handleSelectType(typeSuggestions[selectedTypeIndex]);
            } else if (typeSuggestions.length === 1) {
                // Auto-select if exact match or only one option
                handleSelectType(typeSuggestions[0]);
            }
        }
    };

    const handleSelectType = (type: string) => {
        setSelectedType(type);
        setTypeQuery(type);
        setSelectedTypeIndex(-1);
        setQuickEntryPrice('');
        setQuickEntryQty('1');
        // Focus on price input for quick entry
        setTimeout(() => priceInputRef.current?.focus(), 50);
    };

    // Quick Entry Handler: Add item with manually entered price
    const handleQuickEntryAdd = () => {
        if (!selectedType || !quickEntryPrice) return;
        const price = parseFloat(quickEntryPrice);
        const qty = parseFloat(quickEntryQty) || 1;
        if (isNaN(price) || price <= 0) return;

        // Look up product type details for unit and GST
        const typeInfo = productTypes.find((pt: ProductType) => pt.name === selectedType);
        const defaultUnit = typeInfo?.defaultUnit || 'Piece';
        const gstRate = typeInfo?.gstRate ?? 5;

        // Create a transient cart item with UNIQUE SKU to prevent merging
        const uniqueId = Date.now().toString();
        const meterValue = defaultUnit === 'Meter' ? (parseFloat(quickEntryMeter) || 1) : undefined;
        const quickItem = {
            id: `QE-${uniqueId}`,
            sku: `QE-${uniqueId}`, // Unique SKU prevents cart merging
            name: selectedType,
            price: price,
            qty: qty,
            gstPercentage: gstRate,
            unit: defaultUnit,
            cutLength: meterValue, // For Meter-based products
            isQuickEntry: true, // Flag for reporting
            isParent: false, // Added for type safety
            // Fill required Product fields for type safety
            category: "Quick Entry",
            costPrice: 0,
            sellingPrice: price,
            stockQty: 999,
            tenantId: "" // Will be filled by backend/middleware if needed, or left empty for transient items
        } as unknown as CartItem;
        onAddToCart(quickItem);

        // Reset for next entry - CLEAR type to allow selecting different type
        setSelectedType('');
        setTypeQuery('');
        setQuickEntryPrice('');
        setQuickEntryQty('1');
        setQuickEntryMeter('1');
        setTimeout(() => typeInputRef.current?.focus(), 50);
    };

    // Fuzzy Search for Suggestions
    /* removed old useFuzzySearch call since it is now inside useMemo */

    // Removed manual useEffect for nameSuggestions since hook handles it

    // Handlers
    const handleSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value.trim();
            if (!val) return;

            // Search by SKU or Barcode
            const match = baseFilteredProducts.find(p => p.sku === val || p.barcode === val);

            if (match) {
                if (match.stockQty > 0) {
                    onAddToCart({ ...match, qty: 1, price: match.sellingPrice });
                    e.currentTarget.value = '';
                } else {
                    alert(`Product "${match.name}" is out of stock!`);
                    e.currentTarget.value = '';
                }
            } else {
                // Determine if we should clear on not found? 
                // Usually scanner just leaves it or selects it.
                // Let's select it so they can overwrite easily
                e.currentTarget.select();
                // Optional: alert("Product not found"); 
            }
        }
    };

    const handleSelectProduct = (product: Product) => {
        // Direct Add
        onAddToCart({ ...product, qty: 1, price: product.sellingPrice });
        // Reset Name only, keep Type for rapid entry of similar items
        setNameQuery('');
        // Focus back to Name input to allow typing next product immediately
        setTimeout(() => nameInputRef.current?.focus(), 50);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedNameIndex(prev => Math.min(prev + 1, nameSuggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedNameIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedNameIndex >= 0 && nameSuggestions[selectedNameIndex]) {
                handleSelectProduct(nameSuggestions[selectedNameIndex]);
            }
        }
    };

    // Camera Handlers - COMMENTED OUT
    /*
    const handleCameraCapture = async (file: File) => {
        setIsIdentifying(true);
        setIsCameraOpen(false);

        try {
            const sectorProducts = products.filter(p => p.sector === currentSector);
            const matchedIds = await searchProductsByImage(file, sectorProducts);

            if (matchedIds.length > 0) {
                if (matchedIds.length === 1) {
                    const product = products.find(p => p.id === matchedIds[0]);
                    if (product) dispatch(addToCart({ ...product, qty: 1, price: product.sellingPrice }));
                } else {
                    setVisualMatches(matchedIds);
                }
            } else {
                alert("No products identified.");
            }
        } catch (err) {
            logger.error(err as string | Error);
            alert("Failed to identify product.");
        } finally {
            setIsIdentifying(false);
        }
    };
    */

    const handleBarcodeScan = (code: string) => {
        const match = products.find(p => p.sku === code || p.barcode === code);
        if (match) {
            handleSelectProduct(match); // Reuse logic to trigger matrix if barcode matches a variant leader
        }
    };

    useEffect(() => {
        const handleFocusSearch = () => {
            // Ctrl+F now focuses Type Input
            typeInputRef.current?.focus();
            typeInputRef.current?.select();
        };

        const handleFocusQty = () => {
            // Find last item qty ref and focus
            const itemIds = cart.map(i => i.id);
            if (itemIds.length > 0) {
                const lastId = itemIds[0]; // unshifted list, so first is most recent
                cartQtyRefs.current[lastId]?.focus();
                cartQtyRefs.current[lastId]?.select();
            }
        };

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                // F2 Shortcut for global browser removed/repurposed? Keeping null for now.
                // onOpenCategoryBrowser(); 
            }
            if (e.key === 'Escape') {
                setTypeQuery('');
                setSelectedType('');
                setNameQuery('');
                skuInputRef.current?.focus();
            }
        };

        window.addEventListener('pos-focus-search', handleFocusSearch);
        window.addEventListener('pos-focus-qty', handleFocusQty);
        window.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            window.removeEventListener('pos-focus-search', handleFocusSearch);
            window.removeEventListener('pos-focus-qty', handleFocusQty);
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [cart]);

    return (
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-app rounded-[2.5rem] border border-default shadow-2xl min-h-0 transition-colors relative overflow-hidden">

            {/* Matrix Modal */}
            {/* Matrix Modal - Removed */}
            {/* 
            {matrixBaseProduct && (
                <POSVariantSelectionModal
                    isOpen={isMatrixOpen}
                    onClose={() => setIsMatrixOpen(false)}
                    baseProduct={matrixBaseProduct}
                    allVariants={matrixVariants}
                    onConfirm={(items) => {
                        items.forEach(({ product, qty }) => {
                            dispatch(addToCart({ ...product, qty }));
                        });
                    }}
                />
            )} 
            */}


            {/* Search Bar Section */}
            <div className="p-4 sm:p-6 border-b border-default bg-[var(--erp-bg-sunken)]/50 shrink-0 relative z-30 rounded-t-[2.5rem] space-y-4">
                {/* Row 1: Barcode Scanner */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase whitespace-nowrap hidden sm:block">Barcode:</label>
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute left-3 top-2.5 text-muted">
                            <Barcode className="w-4 h-4" />
                        </div>
                        <input
                            ref={skuInputRef}
                            type="text"
                            placeholder="Scan Barcode / SKU..."
                            className="w-full pl-10 pr-16 py-3 erp-card border-none text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-black text-sm uppercase tracking-tight rounded-2xl shadow-inner bg-white dark:bg-neutral-900"
                            onKeyDown={handleSkuKeyDown}
                            autoFocus
                        />
                        <kbd className="absolute right-2 top-2 text-[8px] bg-[var(--erp-bg-sunken)] px-1.5 py-0.5 rounded text-muted border border-default font-mono font-black uppercase tracking-tighter">Ctrl+B</kbd>
                    </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
                    <span className="font-medium">OR Quick Entry</span>
                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
                </div>

                {/* Row 2: Quick Entry - Always Visible */}
                <div className="flex flex-wrap gap-2 items-end">
                    {/* Type Select */}
                    <div className="relative flex-1 min-w-[180px]">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1 block">Product Type</label>
                        <div className="relative">
                            <div className="absolute left-3 top-2.5 text-neutral-400 dark:text-neutral-500">
                                <Folder className="w-4 h-4" />
                            </div>
                            <input
                                ref={typeInputRef}
                                type="text"
                                placeholder="Search type..."
                                className={`w-full pl-9 pr-3 py-2 premium-card border-none text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/50 transition-all font-black text-sm uppercase tracking-tight ${selectedType ? 'bg-indigo-600/10 text-indigo-400' : ''}`}
                                value={typeQuery}
                                onChange={e => {
                                    setTypeQuery(e.target.value);
                                    if (selectedType && e.target.value !== selectedType) {
                                        setSelectedType('');
                                    }
                                }}
                                onKeyDown={handleTypeKeyDown}
                                autoComplete="off"
                            />
                            {/* Type Suggestions Dropdown */}
                            {typeQuery && !selectedType && typeSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 erp-card shadow-2xl z-50 max-h-60 overflow-y-auto border-default">
                                    {typeSuggestions.map((type, idx) => (
                                        <button
                                            key={type}
                                            onClick={() => handleSelectType(type)}
                                            className={`w-full text-left px-3 py-2 text-[10px] uppercase font-black tracking-widest hover:bg-[var(--erp-bg-sunken)] transition-colors ${idx === selectedTypeIndex ? 'bg-indigo-600/20 text-indigo-400' : 'text-muted'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Price Input */}
                    <div className="w-24">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1 block">Price (₹)</label>
                        <input
                            ref={priceInputRef}
                            type="number"
                            placeholder="0.00"
                            className="w-full px-3 py-2 erp-card border-none text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/50 transition-all font-black text-sm text-right"
                            value={quickEntryPrice}
                            onChange={e => setQuickEntryPrice(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleQuickEntryAdd();
                                }
                            }}
                            min="0"
                            step="0.01"
                            disabled={!selectedType}
                        />
                    </div>

                    {/* Meter Input (only for Meter-based products) */}
                    {selectedTypeUnit === 'Meter' && (
                        <div className="w-20">
                            <label className="text-[10px] font-bold text-primary uppercase mb-1 block">Meter</label>
                            <input
                                type="number"
                                placeholder="1.0"
                                className="w-full px-2 py-2 erp-card bg-indigo-600/10 border-indigo-500/30 text-indigo-400 focus:ring-1 focus:ring-indigo-500/50 transition-all font-black text-sm text-center"
                                value={quickEntryMeter}
                                onChange={e => setQuickEntryMeter(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleQuickEntryAdd();
                                    }
                                }}
                                min="0.1"
                                step="0.1"
                                disabled={!selectedType}
                            />
                        </div>
                    )}

                    {/* Qty Input */}
                    <div className="w-16">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1 block">Qty</label>
                        <input
                            type="number"
                            placeholder="1"
                            className="w-full px-2 py-2 erp-card border-none text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/50 transition-all font-black text-sm text-center"
                            value={quickEntryQty}
                            onChange={e => setQuickEntryQty(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleQuickEntryAdd();
                                }
                            }}
                            min="1"
                            disabled={!selectedType}
                        />
                    </div>

                    {/* Add to Cart Button */}
                    <div>
                        <label className="text-[10px] font-bold text-transparent uppercase mb-1 block">Action</label>
                        <button
                            onClick={handleQuickEntryAdd}
                            disabled={!selectedType || !quickEntryPrice || parseFloat(quickEntryPrice) <= 0}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 transition-all whitespace-nowrap"
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* Clear Button */}
                    {selectedType && (
                        <div>
                            <label className="text-[10px] font-bold text-transparent uppercase mb-1 block">Clear</label>
                            <button
                                onClick={() => {
                                    setSelectedType('');
                                    setTypeQuery('');
                                    setQuickEntryPrice('');
                                    setQuickEntryQty('1');
                                }}
                                className="px-3 py-2 text-neutral-500 hover:text-error hover:bg-error/10 border border-neutral-300 dark:border-default rounded-lg text-sm font-bold"
                                title="Clear selection"
                            >
                                ✕ Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Visual Search Banner */}
            {/* Visual Search Banner - COMMENTED OUT
            {visualMatches && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 flex justify-between items-center border-b border-indigo-100 dark:border-indigo-500/20">
                    <span className="text-indigo-700 dark:text-indigo-300 text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Visual Search: Found {visualMatches.length} matches
                    </span>
                    <button
                        onClick={() => setVisualMatches(null)}
                        className="p-1 hover:bg-indigo-200 rounded-full text-indigo-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            */}

            {/* Cart Content */}
            <div className="flex-1 overflow-auto bg-transparent relative transition-colors rounded-b-xl">
                {cart.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 opacity-60">
                        <ShoppingCart className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">Cart is empty</p>
                        <p className="text-sm">Scan items or search to begin</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full text-left text-sm text-muted">
                            <thead className="bg-[var(--erp-bg-sunken)] text-[9px] uppercase font-black tracking-widest text-muted sticky top-0 z-10">
                                <tr>
                                    <th className="py-2 px-2 w-12 text-center hidden md:table-cell">#</th>
                                    <th className="py-3 px-2">Item Details</th>
                                    <th className="py-3 px-2 w-32 text-center hidden sm:table-cell">Unit Price</th>
                                    <th className="py-3 px-2 w-28 text-center text-indigo-400">Meters</th>
                                    <th className="py-2 px-2 w-28 text-center">Quantity</th>
                                    <th className="py-2 px-2 w-32 text-right">Total</th>
                                    <th className="py-2 px-2 w-16 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700/50">
                                {cart.map((item, idx) => (
                                    <CartItemRow
                                        key={item.id}
                                        item={item}
                                        idx={idx}
                                        onUpdateCartQty={onUpdateCartQty}
                                        onUpdateCartLength={onUpdateCartLength}
                                        onRemoveFromCart={onRemoveFromCart}
                                        skuInputRef={skuInputRef}
                                        cartQtyRefs={cartQtyRefs}
                                    />
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col gap-2 p-2 pb-20">
                            {cart.map((item) => (
                                <CartItemCard
                                    key={item.id}
                                    item={item}
                                    idx={-1}
                                    onUpdateCartQty={onUpdateCartQty}
                                    onUpdateCartLength={onUpdateCartLength}
                                    onRemoveFromCart={onRemoveFromCart}
                                    skuInputRef={skuInputRef}
                                    cartQtyRefs={cartQtyRefs}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

