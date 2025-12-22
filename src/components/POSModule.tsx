
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addToCart, removeFromCart, updateCartQty, processSale, setCustomer, setActiveSession, setTaxMode, setPaymentMethod } from '../store';
import { Search, ShoppingCart, Trash2, User, AlertOctagon, CreditCard, Banknote, Smartphone, Barcode, Check, Loader2, Maximize2, Minimize2, Camera, X } from 'lucide-react';
import { Customer, Sale } from '../types/sales';
import { Product } from '../types/product';
import { TaxMode, PaymentMethod } from '../types/common';

import { ReceiptModal } from './ReceiptModal';
import { CameraScanner } from './CameraScanner';
import { searchProductsByImage } from '../services/geminiService';
import { useBranchResolver } from '../hooks/useBranchResolver';

const POSModule: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { products } = useSelector((state: RootState) => state.inventory);
    const { sessions, activeSessionIndex, customers } = useSelector((state: RootState) => state.pos);
    const { defaultTaxMode } = useSelector((state: RootState) => state.settings);

    // --- Global State ---
    const activeSession = useMemo(() => sessions[activeSessionIndex], [sessions, activeSessionIndex]);
    const cart = activeSession.cart;
    const activeCustomerId = activeSession.customerId;
    const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0];
    const isBranchAll = currentBranch === 'All';

    // --- Local Search State ---
    const [skuQuery, setSkuQuery] = useState('');
    const [nameQuery, setNameQuery] = useState('');
    const [phoneQuery, setPhoneQuery] = useState('');

    // --- Suggestions State ---
    const [nameSuggestions, setNameSuggestions] = useState<Product[]>([]);
    const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
    const [selectedNameIndex, setSelectedNameIndex] = useState(-1);
    const [selectedPhoneIndex, setSelectedPhoneIndex] = useState(-1);

    // --- Visual Search State ---
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [visualMatches, setVisualMatches] = useState<string[] | null>(null);
    const [isIdentifying, setIsIdentifying] = useState(false);

    // --- Interaction State ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [mobileTab, setMobileTab] = useState<'CART' | 'CHECKOUT'>('CART');

    // --- Receipt State ---
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);

    // --- Refs ---
    const posContainerRef = useRef<HTMLDivElement>(null);
    const skuInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const cartQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // --- Computed Data ---
    // --- Computed Data ---
    const filteredProducts = useMemo(() => {
        let prods = products.filter(p =>
            p.sector === currentSector &&
            (currentBranch === 'All' || p.branchId === currentBranch)
        );

        if (visualMatches && visualMatches.length > 0) {
            prods = prods.filter(p => visualMatches.includes(p.id));
        }

        return prods;
    }, [products, currentSector, currentBranch, visualMatches]);

    const { cartSubtotal, taxAmount, cartTotal } = useMemo(() => {
        let subtotal = 0;
        let tax = 0;

        cart.forEach(item => {
            const gstRate = (item.gstPercentage || 18) / 100;
            const lineTotal = item.price * item.qty;

            if (activeSession.taxMode === 'EXCLUSIVE') {
                subtotal += lineTotal;
                tax += lineTotal * gstRate;
            } else {
                // INCLUSIVE: lineTotal is the final amount customer pays
                // Back-calculate Base: Base * (1 + GST) = Total -> Base = Total / (1 + GST)
                const baseAmount = lineTotal / (1 + gstRate);
                subtotal += baseAmount;
                tax += (lineTotal - baseAmount);
            }
        });

        return {
            cartSubtotal: subtotal,
            taxAmount: tax,
            cartTotal: subtotal + tax
        };
    }, [cart, activeSession.taxMode]);

    // --- Effect: Auto-focus SKU on mount ---
    useEffect(() => {
        skuInputRef.current?.focus();
    }, []);

    // --- Effect: Auto-focus Cart Qty ---
    useEffect(() => {
        if (focusedItemId && cartQtyRefs.current[focusedItemId]) {
            const el = cartQtyRefs.current[focusedItemId];
            if (el) {
                el.focus();
                el.select(); // Select all text for quick overwrite
                setFocusedItemId(null); // Reset trigger
            }
        }
    }, [cart, focusedItemId]);

    // --- Effect: Handle Full Screen Changes ---
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            posContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // --- Action: Checkout ---
    // --- Action: Checkout ---
    const { getBranchName } = useBranchResolver(); // Get helper
    const salesHistory = useSelector((state: RootState) => state.pos.salesHistory); // Get history for count

    const handleCheckout = useCallback(async () => {
        if (cart.length === 0 || isBranchAll || isProcessing) return;

        setIsProcessing(true);

        // Simulate API Delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // --- Dynamic Bill Number Logic ---
        const branchName = getBranchName(currentBranch);
        const branchCode = branchName ? branchName.substring(0, 3).toUpperCase() : 'BRN';

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;

        // Count today's sales for this branch
        // Note: checking date string match using localized date might be fragile across timezones, 
        // but sufficient for MVP if running locally. Ideally use ISO date substring (YYYY-MM-DD).
        const todayISO = now.toISOString().split('T')[0];
        const todaysCount = salesHistory.filter(s =>
            s.branchId === currentBranch &&
            s.date.startsWith(todayISO)
        ).length + 1; // +1 for current sale

        const billId = `${branchCode}${dd}${dateStr}${String(todaysCount).padStart(3, '0')}`;
        // e.g., CHE221225001 (Note: User asked for CHE122225001, which is Branch+MM+DD+YY+Count? 
        // User example: CHE122225001 -> 12/22/25. So Month-Day-Year? 
        // User said: "bill number based on branchcodeDDMMYY" -> CHE+22+12+25. 
        // But then example "CHE122225001" and "12/22/25". 12 is month.
        // Let's stick to DDMMYY as requested in text "branchcodeDDMMYY".
        // Example CHE221225001 -> 22nd Dec 2025. This allows sorting by day if needed visually.
        // Wait, user example "CHE122225001" matches "12/22/25". That is MM DD YY.
        // I will stick to stricter "branchcodeDDMMYY" as written in text: "branchcodeDDMMYY".
        // So 221225. ID: CHE221225001.

        const saleData: Sale = {
            id: billId,
            date: now.toISOString(),
            items: [...cart],
            total: cartTotal,
            customerId: activeCustomerId || undefined,
            sector: currentSector,
            branchId: currentBranch,
            taxMode: activeSession.taxMode,
            paymentMethod: activeSession.paymentMethod
        };

        dispatch(processSale(saleData));

        // Show Receipt Modal
        setCompletedSale(saleData);

        setIsProcessing(false);

        // Reset focus to SKU
        setTimeout(() => {
            skuInputRef.current?.focus();
            dispatch(setTaxMode(defaultTaxMode));
        }, 100);
    }, [cart, isBranchAll, isProcessing, cartTotal, activeCustomerId, currentSector, currentBranch, activeSession.taxMode, activeSession.paymentMethod, dispatch, defaultTaxMode, getBranchName, salesHistory]);

    // --- Handlers: SKU Input ---
    const handleSkuKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const match = filteredProducts.find(p => p.sku === skuQuery || p.barcode === skuQuery);
            if (match) {
                if (match.stock > 0) {
                    dispatch(addToCart({ ...match, qty: 1 }));
                    setSkuQuery('');

                    // Ensure focus stays on SKU input for rapid scanning
                    setTimeout(() => {
                        skuInputRef.current?.focus();
                    }, 10);
                }
            }
        }
    };

    // --- Handlers: Name Input ---
    useEffect(() => {
        if (nameQuery.length > 1) {
            const matches = filteredProducts.filter(p => p.name.toLowerCase().includes(nameQuery.toLowerCase())).slice(0, 5);
            setNameSuggestions(matches);
            setSelectedNameIndex(-1);
        } else {
            setNameSuggestions([]);
        }
    }, [nameQuery, filteredProducts]);

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

    const handleSelectProduct = (product: Product) => {
        dispatch(addToCart({ ...product, qty: 1 }));
        setFocusedItemId(product.id); // Trigger focus in cart
        setNameQuery('');
        setNameSuggestions([]);
        setVisualMatches(null); // Clear visual search on selection
    };

    // --- Handlers: Camera ---
    const handleCameraCapture = async (file: File) => {
        setIsIdentifying(true);
        // Close camera immediately or keep open? Better to close to show loading overlay or progress
        setIsCameraOpen(false); // Close camera to show processing state on main screen? Or keep modla?
        // Let's keep modal open? No, the scanner component doesn't handle 'loading' state well yet.
        // Better: Close camera, show global 'isIdentifying' loader.

        try {
            // Need 'products' to send context to Gemini
            // Filter products by current sector first to optimize prompt context
            const sectorProducts = products.filter(p => p.sector === currentSector);

            const matchedIds = await searchProductsByImage(file, sectorProducts);

            if (matchedIds.length > 0) {
                if (matchedIds.length === 1) {
                    // Exact match found
                    const product = products.find(p => p.id === matchedIds[0]);
                    if (product) {
                        dispatch(addToCart({ ...product, qty: 1 }));
                        // Toast success?
                    }
                } else {
                    // Multiple matches
                    setVisualMatches(matchedIds);
                    // Focus the list
                }
            } else {
                alert("No products identified. Try checking your inventory or the image clarity.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to identify product.");
        } finally {
            setIsIdentifying(false);
        }
    };

    const handleBarcodeScan = (code: string) => {
        // Find product by SKU or Barcode
        const match = products.find(p => p.sku === code || p.barcode === code);

        if (match) {
            // Check stock
            if (match.stock > 0) {
                dispatch(addToCart({ ...match, qty: 1 }));
                // Play beep?
                // Optional: Close scanner after successful scan for single-item flow, 
                // or keep open for multi-scan? 
                // Let's keep it open but show a toast/notification (not implemented yet, so maybe just blink?)
                // For now, let's close it to indicate success clearly or maybe just alert?
                // Most POS scanners let you keep scanning. 

                // Let's just create a temporary visual feedback?
                // For MVP, lets just proceed.
                // Maybe close if it was a quick lookup?

                // If the user wants to scan multiple, we shouldn't close. 
                // But we need feedback.
                // Let's rely on the cart updating in background (Sound would be good).
            } else {
                alert(`Product "${match.name}" is out of stock!`);
            }
        } else {
            console.warn("Product not found for code:", code);
            // Optionally show "Not Found" on the scanner UI itself if we could pass props back
        }
    };

    // --- Handlers: Phone Input ---
    useEffect(() => {
        if (phoneQuery) {
            const matches = customers.filter(c => c.phone.includes(phoneQuery) || c.name.toLowerCase().includes(phoneQuery.toLowerCase())).slice(0, 5);
            setPhoneSuggestions(matches);
        } else {
            setPhoneSuggestions([]);
        }
    }, [phoneQuery, customers]);

    const handlePhoneKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedPhoneIndex(prev => Math.min(prev + 1, phoneSuggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedPhoneIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedPhoneIndex >= 0 && phoneSuggestions[selectedPhoneIndex]) {
                const cust = phoneSuggestions[selectedPhoneIndex];
                dispatch(setCustomer(cust.id));
                setPhoneQuery('');
                setPhoneSuggestions([]);
            }
        }
    };

    // --- Global Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab Switching
            if (e.altKey) {
                if (['1', '2', '3', '4'].includes(e.key)) {
                    e.preventDefault();
                    dispatch(setActiveSession(parseInt(e.key) - 1));
                }
            }
            // Focus Shortcuts
            if (e.ctrlKey && e.key === 'b') { // Barcode
                e.preventDefault();
                skuInputRef.current?.focus();
            }
            if (e.ctrlKey && e.key === 'f') { // Find Name
                e.preventDefault();
                nameInputRef.current?.focus();
            }
            if (e.ctrlKey && e.key === 'k') { // Customer
                e.preventDefault();
                phoneInputRef.current?.focus();
            }

            // Checkout Shortcut: Ctrl + Space or Ctrl + Enter
            if (e.ctrlKey && (e.code === 'Space' || e.key === 'Enter')) {
                e.preventDefault();
                handleCheckout();
            }

            // Escape to focus SKU (Reset flow)
            if (e.key === 'Escape') {
                skuInputRef.current?.focus();
                setSkuQuery('');
                setNameSuggestions([]);
                setPhoneSuggestions([]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, handleCheckout]);

    return (
        <>
            <div
                ref={posContainerRef}
                className={`flex flex-col relative transition-all duration-300 ${isFullScreen ? 'h-screen fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-4' : 'h-[calc(100vh-9rem)]'}`}
            >
                {/* Modals & Overlays (Must be inside for Full Screen visibility) */}
                {completedSale && (
                    <ReceiptModal
                        sale={completedSale}
                        onClose={() => setCompletedSale(null)}
                    />
                )}

                {isCameraOpen && (
                    <CameraScanner
                        onCapture={handleCameraCapture}
                        onScan={handleBarcodeScan}
                        onClose={() => setIsCameraOpen(false)}
                    />
                )}

                {isIdentifying && (
                    <div className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-xl">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-400" />
                        <p className="font-bold text-xl">Analyzing Image...</p>
                        <p className="text-slate-300 text-sm">Identifying product against inventory</p>
                    </div>
                )}
                {/* Top Bar: Sessions & Full Screen Toggle */}
                <div className="flex gap-4 mb-2 shrink-0 items-end">
                    {/* Session Tabs */}
                    <div className="flex gap-2 flex-1">
                        {sessions.map((session, index) => {
                            const totalQty = session.cart.reduce((acc, item) => acc + item.qty, 0);
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => dispatch(setActiveSession(index))}
                                    title={`Switch to ${session.label} (Alt+${index + 1})`}
                                    className={`flex-1 py-2 px-4 rounded-t-lg font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeSessionIndex === index
                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="text-sm">{session.label}</span>
                                    {totalQty > 0 && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeSessionIndex === index
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}>
                                            {totalQty}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Full Screen Toggle */}
                    <button
                        onClick={toggleFullScreen}
                        className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg shadow-sm border-b-2 border-transparent transition-all"
                        title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

                    {/* LEFT 2/3 - BILLING TABLE & SEARCH */}
                    <div className={`col-span-12 lg:col-span-8 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden min-h-0 transition-colors ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>

                        {/* Search Bar Row - Compact */}
                        <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-2 shrink-0 z-20">

                            {/* SKU Input */}
                            <div className="relative group flex-1">
                                <div className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                                    <Barcode className="w-4 h-4" />
                                </div>
                                <input
                                    ref={skuInputRef}
                                    type="text"
                                    placeholder="Scan SKU (Ctrl+B)"
                                    className="w-full pl-9 pr-14 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors shadow-sm"
                                    value={skuQuery}
                                    onChange={e => setSkuQuery(e.target.value)}
                                    onKeyDown={handleSkuKeyDown}
                                />
                                <kbd className="absolute right-2 top-2.5 text-[9px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 font-mono">Ctrl+B</kbd>
                            </div>

                            {/* Camera Trigger (Mobile & Desktop) */}
                            <button
                                onClick={() => setIsCameraOpen(true)}
                                className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors rounded-lg shadow-sm shrink-0"
                                title="Scan Product via Camera"
                            >
                                <Camera className="w-4 h-4" />
                            </button>

                            {/* Name Input */}
                            <div className="relative group flex-[1.5]">
                                <div className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                                    <Search className="w-4 h-4" />
                                </div>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    placeholder="Search Name..."
                                    className="w-full pl-9 pr-14 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors shadow-sm"
                                    value={nameQuery}
                                    onChange={e => setNameQuery(e.target.value)}
                                    onKeyDown={handleNameKeyDown}
                                    autoComplete="off"
                                />
                                <kbd className="absolute right-2 top-2.5 text-[9px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 font-mono">Ctrl+F</kbd>

                                {/* Name Suggestions Dropdown */}
                                {nameSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto ring-1 ring-black/5 dark:ring-black/20">
                                        {nameSuggestions.map((prod, idx) => (
                                            <button
                                                key={prod.id}
                                                onClick={() => handleSelectProduct(prod)}
                                                className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center group transition-colors ${idx === selectedNameIndex ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-bold text-xs truncate">{prod.name}</p>
                                                    <div className="flex gap-1 mt-0.5">
                                                        <span className={`text-[9px] px-1 rounded border ${idx === selectedNameIndex ? 'border-indigo-400 bg-indigo-500/30' : 'border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{prod.sku}</span>
                                                    </div>
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
                        {visualMatches && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 flex justify-between items-center border-b border-indigo-100 dark:border-indigo-500/20">
                                <span className="text-indigo-700 dark:text-indigo-300 text-sm flex items-center gap-2">
                                    <Camera className="w-4 h-4" />
                                    Visual Search: Found {visualMatches.length} matches
                                </span>
                                <button
                                    onClick={() => setVisualMatches(null)}
                                    className="p-1 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 rounded-full text-indigo-700 dark:text-indigo-300 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Billing Table */}
                        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800 relative transition-colors">
                            {cart.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-60">
                                    <ShoppingCart className="w-16 h-16 mb-4" />
                                    <p className="text-lg font-medium">Cart is empty</p>
                                    <p className="text-sm">Scan items (Ctrl+B) or search (Ctrl+F) to begin</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                                    <thead className="bg-slate-100 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 w-12 text-center hidden md:table-cell">#</th>
                                            <th className="p-4">Item Details</th>
                                            <th className="p-4 w-32 text-center hidden sm:table-cell">Unit Price</th>
                                            <th className="p-4 w-40 text-center">Quantity</th>
                                            <th className="p-4 w-32 text-right">Total</th>
                                            <th className="p-4 w-16 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                                        {cart.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-slate-200/50 dark:hover:bg-slate-700/30 transition-colors group bg-white dark:bg-slate-800">
                                                <td className="p-4 text-center text-slate-400 dark:text-slate-500 font-mono hidden md:table-cell">{idx + 1}</td>
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{item.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                                                </td>
                                                <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                                                    ₹{item.price.toFixed(2)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700 w-fit mx-auto">
                                                        <button
                                                            onClick={() => dispatch(updateCartQty({ id: item.id, qty: item.qty - 1 }))}
                                                            className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-200 transition-colors"
                                                            tabIndex={-1}
                                                        >-</button>
                                                        <input
                                                            ref={(el) => { cartQtyRefs.current[item.id] = el; }}
                                                            type="number"
                                                            value={item.qty}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val) && val >= 0) {
                                                                    dispatch(updateCartQty({ id: item.id, qty: val }));
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    // Return to SKU scan for speed
                                                                    skuInputRef.current?.focus();
                                                                }
                                                            }}
                                                            className="w-14 text-center bg-transparent border-none text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 rounded h-8 spin-hide"
                                                        />
                                                        <button
                                                            onClick={() => dispatch(updateCartQty({ id: item.id, qty: item.qty + 1 }))}
                                                            className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-200 transition-colors"
                                                            tabIndex={-1}
                                                        >+</button>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-base">
                                                    ₹{(item.price * item.qty).toFixed(2)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => dispatch(removeFromCart(item.id))}
                                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        tabIndex={-1}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* RIGHT 1/3 - CUSTOMER & SETTLEMENT */}
                    <div className={`col-span-12 lg:col-span-4 flex flex-col gap-6 min-h-0 ${mobileTab === 'CHECKOUT' ? 'flex' : 'hidden lg:flex'}`}>

                        {/* Customer Panel */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg shrink-0 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider">
                                    <User className="w-4 h-4" /> Customer Info
                                </div>
                                {activeCustomer.id !== 'c1' && (
                                    <button onClick={() => dispatch(setCustomer('c1'))} className="text-xs text-red-500 dark:text-red-400 hover:underline">Reset</button>
                                )}
                            </div>

                            <div className="relative mb-3">
                                <input
                                    ref={phoneInputRef}
                                    type="text"
                                    placeholder="Search Phone or Name (Ctrl+K)..."
                                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border ${activeCustomer.id !== 'c1' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                                    value={phoneQuery}
                                    onChange={e => setPhoneQuery(e.target.value)}
                                    onKeyDown={handlePhoneKeyDown}
                                />
                                <Smartphone className={`absolute left-3 top-3 w-4 h-4 ${activeCustomer.id !== 'c1' ? 'text-emerald-500' : 'text-slate-400'}`} />

                                {/* Customer Suggestions */}
                                {phoneSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                        {phoneSuggestions.map((cust, idx) => (
                                            <button
                                                key={cust.id}
                                                onClick={() => {
                                                    dispatch(setCustomer(cust.id));
                                                    setPhoneQuery('');
                                                    setPhoneSuggestions([]);
                                                }}
                                                className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-100 dark:border-slate-700/50 block ${idx === selectedPhoneIndex ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                <span className="font-bold">{cust.name}</span>
                                                <span className={`block text-xs ${idx === selectedPhoneIndex ? 'text-indigo-200' : 'text-slate-500'}`}>{cust.phone} &bull; {cust.points} pts</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-slate-500 dark:text-slate-400 text-xs">Customer Name</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{activeCustomer.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 text-xs">Loyalty Points</span>
                                    <span className="text-indigo-500 dark:text-indigo-400 font-bold text-sm">{activeCustomer.points} pts</span>
                                </div>
                            </div>
                        </div>

                        {/* Settlement Panel */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg flex-1 flex flex-col min-h-0 transition-colors">
                            <h3 className="text-indigo-500 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Settlement
                            </h3>

                            {/* Toggles */}
                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Tax Mode</span>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                                            {(['EXCLUSIVE', 'INCLUSIVE'] as TaxMode[]).map(mode => (
                                                <button
                                                    key={mode}
                                                    onClick={() => dispatch(setTaxMode(mode))}
                                                    className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${activeSession.taxMode === mode ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                                >
                                                    {mode === 'EXCLUSIVE' ? '+ Tax' : 'Incl.'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Payment</span>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                                            {(['CASH', 'CARD', 'UPI'] as PaymentMethod[]).map(method => (
                                                <button
                                                    key={method}
                                                    onClick={() => dispatch(setPaymentMethod(method))}
                                                    className={`flex-1 py-1.5 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${activeSession.paymentMethod === method ? 'bg-emerald-600 text-white shadow font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                                    title={method}
                                                >
                                                    {method === 'CASH' && <Banknote className="w-4 h-4" />}
                                                    {method === 'CARD' && <Smartphone className="w-4 h-4" />}
                                                    {method === 'UPI' && <Smartphone className="w-4 h-4" />}
                                                    <span className="text-[9px] uppercase leading-none">{method}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isBranchAll && (
                                <div className="p-3 mb-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg flex items-start gap-3 text-yellow-700 dark:text-yellow-200 text-xs">
                                    <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Select a specific branch from the top menu to enable checkout.</span>
                                </div>
                            )}

                            <div className="mt-auto space-y-3">
                                <div className="flex justify-between items-center text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-mono">₹{cartSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Tax {activeSession.taxMode === 'INCLUSIVE' ? '(Included)' : ''}</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-mono">₹{taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end pt-2">
                                    <span className="text-slate-700 dark:text-slate-300 font-bold text-lg">Total Payable</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-3xl font-mono tracking-tight">₹{cartTotal.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0 || isBranchAll || isProcessing}
                                    className="relative w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:border disabled:border-slate-300 dark:disabled:border-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 mt-4 text-lg group"
                                    title="Shortcut: Ctrl + Space"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-6 h-6" />
                                            Finalize Bill
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity bg-black/20 px-2 py-1 rounded">Ctrl+Space</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="lg:hidden mt-4 grid grid-cols-2 gap-4 shrink-0">
                    <button
                        onClick={() => setMobileTab('CART')}
                        className={`p-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${mobileTab === 'CART' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                    >
                        <ShoppingCart className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase">Cart ({cart.reduce((a, b) => a + b.qty, 0)})</span>
                    </button>
                    <button
                        onClick={() => setMobileTab('CHECKOUT')}
                        className={`p-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${mobileTab === 'CHECKOUT' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">₹{cartTotal.toFixed(2)}</span>
                            <Check className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold uppercase">Checkout</span>
                    </button>
                </div>
            </div >
        </>
    );
};

export default POSModule;
