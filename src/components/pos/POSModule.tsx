import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, processSale, setActiveSession, setTaxMode, holdCurrentBill, resumeBill, discardHeldBill, removeFromCart, updateCartQty, clearCart, updateCartLength } from '../../store';
import { Sale, Customer } from '../../types/sales';
import { ShoppingCart, LayoutGrid, Table as TableIcon, PauseCircle, Monitor } from 'lucide-react';

import { POSHeader } from './POSHeader';
import { POSSidebar } from './POSSidebar';
import { POSProductBrowser } from './POSProductBrowser';
import { POSCartGrid } from './POSCartGrid'; // Old Component Restored
import { POSCustomerPanel } from './POSCustomerPanel'; // Old Component Restored
import { POSFooter } from './POSFooter'; // Old Component Restored
import { ReceiptModal } from '../ReceiptModal';
import { POSHeldBillsModal } from './POSHeldBillsModal';
import { usePOSShortcuts } from '../../hooks/usePOSShortcuts';
import { useBranchResolver } from '../../hooks/useBranchResolver';
import { useAppSettings } from '../../hooks/useAppSettings';
import { printSaleReceipt } from '../../utils/printService';

const DEFAULT_CUSTOMER: Customer = {
    id: 'c1',
    name: 'Walk-in Customer',
    phone: '',
    points: 0,
    creditBalance: 0,
    creditLimit: 0,
    riskScore: 0,
    tenantId: '',
    totalVisits: 0,
    totalSpent: 0
};

const POSModule: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { tenants, branches } = useSelector((state: RootState) => state.tenant);
    const { products } = useSelector((state: RootState) => state.inventory);
    const { sessions, activeSessionIndex, customers, salesHistory, heldBills } = useSelector((state: RootState) => state.pos);
    const settings = useAppSettings();
    const { defaultTaxMode } = settings;

    // --- Global State ---
    const activeSession = useMemo(() => sessions[activeSessionIndex], [sessions, activeSessionIndex]);
    const cart = activeSession.cart;
    const activeCustomerId = activeSession.customerId;
    const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0] || DEFAULT_CUSTOMER;
    const isBranchAll = currentBranch === 'All';

    // --- Local State ---
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [viewMode, setViewMode] = useState<'SCANNER' | 'VISUAL'>('SCANNER'); // Default to Scanner (Table)
    const [mobileTab, setMobileTab] = useState<'MAIN' | 'CART'>('MAIN');
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPreOrder, setIsPreOrder] = useState(false);
    const [isHeldBillsOpen, setIsHeldBillsOpen] = useState(false);

    const posContainerRef = useRef<HTMLDivElement>(null);
    const { getBranchName } = useBranchResolver();

    // --- Full Screen Logic ---
    useEffect(() => {
        const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            posContainerRef.current?.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    };

    // --- Computed Totals ---
    const { cartSubtotal, taxAmount, cartTotal } = useMemo(() => {
        let subtotal = 0;
        let tax = 0;

        cart.forEach(item => {
            const gstRate = (item.gstPercentage || 18) / 100;
            const computedQty = item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty;
            const lineTotal = item.price * computedQty;

            if (activeSession.taxMode === 'EXCLUSIVE') {
                subtotal += lineTotal;
                tax += lineTotal * gstRate;
            } else {
                const baseAmount = lineTotal / (1 + gstRate);
                subtotal += baseAmount;
                tax += (lineTotal - baseAmount);
            }
        });

        return { cartSubtotal: subtotal, taxAmount: tax, cartTotal: subtotal + tax };
    }, [cart, activeSession.taxMode]);

    // --- Checkout Logic ---
    // --- Computed Branch Logic ---
    const allBranches = useMemo(() => {
        // Strategy 1: Check authenticated user tenant
        if (user?.tenantId) {
            const relevantTenant = tenants.find(t => t.id === user.tenantId);
            const tenantBranches = relevantTenant?.locations?.flatMap(l => l.branches) || [];

            // Also check standalone branches slice
            const directBranches = branches.filter(b => b.tenantId === user.tenantId);

            // Combine and Deduplicate
            const combined = [...tenantBranches, ...directBranches].filter((b, i, self) =>
                i === self.findIndex((t) => t.id === b.id)
            );
            if (combined.length > 0) return combined;
        }

        // Strategy 2: Fallback to inferring from Products (if user context is stale)
        // If products exist, checking their unique branchIds is a reliable proxy for active branches
        const uniqueProductBranches = Array.from(new Set(products.map(p => p.branchId).filter(id => id && id !== 'All')));
        if (uniqueProductBranches.length > 0) {
            // Return dummy array of length matching unique branches to trigger count logic
            return uniqueProductBranches.map(id => ({ id: id || 'temp', name: 'Inferred Branch' }));
        }

        return [];
    }, [tenants, branches, user?.tenantId, products]);

    const hasMultipleBranches = allBranches.length > 1;

    // --- Checkout Logic ---
    const handleCheckout = useCallback(async () => {
        // Enforce Branch Selection if multiple branches exist
        if (hasMultipleBranches && isBranchAll) {
            alert("Please select a specific branch to checkout.");
            return;
        }

        if (cart.length === 0 || isProcessing) return;

        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay

        const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();
        const sale: Sale = {
            id: saleId,
            date: new Date().toISOString(),
            items: activeSession.cart,
            total: activeSession.cart.reduce((acc, item) => acc + (item.price * item.qty), 0),
            customerId: activeSession.customerId || undefined,
            sector: currentSector,
            branchId: currentBranch,
            taxMode: activeSession.taxMode,
            paymentMethod: activeSession.paymentMethod,
            status: isPreOrder ? 'PREORDER' : 'COMPLETED',
            paymentStatus: activeSession.paymentMethod === 'CASH' || activeSession.paymentMethod === 'CARD' || activeSession.paymentMethod === 'UPI' ? 'PAID' : 'PENDING',
            userId: user?.id
        };

        dispatch(processSale(sale));

        // Print Directly instead of showing modal
        const currentTenant = tenants.find(t => t.id === user?.tenantId);
        const tenantName = currentTenant ? currentTenant.name : 'Enterprise Mgr';
        const branchName = getBranchName(currentBranch);
        printSaleReceipt(sale, tenantName, branchName);

        setIsProcessing(false);
        setIsPreOrder(false); // Reset for next sale

        setTimeout(() => dispatch(setTaxMode(defaultTaxMode)), 100);
    }, [cart, isBranchAll, hasMultipleBranches, isProcessing, activeSession, currentSector, currentBranch, isPreOrder, dispatch, defaultTaxMode, user, tenants, getBranchName]);

    // --- Customer Display Broadcast ---
    useEffect(() => {
        const channel = new BroadcastChannel('pos_display_channel');
        channel.postMessage({
            type: 'UPDATE_CART',
            payload: {
                cart,
                total: cartTotal,
                customerName: activeCustomer.name
            }
        });
        return () => channel.close();
    }, [cart, cartTotal, activeCustomer]);

    // --- Global Shortcuts (via Hook) ---
    usePOSShortcuts({
        onSearchProduct: () => {
            // Focus SKU input in POSCartGrid or POSProductBrowser
            window.dispatchEvent(new CustomEvent('pos-focus-search'));
        },
        onSearchCustomer: () => {
            // Focus Phone input in POSCustomerPanel
            window.dispatchEvent(new CustomEvent('pos-focus-customer'));
        },
        onHoldBill: () => {
            if (cart.length > 0) {
                dispatch(holdCurrentBill({ note: 'Hold via Shortcut' }));
                alert('Bill Held Successfully!');
            } else {
                setIsHeldBillsOpen(true);
            }
        },
        onCheckout: handleCheckout,
        onDelete: () => {
            // Remove last item if any
            if (cart.length > 0) {
                dispatch(removeFromCart(cart[cart.length - 1].id));
            }
        },
        onFocusQty: () => {
            window.dispatchEvent(new CustomEvent('pos-focus-qty'));
        },
        onToggleView: () => {
            setViewMode(prev => prev === 'SCANNER' ? 'VISUAL' : 'SCANNER');
        },
        onNewSale: () => {
            if (cart.length > 0 && window.confirm('Clear current cart?')) {
                dispatch(clearCart());
            }
        }
    });

    // --- Legacy Shortcuts (Session Switch) ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab Switching (Moved logical check here but could be in hook too)
            if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                dispatch(setActiveSession(parseInt(e.key) - 1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);


    return (
        <>
            <div
                ref={posContainerRef}
                className={`flex flex-col relative transition-all duration-300 ${isFullScreen ? 'h-screen fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-4 pb-20 lg:pb-4' : 'h-[calc(100vh-4rem)] pb-20 lg:pb-0'}`}
            >
                {/* Modals */}
                {/* ReceiptModal removed for direct printing flow */}

                <POSHeldBillsModal
                    isOpen={isHeldBillsOpen}
                    onClose={() => setIsHeldBillsOpen(false)}
                    heldBills={heldBills || []}
                    onResume={(id) => dispatch(resumeBill(id))}
                    onDiscard={(id) => dispatch(discardHeldBill(id))}
                />

                {/* Header with View Toggle */}
                <div className="flex flex-col gap-2 mb-2">
                    <div className="flex justify-between items-center gap-2">
                        <POSHeader
                            sessions={sessions}
                            activeSessionIndex={activeSessionIndex}
                            onSwitchSession={(idx) => dispatch(setActiveSession(idx))}
                            isFullScreen={isFullScreen}
                            onToggleFullScreen={toggleFullScreen}
                        />
                        <div className="flex gap-2 mr-2">
                            <button
                                onClick={() => setIsHeldBillsOpen(true)}
                                className="relative p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg flex items-center gap-2 transition-colors group"
                                title="Held Bills (F6)"
                            >
                                <PauseCircle className="w-5 h-5" />
                                <div className="flex flex-col items-start leading-none">
                                    <span className="hidden md:inline font-bold text-sm">Held Bills</span>
                                    <kbd className="text-[9px] opacity-50 font-mono tracking-tighter">F6</kbd>
                                </div>
                                {(heldBills?.length || 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                                        {heldBills?.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => window.open(window.location.origin + '?mode=customer_display', 'CustomerDisplay', 'width=800,height=600,menubar=0,toolbar=0')}
                                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg flex items-center gap-2 transition-colors"
                                title="Customer Display"
                            >
                                <Monitor className="w-5 h-5" />
                            </button>

                            {/* View Toggle - Moved here */}
                            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1 ml-2">
                                <button
                                    onClick={() => setViewMode('SCANNER')}
                                    className={`px-3 py-1 bg-white dark:bg-slate-700 rounded-md text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${viewMode === 'SCANNER' ? 'text-indigo-600 dark:text-indigo-400 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <TableIcon className="w-3.5 h-3.5" /> Scanner
                                    </div>
                                    <kbd className="text-[9px] opacity-40 font-mono tracking-tighter">Alt+V</kbd>
                                </button>
                                <button
                                    onClick={() => setViewMode('VISUAL')}
                                    className={`px-3 py-1 bg-white dark:bg-slate-800 rounded-md text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${viewMode === 'VISUAL' ? 'text-indigo-600 dark:text-indigo-400 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid className="w-3.5 h-3.5" /> Visual
                                    </div>
                                    <kbd className="text-[9px] opacity-40 font-mono tracking-tighter">Alt+V</kbd>
                                </button>
                            </div>
                        </div>
                    </div>


                </div>

                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 bg-slate-100 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">

                    {/* Left Panel */}
                    <div className={`col-span-12 lg:col-span-8 flex flex-col min-h-0 ${mobileTab === 'MAIN' ? 'flex' : 'hidden lg:flex'}`}>
                        {viewMode === 'VISUAL' ? (
                            <POSProductBrowser
                                products={products}
                                currentBranch={currentBranch}
                                currentSector={currentSector}
                            />
                        ) : (
                            <POSCartGrid
                                cart={cart}
                                products={products}
                                currentSector={currentSector}
                                currentBranch={currentBranch}
                                dispatch={dispatch}
                                isProcessing={isProcessing}
                            />
                        )}
                    </div>

                    {/* Right Panel */}
                    <div className={`col-span-12 lg:col-span-4 flex flex-col min-h-0 border-l border-slate-200 dark:border-slate-800 ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
                        {viewMode === 'VISUAL' ? (
                            <POSSidebar
                                activeCustomer={activeCustomer}
                                customers={customers}
                                cart={cart}
                                taxMode={activeSession.taxMode}
                                paymentMethod={activeSession.paymentMethod}
                                cartSubtotal={cartSubtotal}
                                taxAmount={taxAmount}
                                cartTotal={cartTotal}

                                isProcessing={isProcessing}
                                isBranchAll={isBranchAll}
                                hasMultipleBranches={hasMultipleBranches}
                                isPreOrder={isPreOrder}
                                onSetIsPreOrder={setIsPreOrder}
                                onCheckout={handleCheckout}
                                dispatch={dispatch}
                            />
                        ) : (
                            // Scanner Mode Right Panel (Standard Layout)
                            <div className="flex flex-col h-full bg-white dark:bg-slate-800 shadow-xl z-20">
                                <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <POSCustomerPanel
                                        activeCustomer={activeCustomer}
                                        customers={customers}
                                        dispatch={dispatch}
                                    />
                                </div>
                                <div className="flex-1 bg-slate-50 dark:bg-slate-900/20" />
                                <div className="shrink-0">
                                    <POSFooter
                                        cart={cart}
                                        taxMode={activeSession.taxMode}
                                        paymentMethod={activeSession.paymentMethod}
                                        cartSubtotal={cartSubtotal}
                                        taxAmount={taxAmount}
                                        cartTotal={cartTotal}
                                        isProcessing={isProcessing}
                                        isBranchAll={isBranchAll}
                                        isEmpty={cart.length === 0}
                                        isPreOrder={isPreOrder}
                                        onSetIsPreOrder={setIsPreOrder}
                                        onCheckout={handleCheckout}
                                        dispatch={dispatch}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Tab Nav */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
                    <div className="flex justify-around items-center h-16 px-2">
                        <button
                            onClick={() => setMobileTab('MAIN')}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'MAIN' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <span className="text-[10px] font-medium">{viewMode === 'SCANNER' ? 'Scanner' : 'Products'}</span>
                        </button>

                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

                        <button
                            onClick={() => setMobileTab('CART')}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'CART' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <div className="relative">
                                <ShoppingCart className="w-6 h-6" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {cart.reduce((a, b) => a + b.qty, 0)}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">Cart: ₹{cartTotal.toFixed(2)}</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default POSModule;
