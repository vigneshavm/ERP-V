
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Product } from "../../types/product";
import { CartItem } from "../../types/sales";
import { Sector } from "../../types/common";
import { ReturnBillPicker } from './ReturnBillPicker';
import { Barcode, ShoppingCart, Trash2, Folder } from 'lucide-react';
// import { CameraScanner } from '../CameraScanner';
// import { searchProductsByImage } from "../../../services/GeminiService";

interface POSCartGridProps {
    cart: CartItem[];
    products: Product[];
    currentSector: Sector;
    currentBranch: string;
    isProcessing: boolean;
    onAddToCart: (item: CartItem) => void;
    /** Looks a barcode up on the server when it isn't among the loaded `products` (adds it or reports not found). */
    onBarcodeLookup: (barcode: string) => void | Promise<void>;
    onRemoveFromCart: (id: string) => void;
    onUpdateCartQty: (id: string, qty: number) => void;
    onUpdateCartLength: (id: string, length: number) => void;
    onSetCartLineDiscount: (id: string, discountPercent: number) => void;
    maxProductDiscountPercent?: number;
    onOpenCategoryBrowser: () => void;
    allProductTypes: string[];
    // Name -> {gstRate, defaultUnit} lookup for the sector's Product Type
    // catalog, sourced from usePOSLogic (GET /api/product-categories) instead
    // of this component's previous direct import of a static, hardcoded list.
    productTypeDetails: Record<string, { gstRate?: number; defaultUnit?: string }>;
    quickProducts?: { code?: string; name: string; unit?: string; price?: number; gstRate?: number }[];
}

import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import { Button } from '@/components/shared/Button';
import api from '../../services/api';
import { Input } from '@/components/shared/Input';
import { usePosBillEdit } from './posBillEditStore';
// import { POSVariantSelectionModal } from './POSVariantSelectionModal';
// import { POSVariantSelectionModal } from './POSVariantSelectionModal';

interface CartItemRowProps {
    item: CartItem;
    idx: number;
    onUpdateCartQty: (id: string, qty: number) => void;
    onUpdateCartLength: (id: string, length: number) => void;
    onSetCartLineDiscount: (id: string, discountPercent: number) => void;
    maxProductDiscountPercent?: number;
    onRemoveFromCart: (id: string) => void;
    skuInputRef: React.RefObject<HTMLInputElement | null>;
    /** Records the row's quantity (or meter) input so the grid can focus it; owned by POSCartGrid. */
    registerQtyInput: (id: string, el: HTMLInputElement | null) => void;
}

const CartItemRow = React.memo<CartItemRowProps>(({
    item,
    idx,
    onUpdateCartQty,
    onUpdateCartLength,
    onSetCartLineDiscount,
    maxProductDiscountPercent,
    onRemoveFromCart,
    skuInputRef,
    registerQtyInput
}) => {
    const _qtyInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <tr className="hover:bg-slate-200/50 dark:hover:bg-slate-700/30 transition-colors bg-white dark:bg-slate-800">
            <td className="py-1.5 px-2 text-center text-slate-400 font-mono hidden md:table-cell text-xs">{idx + 1}</td>
            <td className="py-1.5 px-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">{(item as any).barcode || (item as any).isQuickEntry ? ((item as any).barcode || '—') : (item.sku || '—')}</td>
            <td className="py-1.5 px-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">{(item as any).productCode || '—'}</td>
            <td className="py-1.5 px-2">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {item.name}
                    {item.qty < 0 && <span className="ml-2 text-[10px] uppercase font-black text-white bg-danger px-1 rounded-sm">RETURN</span>}
                </p>
                {item.qty < 0 && <ReturnBillPicker item={item} />}
                <p className="text-[10px] text-slate-500 font-mono">
                    {item.unit === 'Meter' && <span className="bg-slate-100 dark:bg-slate-700 px-1 rounded ml-1 text-slate-900 dark:text-slate-100">Per Meter</span>}
                </p>
                {item.qty > 0 && <label className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500">Discount %
                    <input aria-label={`Product discount for ${item.name}`} type="number" min="0" max={maxProductDiscountPercent ?? 99.99} step="0.01" value={item.discountPercent || ''}
                        onChange={(e) => onSetCartLineDiscount(item.id, Number(e.target.value) || 0)} className="w-16 rounded border px-1 py-0.5 text-right text-xs" />
                </label>}
                {(item.size || item.color) && (
                    <div className="flex gap-2 mt-0.5">
                        {item.size && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">Size: {item.size}</span>}
                        {item.color && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">Col: {item.color}</span>}
                    </div>
                )}
            </td>
            <td className="text-right tabular-nums py-1.5 px-2  font-mono text-slate-600 hidden sm:table-cell text-xs">
                ₹{item.price.toFixed(2)}
            </td>

            {/* Meter Column */}
            <td className="py-1.5 px-2 text-center">
                {item.unit === 'Meter' ? (
                    <div className="flex items-center justify-center gap-1 bg-primary/5 dark:bg-primary/20 rounded-lg p-0.5 border border-primary/20 w-fit mx-auto">
                        <input
                            ref={(el) => registerQtyInput(item.id, el)}
                            type="number"
                            value={item.cutLength ?? ''}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                // Clearing/zeroing the editor must not keep an old billable cut.
                                onUpdateCartLength(item.id, Number.isFinite(val) ? val : 0);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') skuInputRef.current?.focus();
                            }}
                            className="w-14 text-center bg-transparent border-none font-bold text-primary focus:ring-0 rounded h-6 text-xs spin-hide"
                            placeholder="1.00"
                            step="0.01"
                        />
                        <span className="text-[10px] font-bold text-primary/60 mr-1">m</span>
                    </div>
                ) : (
                    <span className="text-slate-300 text-xs">-</span>
                )}
            </td>

            {/* Quantity Column */}
            <td className="py-1.5 px-2 text-center">
                <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-0.5 border border-slate-200 w-fit mx-auto">
                    <button
                        onClick={() => onUpdateCartQty(item.id, item.qty - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded text-slate-600 text-xs"
                        tabIndex={-1}
                    >-</button>
                    <input
                        ref={(el) => { if (item.unit !== 'Meter') registerQtyInput(item.id, el); }}
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
                        className="w-10 text-center bg-transparent border-none font-bold focus:ring-2 focus:ring-primary rounded h-6 text-xs spin-hide"
                    />
                    <button
                        onClick={() => onUpdateCartQty(item.id, item.qty + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded text-slate-600 text-xs"
                        tabIndex={-1}
                    >+</button>
                </div>
            </td>
            <td className={`py-1.5 px-2 text-right font-bold font-mono text-xs ${(item.price * (item.unit === 'Meter' ? (item.cutLength ?? 0) * item.qty : item.qty)) < 0
                ? 'text-danger'
                : 'text-success'
                }`}>
                ₹{(item.price * (item.unit === 'Meter' ? (item.cutLength ?? 0) * item.qty : item.qty)).toFixed(2)}
            </td>
            <td className="py-1.5 px-2 text-center">
                <button
                    onClick={() => onRemoveFromCart(item.id)}
                    className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg"
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
    onSetCartLineDiscount,
    maxProductDiscountPercent,
    onRemoveFromCart
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                        {item.name}
                        {item.qty < 0 && <span className="ml-2 text-[10px] uppercase font-black text-white bg-danger px-1 rounded-sm">RET</span>}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                    {item.qty > 0 && <label className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500">Discount %
                        <input aria-label={`Product discount for ${item.name}`} type="number" min="0" max={maxProductDiscountPercent ?? 99.99} step="0.01" value={item.discountPercent || ''}
                            onChange={(e) => onSetCartLineDiscount(item.id, Number(e.target.value) || 0)} className="w-16 rounded border px-1 py-0.5 text-right text-xs" />
                    </label>}
                    {(item.size || item.color) && (
                        <div className="flex gap-2 mt-1">
                            {item.size && <span className="text-[10px] bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">Sz: {item.size}</span>}
                            {item.color && <span className="text-[10px] bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">Col: {item.color}</span>}
                        </div>
                    )}
                </div>
                <p className={`font-bold font-mono ${item.qty < 0 ? 'text-danger' : 'text-success'}`}>
                    ₹{(item.price * item.qty).toFixed(2)}
                </p>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm">
                        <Button onClick={() => onUpdateCartQty(item.id, Math.max(0, item.qty - 1))} className="w-8 h-8 flex items-center justify-center text-slate-500 active:bg-slate-100 rounded-md">-</Button>
                        <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                        <Button onClick={() => onUpdateCartQty(item.id, item.qty + 1)} className="w-8 h-8 flex items-center justify-center text-primary active:bg-primary/5 rounded-md">+</Button>
                    </div>
                    <p className="text-xs text-slate-400">@ ₹{item.price}</p>
                </div>

                <Button onClick={() => onRemoveFromCart(item.id)} className="p-2 text-error bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"><Trash2 className="w-4 h-4" /></Button>
            </div>
        </div>
    );
});

CartItemCard.displayName = 'CartItemCard';

// ... (props interface unchanged)

export const POSCartGrid: React.FC<POSCartGridProps> = ({
    cart,
    products,
    currentSector: __currentSector,
    currentBranch,
    isProcessing: __isProcessing,
    onAddToCart,
    onBarcodeLookup,
    onRemoveFromCart,
    onUpdateCartQty,
    onUpdateCartLength,
    onSetCartLineDiscount,
    maxProductDiscountPercent,
    onOpenCategoryBrowser: __onOpenCategoryBrowser,
    allProductTypes,
    productTypeDetails,
    quickProducts = []
}) => {
    // Local State
    const billEdit = usePosBillEdit();
    const [typeQuery, setTypeQuery] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedTypeIndex, setSelectedTypeIndex] = useState(-1);
    const [productCode, setProductCode] = useState('');
    const [codeNotFound, setCodeNotFound] = useState(false);

    const [nameQuery, setNameQuery] = useState('');
    const [selectedNameIndex, setSelectedNameIndex] = useState(-1);

    // Quick Entry State (for items without barcode)
    const [quickEntryPrice, setQuickEntryPrice] = useState('');
    const [quickEntryQty, setQuickEntryQty] = useState('1');
    const [quickEntryMeter, setQuickEntryMeter] = useState('1');
    // Stock items found for the typed product + price, offered so the line goes out with a real barcode.
    const [stockMatch, setStockMatch] = useState<{ items: any[]; error?: boolean } | null>(null);
    const [matchBusy, setMatchBusy] = useState(false);

    // Compute the selected type's unit
    const selectedTypeUnit = useMemo(() => {
        if (!selectedType) return 'Piece';
        const typeInfo = productTypeDetails[selectedType];
        return typeInfo?.defaultUnit || 'Piece';
    }, [selectedType, productTypeDetails]);

    // Refs
    const skuInputRef = useRef<HTMLInputElement>(null);
    const typeInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const cartQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    // Stable, so memoized CartItemRows don't re-render when the grid does.
    const registerQtyInput = useCallback((id: string, el: HTMLInputElement | null) => {
        cartQtyRefs.current[id] = el;
    }, []);

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

    // Product Code -> fills the product name (and price when the product has one)
    const handleCodeLookup = () => {
        const c = productCode.trim().toLowerCase();
        if (!c) return;
        const hit = quickProducts.find(p => p.code && p.code.toLowerCase() === c);
        if (!hit) { setCodeNotFound(true); return; }
        setCodeNotFound(false);
        handleSelectType(hit.name);
        if (hit.price) setTimeout(() => setQuickEntryPrice(String(hit.price)), 60);
    };

    // Quick Entry Handler: before a barcode-less line is added, look the typed product up in stock and offer the
    // matching barcodes (price matches first). Billing a stock item by barcode is what keeps inventory correct.
    const handleQuickEntryAdd = async () => {
        if (!selectedType || !quickEntryPrice || matchBusy) return;
        const price = parseFloat(quickEntryPrice);
        if (isNaN(price) || price <= 0) return;
        setMatchBusy(true);
        try {
            const res = await api.get('/api/inventory', { params: { search: selectedType, limit: 100 } });
            const list: any[] = Array.isArray(res?.data?.items) ? res.data.items : [];
            const priceOf = (it: any) => Number(it.sellingPrice ?? it.price ?? 0) || 0;
            const withCode = list.filter(it => String(it.barcode || '').trim());
            if (withCode.length === 0) {
                addQuickLine();
                return;
            }
            // Only stock items at exactly this price are offered.
            const exact = withCode.filter(it => Math.abs(priceOf(it) - price) < 0.01);
            // Exactly one in-stock match: bill it straight away. Several: wait for the cashier to pick.
            if (exact.length === 1 && (Number(exact[0].stockQty ?? 0) || 0) > 0) {
                await handlePickStockMatch(exact[0]);
                return;
            }
            setStockMatch({ items: exact.slice(0, 30) });
        } catch {
            // Search unavailable: show the warning panel instead of silently billing without a barcode.
            setStockMatch({ items: [], error: true });
        } finally {
            setMatchBusy(false);
        }
    };

    const resetQuickEntry = () => {
        setStockMatch(null);
        setSelectedType('');
        setTypeQuery('');
        setProductCode('');
        setCodeNotFound(false);
        setQuickEntryPrice('');
        setQuickEntryQty('1');
        setQuickEntryMeter('1');
        setTimeout(() => skuInputRef.current?.focus(), 50); // back to the barcode box for the next item
    };

    // Picks a stock item: it is billed by its own barcode and price, so stock reduces for it.
    const handlePickStockMatch = async (item: any) => {
        const times = Number.isInteger(parseFloat(quickEntryQty)) ? Math.min(50, Math.max(1, parseFloat(quickEntryQty))) : 1;
        resetQuickEntry();
        for (let i = 0; i < times; i++) await onBarcodeLookup(String(item.barcode));
    };

    // Adds the typed product + price as a plain line (no barcode, stock is not reduced).
    const addQuickLine = () => {
        if (!selectedType || !quickEntryPrice) return;
        const price = parseFloat(quickEntryPrice);
        const qty = parseFloat(quickEntryQty) || 1;
        if (isNaN(price) || price <= 0) return;

        // Look up product type details for unit and GST
        const typeInfo = productTypeDetails[selectedType];
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
            productCode: productCode.trim() || undefined,
            // Fill required Product fields for type safety
            category: "Quick Entry",
            costPrice: 0,
            sellingPrice: price,
            stockQty: 999,
            tenantId: "" // Will be filled by backend/middleware if needed, or left empty for transient items
        } as CartItem;
        onAddToCart(quickItem);

        // Reset for next entry - CLEAR type to allow selecting different type
        setSelectedType('');
        setTypeQuery('');
        setProductCode('');
        setCodeNotFound(false);
        setQuickEntryPrice('');
        setQuickEntryQty('1');
        setQuickEntryMeter('1');
        setStockMatch(null);
        setTimeout(() => skuInputRef.current?.focus(), 50); // back to the barcode box for the next item
    };

    // Fuzzy Search for Suggestions
    /* removed old useFuzzySearch call since it is now inside useMemo */

    // Removed manual useEffect for nameSuggestions since hook handles it

    // Handlers
    const handleSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            // A fast scanner scan was already handled by the global scanner hook.
            if (e.defaultPrevented) {
                e.currentTarget.value = '';
                return;
            }
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
                // Not in the products loaded in the browser: look it up on the server (shop DB / ERP items).
                e.currentTarget.value = '';
                void onBarcodeLookup(val);
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

    const _handleNameKeyDown = (e: React.KeyboardEvent) => {
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
            console.error(err);
            alert("Failed to identify product.");
        } finally {
            setIsIdentifying(false);
        }
    };
    */

    const _handleBarcodeScan = (code: string) => {
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
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl min-h-0 transition-colors relative">

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
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0 relative z-30 rounded-t-xl space-y-3">
                {/* Header: entry-row hint + selected bill chip */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Billing</span>
                    <span className="hidden sm:inline text-[11px] text-slate-400">{billEdit.active ? 'Add items in the bill grid below' : 'Scan or type in the entry row — Enter adds the line'}</span>
                    {billEdit.selectedBill && (
                        <div className="ml-auto flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Selected Bill</span>
                            <span className="text-sm font-bold text-primary">{billEdit.selectedBill}</span>
                            {billEdit.active && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">Editing</span>}
                        </div>
                    )}
                </div>

                {/* Row 2: Quick Entry - Always Visible */}
                <div className={`flex-wrap md:flex-nowrap items-end ${billEdit.active ? 'hidden' : 'flex'}`}>
                    <div className="hidden md:block w-10 shrink-0" />
                    {/* Barcode */}
                    <div className="w-full md:w-[190px] shrink-0 px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Barcode</label>
                        <div className="relative">
                            <div className="absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500">
                                <Barcode className="w-4 h-4" />
                            </div>
                            <input
                                ref={skuInputRef}
                                type="text"
                                placeholder="Scan Barcode / SKU"
                                title="Ctrl+B to focus"
                                className="w-full pl-8 pr-2 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors shadow-sm"
                                onKeyDown={handleSkuKeyDown}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Product Code */}
                    <div className="w-1/2 md:w-[130px] shrink-0 px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Product Code</label>
                        <input
                            ref={codeInputRef}
                            type="text"
                            placeholder="Code..."
                            className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${codeNotFound ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
                            value={productCode}
                            onChange={e => { setProductCode(e.target.value); setCodeNotFound(false); }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCodeLookup(); } }}
                            onBlur={handleCodeLookup}
                            autoComplete="off"
                            title={codeNotFound ? 'No product with this code' : undefined}
                        />
                    </div>

                    {/* Type Select */}
                    <div className="relative flex-1 min-w-[180px] px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Product / Type</label>
                        <div className="relative">
                            <div className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                                <Folder className="w-4 h-4" />
                            </div>
                            <input
                                ref={typeInputRef}
                                type="text"
                                placeholder="Search type..."
                                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${selectedType ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'}`}
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
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {typeSuggestions.map((type, idx) => (
                                        <button
                                            key={type}
                                            onClick={() => handleSelectType(type)}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${idx === selectedTypeIndex ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-slate-200'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Price Input */}
                    <div className="w-1/3 md:w-[110px] shrink-0 px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Price (₹)</label>
                        <input
                            ref={priceInputRef}
                            type="number"
                            placeholder="0.00"
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-right font-bold"
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
                    {selectedTypeUnit !== 'Meter' && <div className="hidden md:block w-[90px] shrink-0" />}
                    {selectedTypeUnit === 'Meter' && (
                        <div className="w-20 md:w-[90px] shrink-0 px-1">
                            <label className="text-[10px] font-bold text-primary uppercase mb-1 block">Meter</label>
                            <input
                                type="number"
                                placeholder="1.0"
                                className="w-full px-2 py-2 text-sm bg-primary/5 dark:bg-primary/10 border-2 border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold text-primary"
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
                    <div className="w-1/4 md:w-[110px] shrink-0 px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Qty</label>
                        <input
                            type="number"
                            placeholder="1"
                            className="w-full px-2 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold"
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
                    <div className="md:w-[180px] shrink-0 px-1">
                        <label className="text-[10px] font-bold text-transparent uppercase mb-1 block">Action</label>
                        <Button onClick={handleQuickEntryAdd} disabled={matchBusy || !selectedType || !quickEntryPrice || parseFloat(quickEntryPrice) <= 0} className="w-full md:w-auto px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md whitespace-nowrap">+ Add</Button>
                    </div>

                    {/* Clear Button */}
                    {selectedType && (
                        <div className="px-1">
                            <label className="text-[10px] font-bold text-transparent uppercase mb-1 block">Clear</label>
                            <button
                                onClick={() => {
                                    setStockMatch(null);
                                    setSelectedType('');
                                    setTypeQuery('');
                                    setQuickEntryPrice('');
                                    setQuickEntryQty('1');
                                }}
                                className="px-3 py-2 text-slate-500 hover:text-error hover:bg-error/10 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold"
                                title="Clear selection"
                            >
                                ✕ Clear
                            </button>
                        </div>
                    )}
                </div>

                {stockMatch && (
                    <div className="mt-2 rounded-lg border border-warning/40 bg-warning/5 p-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {stockMatch.error
                                    ? "Couldn't check stock for this product."
                                    : stockMatch.items.length === 0
                                        ? `No stock item of "${selectedType}" at ₹${quickEntryPrice}. Check the price, or add it without a barcode.`
                                        : `Pick the stock item for "${selectedType}" at ₹${quickEntryPrice} so it bills with its barcode and stock reduces.`}
                            </p>
                            <button type="button" onClick={() => setStockMatch(null)} className="text-xs text-slate-500 hover:text-main">✕ Close</button>
                        </div>
                        {stockMatch.items.length > 0 && (
                            <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 sticky top-0">
                                        <tr>
                                            <th className="text-left px-2 py-1">Barcode</th>
                                            <th className="text-left px-2 py-1">Item</th>
                                            <th className="text-left px-2 py-1">Size / Colour</th>
                                            <th className="text-right px-2 py-1">Price</th>
                                            <th className="text-right px-2 py-1">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {stockMatch.items.map((it, i) => {
                                            const itemPrice = Number(it.sellingPrice ?? it.price ?? 0) || 0;
                                            const stock = Number(it.stockQty ?? 0) || 0;
                                            const samePrice = Math.abs(itemPrice - parseFloat(quickEntryPrice)) < 0.5;
                                            return (
                                                <tr
                                                    key={`${it.barcode}-${i}`}
                                                    onClick={() => stock > 0 && handlePickStockMatch(it)}
                                                    className={`${stock > 0 ? 'cursor-pointer hover:bg-primary/5' : 'opacity-50 cursor-not-allowed'} ${samePrice ? 'bg-success/5' : ''}`}
                                                    title={stock > 0 ? 'Bill this item' : 'Out of stock'}
                                                >
                                                    <td className="px-2 py-1 font-mono">{it.barcode}</td>
                                                    <td className="px-2 py-1">{it.name}</td>
                                                    <td className="px-2 py-1 text-slate-500">{[it.size, it.color].filter(Boolean).join(' / ') || '—'}</td>
                                                    <td className="px-2 py-1 text-right font-bold">₹{itemPrice.toFixed(2)}{samePrice ? ' ✓' : ''}</td>
                                                    <td className={`px-2 py-1 text-right ${stock > 0 ? '' : 'text-danger font-bold'}`}>{stock > 0 ? stock : 'Out'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-slate-500">
                                The stock item's own price is billed. Billing without a barcode does not reduce stock.
                            </p>
                            <button
                                type="button"
                                onClick={addQuickLine}
                                className="px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
                            >
                                Add without barcode (₹{quickEntryPrice})
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* The bill opened from the "Today's bill no." search appears here, under the quick-entry row (see POSBillReprint). */}
            <div id="pos-bill-edit-slot" className={billEdit.active ? 'flex-1 min-h-0 overflow-hidden bg-card' : 'shrink-0 empty:hidden'} />

            {/* Visual Search Banner */}
            {/* Visual Search Banner - COMMENTED OUT
            {visualMatches && (
                <div className="bg-primary-soft dark:bg-primary-soft px-4 py-2 flex justify-between items-center border-b border-primary/30 dark:border-primary/20">
                    <span className="text-primary dark:text-primary text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Visual Search: Found {visualMatches.length} matches
                    </span>
                    <Button onClick={() => setVisualMatches(null)} className="p-1 hover:bg-primary-soft rounded-full text-primary"><X className="w-4 h-4" /></Button>
                </div>
            )}
            */}

            {/* Cart Content (while a bill is being edited, its one-grid view above replaces this) */}
            {!billEdit.active && <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800 relative transition-colors rounded-b-xl">
                {cart.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-60">
                        <ShoppingCart className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">Cart is empty</p>
                        <p className="text-sm">Scan items or search to begin</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full table-fixed text-left text-sm text-slate-700 dark:text-slate-300">
                            <colgroup><col style={{ width: 40 }} /><col style={{ width: 190 }} /><col style={{ width: 130 }} /><col /><col style={{ width: 110 }} /><col style={{ width: 90 }} /><col style={{ width: 110 }} /><col style={{ width: 110 }} /><col style={{ width: 70 }} /></colgroup>
                            <thead className="bg-slate-100 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="py-2 px-2 text-center hidden md:table-cell">#</th>
                                    <th className="py-2 px-2">Barcode</th>
                                    <th className="py-2 px-2">Product code</th>
                                    <th className="py-2 px-2">Product / Type</th>
                                    <th className="py-2 px-2 text-right hidden sm:table-cell">Price</th>
                                    <th className="py-2 px-2 text-center text-primary">Meters</th>
                                    <th className="py-2 px-2 text-center">Qty</th>
                                    <th className="py-2 px-2 text-right">Total</th>
                                    <th className="py-2 px-2 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                                {cart.map((item, idx) => (
                                    <CartItemRow
                                        key={item.id}
                                        item={item}
                                        idx={idx}
                                        onUpdateCartQty={onUpdateCartQty}
                                        onUpdateCartLength={onUpdateCartLength}
                                        onSetCartLineDiscount={onSetCartLineDiscount}
                                        maxProductDiscountPercent={maxProductDiscountPercent}
                                        onRemoveFromCart={onRemoveFromCart}
                                        skuInputRef={skuInputRef}
                                        registerQtyInput={registerQtyInput}
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
                                    onSetCartLineDiscount={onSetCartLineDiscount}
                                    maxProductDiscountPercent={maxProductDiscountPercent}
                                    onRemoveFromCart={onRemoveFromCart}
                                    skuInputRef={skuInputRef}
                                    registerQtyInput={registerQtyInput}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>}
        </div>
    );
};
