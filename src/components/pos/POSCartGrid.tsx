
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppDispatch, addToCart, removeFromCart, updateCartQty, updateCartLength } from '../../store';
import { Product } from '../../types/product';
import { CartItem } from '../../types/sales';
import { Sector } from '../../types/common';
import { Barcode, Search, ShoppingCart, Trash2 } from 'lucide-react'; // Camera, X removed
// import { CameraScanner } from '../CameraScanner';
// import { searchProductsByImage } from '../../services/geminiService';

interface POSCartGridProps {
    cart: CartItem[];
    products: Product[];
    currentSector: Sector;
    currentBranch: string;
    dispatch: AppDispatch;
    isProcessing: boolean;
}

import { useFuzzySearch } from '../../hooks/useFuzzySearch';
// import { POSVariantSelectionModal } from './POSVariantSelectionModal';

// ... (props interface unchanged)

export const POSCartGrid: React.FC<POSCartGridProps> = ({
    cart,
    products,
    currentSector,
    currentBranch,
    dispatch,
    isProcessing
}) => {
    // Local State
    const [nameQuery, setNameQuery] = useState('');
    // const [nameSuggestions, setNameSuggestions] = useState<Product[]>([]); // Removed manual state
    const [selectedNameIndex, setSelectedNameIndex] = useState(-1);

    // Matrix Modal State - Removed per user request
    // const [isMatrixOpen, setIsMatrixOpen] = useState(false);
    // const [matrixBaseProduct, setMatrixBaseProduct] = useState<Product | null>(null);
    // const [matrixVariants, setMatrixVariants] = useState<Product[]>([]);

    // Refs
    const skuInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const cartQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Filter Products Logic (Base)
    const baseFilteredProducts = useMemo(() => {
        return products.filter(p =>
            (currentBranch === 'All' || p.branchId === currentBranch)
        );
    }, [products, currentBranch]);

    // Fuzzy Search for Suggestions
    const nameSuggestions = useFuzzySearch<Product>(baseFilteredProducts, ['name'], nameQuery).slice(0, 5);

    // Removed manual useEffect for nameSuggestions since hook handles it

    // Handlers
    const handleSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value.trim();
            if (!val) return;

            // Search by SKU or Barcode
            const match = baseFilteredProducts.find(p => p.sku === val || p.barcode === val);

            if (match) {
                if (match.stock > 0) {
                    dispatch(addToCart({ ...match, qty: 1 }));
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
        // Direct Add (Reverted Matrix Logic)
        dispatch(addToCart({ ...product, qty: 1 }));
        setNameQuery('');
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
                    if (product) dispatch(addToCart({ ...product, qty: 1 }));
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

    const handleBarcodeScan = (code: string) => {
        const match = products.find(p => p.sku === code || p.barcode === code);
        if (match) {
            handleSelectProduct(match); // Reuse logic to trigger matrix if barcode matches a variant leader
        }
    };

    useEffect(() => {
        const handleFocusSearch = () => {
            skuInputRef.current?.focus();
            skuInputRef.current?.select();
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

        window.addEventListener('pos-focus-search', handleFocusSearch);
        window.addEventListener('pos-focus-qty', handleFocusQty);

        // Internal override for Esc still useful for local state
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                skuInputRef.current?.focus();
                if (skuInputRef.current) skuInputRef.current.value = '';
                setNameQuery('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('pos-focus-search', handleFocusSearch);
            window.removeEventListener('pos-focus-qty', handleFocusQty);
            window.removeEventListener('keydown', handleKeyDown);
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



            {/* Search Bar Row */}
            <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-2 shrink-0 relative z-30 rounded-t-xl">
                {/* SKU Input */}
                <div className="relative group flex-1">
                    <div className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                        <Barcode className="w-4 h-4" />
                    </div>
                    <input
                        ref={skuInputRef}
                        type="text"
                        placeholder="Scan SKU (Ctrl+B)"
                        className="w-full pl-9 pr-14 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm"
                        onKeyDown={handleSkuKeyDown}
                        autoFocus
                    />
                    <kbd className="absolute right-2 top-2.5 text-[9px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 font-mono">Ctrl+B</kbd>
                </div>

                {/* Camera Trigger */}
                {/* Camera Trigger - COMMENTED OUT
                <button
                    onClick={() => setIsCameraOpen(true)}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-500 transition-colors rounded-lg shadow-sm shrink-0"
                    title="Scan Product via Camera"
                >
                    <Camera className="w-4 h-4" />
                </button>
                */}

                {/* Name Input */}
                <div className="relative group flex-[1.5]">
                    <div className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="Search Name (Ctrl+F)..."
                        className="w-full pl-9 pr-14 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm"
                        value={nameQuery}
                        onChange={e => setNameQuery(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        autoComplete="off"
                    />
                    <kbd className="absolute right-2 top-2.5 text-[9px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 font-mono">Ctrl+F</kbd>

                    {/* Suggestions */}
                    {nameQuery.length > 1 && nameSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto ring-1 ring-black/5">
                            {nameSuggestions.map((prod, idx) => (
                                <button
                                    key={prod.id}
                                    onClick={() => handleSelectProduct(prod)}
                                    className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center group transition-colors ${idx === selectedNameIndex ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    <div className="min-w-0">
                                        <p className="font-bold text-xs truncate">{prod.name}</p>
                                        <span className="text-[9px] text-slate-500">{prod.sku}</span>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="font-bold font-mono text-xs">₹{prod.price.toFixed(2)}</p>
                                    </div>
                                </button>
                            ))}
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
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800 relative transition-colors rounded-b-xl">
                {cart.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-60">
                        <ShoppingCart className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">Cart is empty</p>
                        <p className="text-sm">Scan items or search to begin</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="py-2 px-2 w-12 text-center hidden md:table-cell">#</th>
                                    <th className="py-2 px-2">Item Details</th>
                                    <th className="py-2 px-2 w-32 text-center hidden sm:table-cell">Unit Price</th>
                                    <th className="py-2 px-2 w-28 text-center text-indigo-600">Meters</th>
                                    <th className="py-2 px-2 w-28 text-center">Quantity</th>
                                    <th className="py-2 px-2 w-32 text-right">Total</th>
                                    <th className="py-2 px-2 w-16 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                                {cart.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-200/50 dark:hover:bg-slate-700/30 transition-colors bg-white dark:bg-slate-800">
                                        <td className="py-1.5 px-2 text-center text-slate-400 font-mono hidden md:table-cell text-xs">{idx + 1}</td>
                                        <td className="py-1.5 px-2">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                {item.sku} {item.unit === 'Meter' && <span className="bg-slate-100 dark:bg-slate-700 px-1 rounded ml-1">Per Meter</span>}
                                            </p>
                                            {(item.size || item.color) && (
                                                <div className="flex gap-2 mt-0.5">
                                                    {item.size && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">Size: {item.size}</span>}
                                                    {item.color && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">Col: {item.color}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-1.5 px-2 text-center font-mono text-slate-600 hidden sm:table-cell text-xs">
                                            ₹{item.price.toFixed(2)}
                                        </td>

                                        {/* Meter Column */}
                                        <td className="py-1.5 px-2 text-center">
                                            {item.unit === 'Meter' ? (
                                                <div className="flex items-center justify-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-0.5 border border-indigo-200 dark:border-indigo-800 w-fit mx-auto">
                                                    <input
                                                        ref={(el) => { cartQtyRefs.current[item.id] = el; }}
                                                        type="number"
                                                        value={item.cutLength || 1}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val) && val > 0) {
                                                                dispatch(updateCartLength({ id: item.id, length: val }));
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') skuInputRef.current?.focus();
                                                        }}
                                                        className="w-14 text-center bg-transparent border-none font-bold text-indigo-700 dark:text-indigo-400 focus:ring-0 rounded h-6 text-xs spin-hide"
                                                        placeholder="1.00"
                                                        step="0.01"
                                                    />
                                                    <span className="text-[10px] font-bold text-indigo-400 mr-1">m</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                        </td>

                                        {/* Quantity Column */}
                                        <td className="py-1.5 px-2 text-center">
                                            <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-0.5 border border-slate-200 w-fit mx-auto">
                                                <button
                                                    onClick={() => dispatch(updateCartQty({ id: item.id, qty: item.qty - 1 }))}
                                                    className="w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded text-slate-600 text-xs"
                                                    tabIndex={-1}
                                                >-</button>
                                                <input
                                                    ref={(el) => { if (item.unit !== 'Meter') cartQtyRefs.current[item.id] = el; }}
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val >= 0) {
                                                            dispatch(updateCartQty({ id: item.id, qty: val }));
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') skuInputRef.current?.focus();
                                                    }}
                                                    className="w-10 text-center bg-transparent border-none font-bold focus:ring-2 focus:ring-indigo-500 rounded h-6 text-xs spin-hide"
                                                />
                                                <button
                                                    onClick={() => dispatch(updateCartQty({ id: item.id, qty: item.qty + 1 }))}
                                                    className="w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded text-slate-600 text-xs"
                                                    tabIndex={-1}
                                                >+</button>
                                            </div>
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-bold text-emerald-600 font-mono text-xs">
                                            ₹{(item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty)).toFixed(2)}
                                        </td>
                                        <td className="py-1.5 px-2 text-center">
                                            <button
                                                onClick={() => dispatch(removeFromCart(item.id))}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                                tabIndex={-1}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col gap-2 p-2 pb-20">
                            {cart.map((item) => (
                                <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{item.name}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                                            {(item.size || item.color) && (
                                                <div className="flex gap-2 mt-1">
                                                    {item.size && <span className="text-[10px] bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">Sz: {item.size}</span>}
                                                    {item.color && <span className="text-[10px] bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">Col: {item.color}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-bold font-mono text-emerald-600">₹{(item.price * item.qty).toFixed(2)}</p>
                                    </div>

                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm">
                                                <button
                                                    onClick={() => dispatch(updateCartQty({ id: item.id, qty: Math.max(0, item.qty - 1) }))}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-500 active:bg-slate-100 rounded-md"
                                                >-</button>
                                                <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                                                <button
                                                    onClick={() => dispatch(updateCartQty({ id: item.id, qty: item.qty + 1 }))}
                                                    className="w-8 h-8 flex items-center justify-center text-indigo-600 active:bg-indigo-50 rounded-md"
                                                >+</button>
                                            </div>
                                            <p className="text-xs text-slate-400">@ ₹{item.price}</p>
                                        </div>

                                        <button
                                            onClick={() => dispatch(removeFromCart(item.id))}
                                            className="p-2 text-red-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
