import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    setActiveCounter,
    clearCart,
    setCustomer,
    setTaxMode, setPaymentMethod, setRedeemedPoints
} from "../redux/slices/posSlice";
import { lookupOrCreateCustomer } from "../redux/thunks/customerThunks";
import { RootState, AppDispatch } from "../redux/store";
import { calculateLoyaltyPoints } from "../utils/loyalty";
import { Sale, Customer, CartItem, Session } from "../types/sales";
import { usePOSShortcuts } from './usePOSShortcuts';
import { useBranchResolver } from './useBranchResolver';
import { useAppSettings } from './useAppSettings';
import { printSaleReceipt, downloadSaleReceiptPDF } from "../utils/printService";
import { Sector, TaxMode, PaymentMethod } from "../types/common";
import { db } from "../services/db";
import { SyncManager } from "../services/SyncManager";
import { productTypes } from '../data/demo/productTypes';

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
    totalSpent: 0,
    dues: 0
};

import { usePOSUIState } from './usePOSUIState';
import { usePOSTotals } from './usePOSTotals';
import { usePOSCheckout } from './usePOSCheckout';
import { usePOSCart } from './pos/usePOSCart';
import { usePOSSession } from './pos/usePOSSession';

export const usePOSLogic = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { tenants, branches } = useSelector((state: RootState) => state.tenant);
    const { items: products } = useSelector((state: RootState) => state.inventory);
    const { customers, activeCounterId } = useSelector((state: RootState) => state.pos);

    // -- Composed Hooks --
    const sessionManager = usePOSSession();
    const { activeSession, sessions, switchSession, activeSessionIndex, heldBills } = sessionManager;

    // Pass activeSessionIndex to cart hook
    const cartManager = usePOSCart(activeSessionIndex);
    const { cart, addItem, removeItem, updateQty, updateLength, clear: clearCartAction } = cartManager;

    const settings = useAppSettings();
    const { defaultTaxMode } = settings;

    const activeCustomerId = activeSession.customerId;
    const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0] || DEFAULT_CUSTOMER;
    const isBranchAll = currentBranch === 'All';

    const { isFullScreen, setViewMode, mobileTab, setMobileTab, viewMode,
        isProcessing, setIsProcessing, isPreOrder, setIsPreOrder,
        isHeldBillsOpen, setIsHeldBillsOpen, isCategoryBrowserOpen, setIsCategoryBrowserOpen,
        isMobileMenuOpen, setIsMobileMenuOpen, isReturnMode, setIsReturnMode, posContainerRef, toggleFullScreen
    } = usePOSUIState();

    const [lastBill, setLastBill] = useState<Sale | null>(null);

    useEffect(() => {
        if (activeCounterId) {
            const stored = localStorage.getItem(`POS_LAST_BILL_${activeCounterId}`);
            if (stored) {
                try {
                    setLastBill(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to load last bill", e);
                }
            } else {
                setLastBill(null);
            }
        }
    }, [activeCounterId]);

    const handleCheckoutSuccess = useCallback((sale: Sale) => {
        setLastBill(sale);
        if (activeCounterId) {
            localStorage.setItem(`POS_LAST_BILL_${activeCounterId}`, JSON.stringify(sale));
        }
    }, [activeCounterId]);

    const reprintLastBill = useCallback(() => {
        if (!lastBill) return;
        const effectiveTenant = tenants.find(t => t.id === user?.tenantId) || tenants[0];
        const effectiveBranch = branches.find(b => b.id === currentBranch) || branches[0];
        if (effectiveTenant && effectiveBranch) {
            const wasFullScreen = !!document.fullscreenElement;
            printSaleReceipt(lastBill, effectiveTenant, effectiveBranch, () => {
                if (wasFullScreen && !document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => console.log("Auto-restore fullscreen blocked:", err));
                }
            });
        }
    }, [lastBill, tenants, branches, user, currentBranch]);

    const downloadLastBill = useCallback(() => {
        if (!lastBill) return;
        const effectiveTenant = tenants.find(t => t.id === user?.tenantId) || tenants[0];
        const effectiveBranch = branches.find(b => b.id === currentBranch) || branches[0];
        if (effectiveTenant && effectiveBranch) {
            downloadSaleReceiptPDF(lastBill, effectiveTenant, effectiveBranch);
        }
    }, [lastBill, tenants, branches, user, currentBranch]);

    const { getBranchName } = useBranchResolver();

    const { cartSubtotal, taxAmount, cartTotal, redemptionAmount, finalTotal } = usePOSTotals({
        cart,
        activeSession,
        tenants,
        userId: user?.tenantId
    });

    const { handleCheckout } = usePOSCheckout({
        cart, isProcessing, setIsProcessing, activeSession, activeCounterId,
        currentBranch, currentSector, user, branches, tenants, getBranchName,
        isPreOrder, setIsPreOrder, finalTotal, redemptionAmount, defaultTaxMode,
        onCheckoutSuccess: (sale) => {
            handleCheckoutSuccess(sale);
        }
    });

    // --- User Terminal Sync ---
    useEffect(() => {
        if (user?.assignedCounterId && user.assignedCounterId !== activeCounterId) {
            dispatch(setActiveCounter(user.assignedCounterId));
        }
    }, [user, activeCounterId, dispatch]);

    // --- Category Management ---
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ['All', ...Array.from(cats)].filter(Boolean);
    }, [products]);

    const getSubcategories = useCallback((category: string) => {
        const filtered = category === 'All'
            ? products
            : products.filter(p => p.category === category);
        const subCats = new Set(filtered.map(p => p.productType || p.subCategory || p.category));
        return Array.from(subCats).filter(Boolean) as string[];
    }, [products]);

    // Merge inventory product types with productTypes from ItemCategories
    const allProductTypes = useMemo(() => {
        const inventoryTypes = new Set(products.map(p => p.productType || p.subCategory || p.category));
        const categoryTypes = productTypes.map(pt => pt.name);
        const combined = new Set([...inventoryTypes, ...categoryTypes]);
        return Array.from(combined).filter(Boolean).sort() as string[];
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
    const shortcutHandlers = useMemo(() => ({
        onSearchProduct: () => {
            window.dispatchEvent(new CustomEvent('pos-focus-search'));
        },
        onSearchCustomer: () => {
            window.dispatchEvent(new CustomEvent('pos-focus-customer'));
        },
        onHoldBill: () => {
            if (cart.length > 0) {
                sessionManager.holdBill('Hold via Shortcut');
                alert('Bill Held Successfully!');
            } else {
                setIsHeldBillsOpen(true);
            }
        },
        onCheckout: handleCheckout,
        onDelete: () => {
            if (cart.length > 0) {
                removeItem(cart[cart.length - 1].id);
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
                    clearCartAction();
                    setTimeout(() => window.dispatchEvent(new CustomEvent('pos-focus-customer')), 100);
                }
            } else {
                window.dispatchEvent(new CustomEvent('pos-focus-customer'));
            }
        }
    }), [cart, sessions.length, handleCheckout, switchSession, dispatch, setViewMode, setIsHeldBillsOpen, sessionManager, removeItem, clearCartAction]);

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
        isReturnMode,
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
        setIsReturnMode,
        setIsHeldBillsOpen,
        isCategoryBrowserOpen,
        setIsCategoryBrowserOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        handleCheckout,
        switchSession,
        addSession: sessionManager.addNewSession,
        removeSession: sessionManager.removeSessionByIdx,
        onAddToCart: (item: CartItem) => addItem(item, isReturnMode),
        onRemoveFromCart: removeItem,
        onUpdateCartQty: updateQty,
        onUpdateCartLength: updateLength,
        onClearCart: clearCartAction,
        onSetCustomer: (id: string) => dispatch(setCustomer(id)),
        onLookupOrCreateCustomer: (phone: string, name?: string) => (dispatch as any)(lookupOrCreateCustomer(phone, name)),
        onHoldCurrentBill: sessionManager.holdBill,
        onSetTaxMode: (mode: TaxMode) => dispatch(setTaxMode(mode)),
        onSetPaymentMethod: (method: PaymentMethod) => dispatch(setPaymentMethod(method)),
        onSetRedeemedPoints: (points: number) => dispatch(setRedeemedPoints(points)),
        resumeBill: sessionManager.resumeHeldBill,
        discardHeldBill: sessionManager.discardBill,
        onSetActiveCounter: (id: string) => dispatch(setActiveCounter(id)),
        categories,
        getSubcategories,
        allProductTypes,
        dispatch,
        lastBill,
        reprintLastBill,
        downloadLastBill,

        // Refs
        posContainerRef
    };
};

export type POSLogic = ReturnType<typeof usePOSLogic>;

