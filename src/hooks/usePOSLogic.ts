import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    RootState, AppDispatch,
    processSale, setActiveSession, setTaxMode,
    holdCurrentBill, resumeBill, discardHeldBill,
    removeFromCart, clearCart
} from '../store';
import { Sale, Customer, CartItem, Session } from '../types/sales';
import { usePOSShortcuts } from './usePOSShortcuts';
import { useBranchResolver } from './useBranchResolver';
import { useAppSettings } from './useAppSettings';
import { printSaleReceipt } from '../utils/printService';
import { Sector } from '../types/common';

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

export const usePOSLogic = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { tenants, branches } = useSelector((state: RootState) => state.tenant);
    const { products } = useSelector((state: RootState) => state.inventory);
    const { sessions, activeSessionIndex, customers, heldBills } = useSelector((state: RootState) => state.pos);
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
    const [viewMode, setViewMode] = useState<'SCANNER' | 'VISUAL'>('SCANNER');
    const [mobileTab, setMobileTab] = useState<'MAIN' | 'CART'>('MAIN');
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

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            posContainerRef.current?.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    }, []);

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

    // --- Computed Branch Logic ---
    const allBranches = useMemo(() => {
        if (user?.tenantId) {
            const relevantTenant = tenants.find(t => t.id === user.tenantId);
            const tenantBranches = relevantTenant?.locations?.flatMap(l => l.branches) || [];
            const directBranches = branches.filter(b => b.tenantId === user.tenantId);
            const combined = [...tenantBranches, ...directBranches].filter((b, i, self) =>
                i === self.findIndex((t) => t.id === b.id)
            );
            if (combined.length > 0) return combined;
        }

        const uniqueProductBranches = Array.from(new Set(products.map(p => p.branchId).filter(id => id && id !== 'All')));
        if (uniqueProductBranches.length > 0) {
            return uniqueProductBranches.map(id => ({ id: id || 'temp', name: 'Inferred Branch' }));
        }

        return [];
    }, [tenants, branches, user?.tenantId, products]);

    const hasMultipleBranches = allBranches.length > 1;

    // --- Checkout Logic ---
    const handleCheckout = useCallback(async () => {
        if (hasMultipleBranches && isBranchAll) {
            alert("Please select a specific branch to checkout.");
            return;
        }

        if (cart.length === 0 || isProcessing) return;

        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();
        const sale: Sale = {
            id: saleId,
            date: new Date().toISOString(),
            items: cart, // Using local cart variable
            total: cart.reduce((acc, item) => acc + (item.price * item.qty), 0),
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

        const currentTenant = tenants.find(t => t.id === user?.tenantId);
        const tenantName = currentTenant ? currentTenant.name : 'Enterprise Mgr';
        const branchName = getBranchName(currentBranch);
        printSaleReceipt(sale, tenantName, branchName);

        setIsProcessing(false);
        setIsPreOrder(false);

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
            window.dispatchEvent(new CustomEvent('pos-focus-search'));
        },
        onSearchCustomer: () => {
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

    // --- Session Switching ---
    const switchSession = useCallback((idx: number) => {
        dispatch(setActiveSession(idx));
    }, [dispatch]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                switchSession(parseInt(e.key) - 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [switchSession]);

    return {
        // State
        user,
        currentSector,
        currentBranch,
        sessions,
        activeSessionIndex,
        activeSession,
        cart,
        activeCustomer,
        customers,
        heldBills,
        isFullScreen,
        viewMode,
        mobileTab,
        isProcessing,
        isPreOrder,
        isHeldBillsOpen,

        // Computed
        cartSubtotal,
        taxAmount,
        cartTotal,
        hasMultipleBranches,
        allBranches,
        products,

        // Actions
        toggleFullScreen,
        setViewMode,
        setMobileTab,
        setIsPreOrder,
        setIsHeldBillsOpen,
        handleCheckout,
        switchSession,
        dispatch,
        resumeBill: (id: string) => dispatch(resumeBill(id)),
        discardHeldBill: (id: string) => dispatch(discardHeldBill(id)),

        // Refs
        posContainerRef
    };
};

export type POSLogic = ReturnType<typeof usePOSLogic>;
