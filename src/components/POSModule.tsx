
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, processSale, setActiveSession, setTaxMode } from '../store';
import { Sale } from '../types/sales';
import { ShoppingCart } from 'lucide-react';

import { POSHeader } from './pos/POSHeader';
import { POSCustomerPanel } from './pos/POSCustomerPanel';
import { POSCartGrid } from './pos/POSCartGrid';
import { POSFooter } from './pos/POSFooter';
import { ReceiptModal } from './ReceiptModal';
import { useBranchResolver } from '../hooks/useBranchResolver';

const POSModule: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { products } = useSelector((state: RootState) => state.inventory);
    const { sessions, activeSessionIndex, customers, salesHistory } = useSelector((state: RootState) => state.pos);
    const { defaultTaxMode } = useSelector((state: RootState) => state.settings);

    // --- Global State ---
    const activeSession = useMemo(() => sessions[activeSessionIndex], [sessions, activeSessionIndex]);
    const cart = activeSession.cart;
    const activeCustomerId = activeSession.customerId;
    const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0];
    const isBranchAll = currentBranch === 'All';

    // --- Local State ---
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [mobileTab, setMobileTab] = useState<'CART' | 'CHECKOUT'>('CART');
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

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
            const lineTotal = item.price * item.qty;

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
    const handleCheckout = useCallback(async () => {
        if (cart.length === 0 || isBranchAll || isProcessing) return;

        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay

        const branchName = getBranchName(currentBranch);
        const branchCode = branchName ? branchName.substring(0, 3).toUpperCase() : 'BRN';

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const todayISO = now.toISOString().split('T')[0];

        const todaysCount = salesHistory.filter(s =>
            s.branchId === currentBranch && s.date.startsWith(todayISO)
        ).length + 1;

        const billId = `${branchCode}${dd}${dateStr}${String(todaysCount).padStart(3, '0')}`;

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
        setCompletedSale(saleData);
        setIsProcessing(false);

        setTimeout(() => dispatch(setTaxMode(defaultTaxMode)), 100);
    }, [cart, isBranchAll, isProcessing, cartTotal, activeCustomerId, currentSector, currentBranch, activeSession, dispatch, defaultTaxMode, getBranchName, salesHistory]);

    // --- Global Shortcuts (Session Switch & Checkout) ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab Switching
            if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                dispatch(setActiveSession(parseInt(e.key) - 1));
            }
            // Checkout Shortcut
            if (e.ctrlKey && (e.code === 'Space' || e.key === 'Enter')) {
                // Should we prevent default? Maybe only if checkout is viable?
                // Left existing logic mostly intact but logic needs to check viability
                if (!(cart.length === 0 || isBranchAll || isProcessing)) {
                    e.preventDefault();
                    handleCheckout();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, handleCheckout, cart, isBranchAll, isProcessing]);


    return (
        <>
            <div
                ref={posContainerRef}
                className={`flex flex-col relative transition-all duration-300 ${isFullScreen ? 'h-screen fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-4' : 'h-[calc(100vh-9rem)]'}`}
            >
                {/* Modals */}
                {completedSale && (
                    <ReceiptModal
                        sale={completedSale}
                        onClose={() => setCompletedSale(null)}
                    />
                )}

                {/* Header */}
                <POSHeader
                    sessions={sessions}
                    activeSessionIndex={activeSessionIndex}
                    onSwitchSession={(idx) => dispatch(setActiveSession(idx))}
                    isFullScreen={isFullScreen}
                    onToggleFullScreen={toggleFullScreen}
                />

                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

                    {/* Left: Cart Grid */}
                    <div className={`col-span-12 lg:col-span-8 flex flex-col min-h-0 ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
                        <POSCartGrid
                            cart={cart}
                            products={products}
                            currentSector={currentSector}
                            currentBranch={currentBranch}
                            dispatch={dispatch}
                            isProcessing={isProcessing}
                        />
                    </div>

                    {/* Right: Customer & Footer */}
                    <div className={`col-span-12 lg:col-span-4 flex flex-col gap-6 min-h-0 ${mobileTab === 'CHECKOUT' ? 'flex' : 'hidden lg:flex'}`}>
                        <POSCustomerPanel
                            activeCustomer={activeCustomer}
                            customers={customers}
                            dispatch={dispatch}
                        />

                        <POSFooter
                            cartSubtotal={cartSubtotal}
                            taxAmount={taxAmount}
                            cartTotal={cartTotal}
                            activeSession={activeSession}
                            isProcessing={isProcessing}
                            isBranchAll={isBranchAll}
                            isEmpty={cart.length === 0}
                            onCheckout={handleCheckout}
                            dispatch={dispatch}
                        />
                    </div>
                </div>

                {/* Mobile Tab Nav */}
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
                        className={`p-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${mobileTab === 'CHECKOUT' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                    >
                        <div className="flex gap-1">
                            <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <span className="text-xs font-bold uppercase">Checkout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default POSModule;
