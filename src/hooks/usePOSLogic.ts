import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    RootState, AppDispatch,
    processSale, setActiveSession, setTaxMode, setActiveCounter,
    holdCurrentBill, resumeBill, discardHeldBill,
    removeFromCart, clearCart, incrementCounterBillNumber,
    addSession, removeSession, updateCartQty, updateCartLength,
    addToCart, setCustomer, lookupOrCreateCustomer,
    setPaymentMethod, setRedeemedPoints
} from '../store';
import { calculateLoyaltyPoints } from '../utils/loyalty';
import { Sale, Customer, CartItem, Session } from '../types/sales';
import { usePOSShortcuts } from './usePOSShortcuts';
import { useBranchResolver } from './useBranchResolver';
import { useAppSettings } from './useAppSettings';
import { printSaleReceipt } from '../utils/printService';
import { Sector, TaxMode, PaymentMethod } from '../types/common';
import { db } from '../services/db';
import { SyncManager } from '../services/SyncManager';

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
    const { sessions, activeSessionIndex, customers, heldBills, activeCounterId } = useSelector((state: RootState) => state.pos);
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
    const [isCategoryBrowserOpen, setIsCategoryBrowserOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const posContainerRef = useRef<HTMLDivElement>(null);
    const { getBranchName } = useBranchResolver();

    useEffect(() => {
        const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    // --- User Terminal Sync ---
    useEffect(() => {
        if (user?.assignedCounterId && user.assignedCounterId !== activeCounterId) {
            dispatch(setActiveCounter(user.assignedCounterId));
        }
    }, [user, activeCounterId, dispatch]);

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            posContainerRef.current?.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    }, []);

    // --- Computed Totals ---
    const { cartSubtotal, taxAmount, cartTotal, redemptionAmount, finalTotal } = useMemo(() => {
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

        const rawTotal = subtotal + tax;
        const currentTenant = tenants.find(t => t.id === user?.tenantId);
        const redValue = currentTenant?.loyaltyConfig?.redemptionValue || 1;
        const redAmt = (activeSession.redeemedPoints || 0) * redValue;

        return {
            cartSubtotal: subtotal,
            taxAmount: tax,
            cartTotal: rawTotal,
            redemptionAmount: redAmt,
            finalTotal: Math.max(0, rawTotal - redAmt)
        };
    }, [cart, activeSession.taxMode, activeSession.redeemedPoints, tenants, user?.tenantId]);

    // --- Category Management ---
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ['All', ...Array.from(cats)].filter(Boolean);
    }, [products]);

    const getSubcategories = useCallback((category: string) => {
        const filtered = category === 'All'
            ? products
            : products.filter(p => p.category === category);
        const subCats = new Set(filtered.map(p => p.productType || p.subCategory));
        return Array.from(subCats).filter(Boolean) as string[];
    }, [products]);

    const allProductTypes = useMemo(() => {
        const types = new Set(products.map(p => p.productType || p.subCategory));
        return Array.from(types).filter(Boolean).sort();
    }, [products]);

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

    const loyaltyConfig = useMemo(() => {
        const relevantTenant = tenants.find(t => t.id === user?.tenantId);
        return relevantTenant?.loyaltyConfig;
    }, [tenants, user?.tenantId]);

    // --- Checkout Logic ---
    const handleCheckout = useCallback(async () => {

        if (cart.length === 0 || isProcessing) return;

        setIsProcessing(true);
        const isOnline = navigator.onLine;

        // Artificial delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 800));

        const currentBranchData = branches.find(b => b.id === currentBranch);
        const counter = currentBranchData?.counters?.find(c => c.id === activeCounterId);
        const nextBillNumber = (counter?.lastBillNumber || 0) + 1;
        const saleId = `${activeCounterId}-${nextBillNumber.toString().padStart(4, '0')}`;

        const sale: Sale = {
            id: saleId,
            date: new Date().toISOString(),
            items: cart,
            total: finalTotal,
            customerId: activeSession.customerId || undefined,
            sector: currentSector,
            branchId: currentBranch,
            counterId: activeCounterId,
            counterName: counter?.name || activeCounterId,
            taxMode: activeSession.taxMode,
            paymentMethod: activeSession.paymentMethod,
            status: isPreOrder ? 'PREORDER' : 'COMPLETED',
            paymentStatus: (['CASH', 'CARD', 'UPI'].includes(activeSession.paymentMethod)) ? 'PAID' : 'PENDING',
            userId: user?.id,
            redeemedPoints: activeSession.redeemedPoints,
            redemptionAmount: redemptionAmount
        };

        const currentTenant = tenants.find(t => t.id === user?.tenantId);
        if (currentTenant && sale.customerId) {
            const earned = calculateLoyaltyPoints(sale.items, currentTenant);
            if (earned > 0) sale.loyaltyPointsEarned = earned;
        }

        if (isOnline) {
            dispatch(processSale(sale));
            dispatch(incrementCounterBillNumber({ branchId: currentBranch, counterId: activeCounterId! }));
        } else {
            // Save to Offline Queue
            try {
                await db.offlineSales.add({
                    ...sale,
                    synced: false,
                    retryCount: 0
                });
                // Still update local Redux state for immediate consistency
                dispatch(processSale(sale));
                dispatch(incrementCounterBillNumber({ branchId: currentBranch, counterId: activeCounterId! }));
            } catch (err) {
                console.error('Failed to save offline sale:', err);
                alert('Critical Error: Could not save sale offline.');
                setIsProcessing(false);
                return;
            }
        }

        const tenantName = currentTenant ? currentTenant.name : 'Enterprise Mgr';
        const branchName = getBranchName(currentBranch);
        const branchAddress = branches.find(b => b.id === currentBranch)?.address || currentTenant?.companyDetails?.addressLine1 || 'No Address Provided';
        printSaleReceipt(sale, tenantName, branchName, branchAddress);

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

    // --- Session Switching ---
    const switchSession = useCallback((idx: number) => {
        dispatch(setActiveSession(idx));
    }, [dispatch]);

    // --- Global Shortcuts (via Hook) ---
    const shortcutHandlers = useMemo(() => ({
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
        onSwitchSession: (idx: number) => {
            if (idx < sessions.length) {
                switchSession(idx);
            }
        },
        onToggleView: () => {
            setViewMode(prev => prev === 'SCANNER' ? 'VISUAL' : 'SCANNER');
        },
        onNewSale: () => {
            if (cart.length > 0) {
                if (window.confirm('Clear current cart?')) {
                    dispatch(clearCart());
                    setTimeout(() => window.dispatchEvent(new CustomEvent('pos-focus-customer')), 100);
                }
            } else {
                window.dispatchEvent(new CustomEvent('pos-focus-customer'));
            }
        }
    }), [cart, sessions.length, handleCheckout, switchSession, dispatch]);

    usePOSShortcuts(shortcutHandlers);

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
        activeCounterName: branches.find(b => b.id === currentBranch)?.counters?.find(c => c.id === activeCounterId)?.name,
        activeCounterId,

        // Computed
        cartSubtotal,
        taxAmount,
        cartTotal,
        redemptionAmount,
        finalTotal,
        hasMultipleBranches,
        allBranches,
        products,
        loyaltyConfig,

        // Actions
        toggleFullScreen,
        setViewMode,
        setMobileTab,
        setIsPreOrder,
        setIsHeldBillsOpen,
        isCategoryBrowserOpen,
        setIsCategoryBrowserOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        handleCheckout,
        switchSession,
        addSession: () => dispatch(addSession()),
        removeSession: (idx: number) => dispatch(removeSession(idx)),
        onAddToCart: (item: CartItem) => dispatch(addToCart(item)),
        onRemoveFromCart: (id: string) => dispatch(removeFromCart(id)),
        onUpdateCartQty: (id: string, qty: number) => dispatch(updateCartQty({ id, qty })),
        onUpdateCartLength: (id: string, length: number) => dispatch(updateCartLength({ id, length })),
        onClearCart: () => dispatch(clearCart()),
        onSetCustomer: (id: string) => dispatch(setCustomer(id)),
        onLookupOrCreateCustomer: (phone: string, name?: string) => dispatch(lookupOrCreateCustomer(phone, name)),
        onHoldCurrentBill: (note?: string) => dispatch(holdCurrentBill({ note })),
        onSetTaxMode: (mode: TaxMode) => dispatch(setTaxMode(mode)),
        onSetPaymentMethod: (method: PaymentMethod) => dispatch(setPaymentMethod(method)),
        onSetRedeemedPoints: (points: number) => dispatch(setRedeemedPoints(points)),
        resumeBill: (id: string) => dispatch(resumeBill(id)),
        discardHeldBill: (id: string) => dispatch(discardHeldBill(id)),
        onSetActiveCounter: (id: string) => dispatch(setActiveCounter(id)),
        categories,
        getSubcategories,
        allProductTypes,
        dispatch,

        // Refs
        posContainerRef
    };
};

export type POSLogic = ReturnType<typeof usePOSLogic>;
