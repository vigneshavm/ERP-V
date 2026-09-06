import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
    setActiveCounter,
    setCustomer,
    setTaxMode, setPaymentMethod, setRedeemedPoints, setDiscountAmount, setMrpPending
} from "../redux/slices/posSlice";
import { DEFAULT_MIS_CONFIG } from "../types/tenant/mis";
import { lookupOrCreateCustomer } from "../redux/thunks/customerThunks";
import { fetchMasterEntries } from "../redux/slices/masterDataSlice";
import { RootState, AppDispatch } from "../redux/store";
import { Sale, Customer, CartItem } from "../types/sales";
import { usePOSShortcuts } from './usePOSShortcuts';
import { useBranchResolver } from './useBranchResolver';
import { useAppSettings } from './useAppSettings';
import { printSaleReceipt, downloadSaleReceiptPDF } from "../utils/printService";
import { TaxMode, PaymentMethod } from "../types/common";

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
import { useBarcodeScanner } from './useBarcodeScanner';
import api from '../services/api';

export const usePOSLogic = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { tenants, branches } = useSelector((state: RootState) => state.tenant);
    const { items: products } = useSelector((state: RootState) => state.inventory);
    const { customers, activeCounterId } = useSelector((state: RootState) => state.pos);
    const { entriesByType } = useSelector((state: RootState) => state.masterData);

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
    const _isBranchAll = currentBranch === 'All';

    // Minimal wholesale/retail billing path: a customer is "wholesale" when their assigned
    // customer group's name matches "wholesale" (same substring convention CustomerGroups.tsx's
    // getGroupIcon already uses), rather than adding a separate flag/UI toggle. When active,
    // cart items use Item.wholesaleRate instead of sellingPrice (see resolveItemPrice below),
    // and the group's existing meta.discountPercent (set on the Customer Groups screen) can be
    // applied to the bill with one click via onApplyWholesaleDiscount.
    useEffect(() => {
        dispatch(fetchMasterEntries({ type: 'CUSTOMER_GROUP' }) as any);
    }, [dispatch]);

    const activeCustomerGroup = useMemo(() => {
        const groupId = (activeCustomer as any).groupId;
        if (!groupId) return null;
        return (entriesByType.CUSTOMER_GROUP || []).find(g => g._id === groupId) || null;
    }, [activeCustomer, entriesByType.CUSTOMER_GROUP]);

    const isWholesaleCustomer = !!activeCustomerGroup && /wholesale/i.test(activeCustomerGroup.name);
    const wholesaleDiscountPercent = activeCustomerGroup?.meta?.discountPercent || 0;

    const resolveItemPrice = useCallback((item: any) => {
        if (isWholesaleCustomer && item.wholesaleRate) return item.wholesaleRate;
        return item.price ?? item.sellingPrice;
    }, [isWholesaleCustomer]);

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

    // MIS Controls (Settings -> MIS Controls) discount policy, resolved from the tenant
    // record the same way loyaltyConfig above is -- falls back to DEFAULT_MIS_CONFIG so a
    // tenant that's never saved this tab still gets the same defaults Settings shows them.
    const misConfig = useMemo(() => {
        const relevantTenant = tenants.find(t => t.id === user?.tenantId);
        return { ...DEFAULT_MIS_CONFIG, ...(relevantTenant?.misConfig || {}) };
    }, [tenants, user?.tenantId]);

    const { handleCheckout } = usePOSCheckout({
        cart, isProcessing, setIsProcessing, activeSession, activeCounterId: activeCounterId || null,
        currentBranch: currentBranch || '', currentSector: currentSector || '', user: user as any, branches, tenants, getBranchName,
        isPreOrder, setIsPreOrder, finalTotal, redemptionAmount, cartSubtotal, defaultTaxMode,
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

    // Product Type master list for POS Quick Entry (billing an item with no
    // barcode). This used to be a static, hardcoded array (data/productTypes.ts)
    // shown to every tenant regardless of their actual business — a Pharmacy
    // or Electronics tenant would still see Saree/Dhothie/Lungi options, and
    // even after that was replaced with the live sector API, every tenant in
    // a sector still saw the FULL 114-item master list whether or not they'd
    // actually chosen to use each category. Now it's fetched from the merged,
    // tenant-scoped endpoint (GET /api/inventory/categories) and filtered to
    // isRegistered === true, so Quick Entry only offers Product Types the
    // tenant has actually added to their own Categories via Category Manager
    // or Settings -> General "Add Selected to My Categories" — the same
    // "registered" set that Settings' checklist shows as "Added".
    const [dynamicProductTypes, setDynamicProductTypes] = useState<
        { name: string; gstRate?: number; defaultUnit?: string }[]
    >([]);

    // ProductCategoryModel stores defaultUnit as the same lowercase short code
    // used elsewhere on Item.unit ('pcs'/'kg'/'l'/'box'/'unit'/'mtr'/'set'),
    // but POSCartGrid's Quick Entry logic was built against productTypes.ts's
    // Title-case unit labels ('Piece'/'Meter'/'Set'/'Kg') -- e.g. it checks
    // `defaultUnit === 'Meter'` to decide whether to show the cut-length field.
    // Translate at the boundary so that existing comparison keeps working.
    const UNIT_LABELS: Record<string, string> = {
        pcs: 'Piece', mtr: 'Meter', set: 'Set', kg: 'Kg', l: 'Liter', box: 'Box', unit: 'Piece'
    };
    const toUnitLabel = (unit?: string) => {
        if (!unit) return 'Piece';
        return UNIT_LABELS[unit.toLowerCase()] || (unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase());
    };

    // Resolution chain, each step a react-query query rather than a plain
    // useEffect + fetch: under React.StrictMode (enabled in main.tsx), a
    // plain effect's fetch body runs twice on mount (mount -> cleanup ->
    // mount again), firing a genuine duplicate network request each time --
    // exactly what happened here before this rewrite (visible in DevTools
    // as duplicate `settings` / `business-sectors` / `categories` calls).
    // react-query dedupes concurrent requests sharing a queryKey against its
    // cache, so the StrictMode double-mount reuses one in-flight request
    // instead of firing two. This matches the pattern already used by
    // useFinanceSync.ts and useTenantData.ts elsewhere in this codebase.

    // Deliberately NOT sourced from `tenants` (state.tenant.tenants): on the
    // POS page that array is populated by useTenantData.ts from GET
    // /api/business/profile, whose hand-built tenant object never includes
    // businessType/sector at all (see tenantQueries.ts). Those fields only
    // land in `tenants` via a separate merge that runs when Settings ->
    // General has been fetched/saved in the SAME session -- so a user who
    // opens POS without ever visiting Settings first got an empty Product
    // Type list with no request even attempted. Going straight to GET
    // /api/settings (the same source Settings itself reads) makes this
    // reliable regardless of navigation order.
    const { data: tenantSettings } = useQuery({
        queryKey: ['pos-tenant-settings', user?.tenantId],
        queryFn: () => api.get('/api/settings').then(res => res.data?.data || {}),
        enabled: !!user?.tenantId,
    });
    const settingsSector: string | undefined = tenantSettings?.sector || undefined;
    const settingsBusinessType: string | undefined = tenantSettings?.businessType || undefined;

    // tenant.sector (the short code, e.g. 'Textile') hasn't been backfilled
    // for every tenant -- Settings -> General only resolves and saves it
    // when the Business Sector dropdown value is actually *changed*, so a
    // tenant whose businessType was set before that logic existed (or who
    // has never touched the dropdown since) can have businessType populated
    // with sector left blank. Resolve it the same way Settings.tsx does,
    // only when GET /api/settings didn't already give us a sector.
    const { data: businessSectors } = useQuery({
        queryKey: ['business-sectors'],
        queryFn: () => api.get('/api/business-sectors').then(res => res.data?.data || []),
        enabled: !settingsSector && !!settingsBusinessType,
    });
    const resolvedSector: string | undefined = settingsSector
        || (businessSectors || []).find((s: any) => s.name === settingsBusinessType)?.shortCode
        || undefined;

    const { data: registeredCategoryRows } = useQuery({
        queryKey: ['pos-registered-categories', resolvedSector],
        queryFn: () => api.get('/api/inventory/categories', { params: { page: 1, limit: 100000, sector: resolvedSector } })
            .then(res => res.data?.data || []),
        enabled: !!resolvedSector,
    });

    useEffect(() => {
        if (!resolvedSector || !registeredCategoryRows) {
            // No configured Business Sector at all, or the categories query
            // hasn't resolved yet -- leaving the list empty (not fabricating
            // one) is the honest result until Settings -> General has a
            // sector set and the request completes.
            setDynamicProductTypes([]);
            return;
        }
        setDynamicProductTypes(
            registeredCategoryRows
                // Only categories the tenant has actually registered
                // (Category Manager, or Settings' "Add Selected to My
                // Categories") -- not every name the sector's shared
                // master list happens to offer.
                .filter((c: any) => c.isRegistered && c.status !== 'ARCHIVED')
                .map((c: any) => ({
                    name: c.name,
                    gstRate: c.gstRate,
                    defaultUnit: toUnitLabel(c.defaultUnit)
                }))
        );
    }, [resolvedSector, registeredCategoryRows]);

    // Name -> {gstRate, defaultUnit} lookup for Quick Entry's GST/unit
    // auto-fill, replacing POSCartGrid's own direct import of the old static
    // productTypes.ts array.
    const productTypeDetails = useMemo(() => {
        const map: Record<string, { gstRate?: number; defaultUnit?: string }> = {};
        for (const pt of dynamicProductTypes) {
            map[pt.name] = { gstRate: pt.gstRate, defaultUnit: pt.defaultUnit };
        }
        return map;
    }, [dynamicProductTypes]);

    // Merge inventory product types (already on real Items) with the dynamic
    // sector Product Type catalog above.
    const allProductTypes = useMemo(() => {
        const inventoryTypes = new Set(products.map(p => p.productType || p.subCategory || p.category));
        const categoryTypes = dynamicProductTypes.map(pt => pt.name);
        const combined = new Set([...inventoryTypes, ...categoryTypes]);
        return Array.from(combined).filter(Boolean).sort() as string[];
    }, [products, dynamicProductTypes]);

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

    // --- Barcode Scanner Logic ---
    const handleBarcodeScan = useCallback(async (barcode: string) => {
        try {
            // First try to find it locally in already loaded products
            const localProduct = products.find(p => p.barcode === barcode);
            
            if (localProduct) {
                addItem({
                    ...localProduct,
                    id: localProduct.id || localProduct._id || '',
                    qty: 1,
                    price: resolveItemPrice(localProduct),
                    taxMode: localProduct.taxMode || defaultTaxMode
                }, isReturnMode);
                return;
            }

            // If not found locally, query the backend
            const res = await api.get(`/inventory/barcode/${barcode}`);
            if (res.data) {
                const item = res.data;
                addItem({
                    ...item,
                    id: item._id || item.id,
                    qty: 1,
                    price: resolveItemPrice(item),
                    taxMode: item.taxMode || defaultTaxMode
                }, isReturnMode);
            }
        } catch {
            console.warn('Barcode not found:', barcode);
            // Optional: Play an error beep or show toast
            alert(`Product with barcode ${barcode} not found!`);
        }
    }, [products, addItem, isReturnMode, defaultTaxMode, resolveItemPrice]);

    useBarcodeScanner({ onScan: handleBarcodeScan });

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
        misConfig,
        discountAmount: activeSession.discountAmount || 0,
        isMrpPending: activeSession.isMrpPending || false,
        mrpPendingNote: activeSession.mrpPendingNote || '',

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
        onAddToCart: (item: CartItem) => addItem({ ...item, price: resolveItemPrice(item) }, isReturnMode),
        isWholesaleCustomer,
        wholesaleDiscountPercent,
        onApplyWholesaleDiscount: () => dispatch(setDiscountAmount(Math.round(cartSubtotal * wholesaleDiscountPercent) / 100)),
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
        onSetDiscountAmount: (amount: number) => dispatch(setDiscountAmount(amount)),
        onSetMrpPending: (pending: boolean, note?: string) => dispatch(setMrpPending({ isMrpPending: pending, note })),
        resumeBill: sessionManager.resumeHeldBill,
        discardHeldBill: sessionManager.discardBill,
        onSetActiveCounter: (id: string) => dispatch(setActiveCounter(id)),
        categories,
        getSubcategories,
        allProductTypes,
        productTypeDetails,
        dispatch,
        lastBill,
        reprintLastBill,
        downloadLastBill,

        // Refs
        posContainerRef
    };
};

export type POSLogic = ReturnType<typeof usePOSLogic>;

