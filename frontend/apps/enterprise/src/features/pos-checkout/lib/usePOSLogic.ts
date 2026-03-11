import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import { usePOSCart } from './usePOSCart';
import { usePOSSession } from './usePOSSession';
import {
    setCustomer,
    setPaymentMethod,
    setTaxMode,
    setRedeemedPoints,
    setActiveCounter,
    createInvoice
} from "@/entities/sales/model/posSlice";
import { AppView } from '@repo/shared';

export interface POSLogic {
    user: any;
    currentSector: string;
    currentBranch: string;
    sessions: any[];
    activeSessionIndex: number;
    activeSession: any;
    cart: any[];
    activeCustomer: any;
    customers: any[];
    heldBills: any[];
    isFullScreen: boolean;
    viewMode: 'SCANNER' | 'VISUAL';
    mobileTab: 'MAIN' | 'CART';
    isProcessing: boolean;
    isPreOrder: boolean;
    isReturnMode: boolean;
    isHeldBillsOpen: boolean;
    cartSubtotal: number;
    taxAmount: number;
    cartTotal: number;
    redemptionAmount: number;
    finalTotal: number;
    hasMultipleBranches: boolean;
    products: any[];
    loyaltyConfig: any;
    toggleFullScreen: () => void;
    setViewMode: (mode: 'SCANNER' | 'VISUAL') => void;
    setMobileTab: (tab: 'MAIN' | 'CART') => void;
    setIsPreOrder: (isPre: boolean) => void;
    setIsReturnMode: (isReturn: boolean) => void;
    setIsHeldBillsOpen: (isOpen: boolean) => void;
    handleCheckout: () => Promise<void>;
    activeCounterId: string;
    activeCounterName: string;
    onAddToCart: (product: any) => void;
    onRemoveFromCart: (id: string) => void;
    onUpdateCartQty: (id: string, qty: number) => void;
    onUpdateCartLength: (id: string, length: number) => void;
    onSetCustomer: (customer: any) => void;
    onLookupOrCreateCustomer: (query: string) => Promise<any>;
    onSetTaxMode: (mode: 'Inclusive' | 'Exclusive') => void;
    onSetPaymentMethod: (method: string) => void;
    onSetRedeemedPoints: (points: number) => void;
    onSetActiveCounter: (counterId: string) => void;
    switchSession: (idx: number) => void;
    addSession: () => void;
    removeSession: (idx: number) => void;
    resumeBill: (id: string) => void;
    discardHeldBill: (id: string) => void;
    isCategoryBrowserOpen: boolean;
    setIsCategoryBrowserOpen: (isOpen: boolean) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    categories: string[];
    getSubcategories: (category: string) => string[];
    allProductTypes: string[];
    posContainerRef: any;
    onClearCart: () => void;
    lastBill: any;
    reprintLastBill: () => void;
    downloadLastBill: () => void;
    allBranches: any[];
}

export const usePOSLogic = (): POSLogic => {
    const dispatch = useDispatch<AppDispatch>();
    const {
        sessions,
        activeSessionIndex,
        heldBills,
        invoice: lastBill, // Changed from lastBill to invoice: lastBill
        customers,
        isLoading: isProcessing // Changed from isProcessing to isLoading: isProcessing
    } = useSelector((state: RootState) => state.pos);

    const { items: products, categories } = useSelector((state: RootState) => state.inventory); // New selector
    const { branches: allBranches } = useSelector((state: RootState) => state.tenant); // New selector

    const { user, currentSector, currentBranch } = useSelector((state: RootState) => state.auth); // Consolidated auth selector

    const activeCounterId = useSelector((state: RootState) => state.pos.activeCounterId || 'C1'); // New selector
    const activeCounterName = useMemo(() => {
        const branch = allBranches.find(b => b.name === currentBranch || b.id === currentBranch);
        return branch?.counters?.find((c: any) => c.id === activeCounterId)?.name || 'Main Counter';
    }, [allBranches, currentBranch, activeCounterId]);

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [viewMode, setViewMode] = useState<'SCANNER' | 'VISUAL'>('SCANNER');
    const [mobileTab, setMobileTab] = useState<'MAIN' | 'CART'>('MAIN');
    const [isPreOrder, setIsPreOrder] = useState(false);
    const [isReturnMode, setIsReturnMode] = useState(false);
    const [isHeldBillsOpen, setIsHeldBillsOpen] = useState(false);
    const [isCategoryBrowserOpen, setIsCategoryBrowserOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const posContainerRef = useRef<HTMLDivElement>(null);

    const {
        cart,
        addItem,
        removeItem,
        updateQty,
        updateLength,
        clear
    } = usePOSCart(activeSessionIndex);

    const {
        activeSession,
        switchSession,
        addNewSession,
        removeSessionByIdx,
        holdBill,
        resumeHeldBill,
        discardBill
    } = usePOSSession();

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            posContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) { // Added check for exitFullscreen
                document.exitFullscreen();
            }
            setIsFullScreen(false);
        }
    }, []);

    const cartSubtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.qty * (item.cost || 0)), 0); // Added (item.cost || 0)
    }, [cart]);

    const taxAmount = useMemo(() => {
        return cartSubtotal * 0.18;
    }, [cartSubtotal]);

    const cartTotal = useMemo(() => {
        return cartSubtotal + (activeSession?.taxMode === 'EXCLUSIVE' ? taxAmount : 0); // Changed 'Exclusive' to 'EXCLUSIVE'
    }, [cartSubtotal, taxAmount, activeSession?.taxMode]);

    const redemptionAmount = useMemo(() => {
        return (activeSession?.redeemedPoints || 0) * 1; // Simplified loyaltyConfig usage
    }, [activeSession?.redeemedPoints]);

    const finalTotal = useMemo(() => {
        return cartTotal - redemptionAmount;
    }, [cartTotal, redemptionAmount]);

    const handleCheckout = useCallback(async () => {
        // Map UI labels to API expected labels if needed
        await dispatch(createInvoice({})); // Changed processCheckout to createInvoice
    }, [dispatch]);

    const onLookupOrCreateCustomer = useCallback(async (query: string) => {
        return customers.find(c => c.phone === query || c.name?.toLowerCase().includes(query.toLowerCase())); // Added optional chaining for name
    }, [customers]);

    const getSubcategories = useCallback((category: string) => {
        return [];
    }, []);

    return {
        user,
        currentSector: currentSector || 'Retail', // Added default value
        currentBranch: currentBranch || 'Main', // Added default value
        sessions,
        activeSessionIndex,
        activeSession,
        cart,
        activeCustomer: activeSession?.customerId, // Changed to customerId
        customers,
        heldBills,
        isFullScreen,
        viewMode,
        mobileTab,
        isProcessing,
        isPreOrder,
        isReturnMode,
        isHeldBillsOpen,
        cartSubtotal,
        taxAmount,
        cartTotal,
        redemptionAmount,
        finalTotal,
        hasMultipleBranches: allBranches.length > 1,
        products,
        loyaltyConfig: { pointValue: 1 }, // Simplified loyaltyConfig
        toggleFullScreen,
        setViewMode,
        setMobileTab,
        setIsPreOrder,
        setIsReturnMode,
        setIsHeldBillsOpen,
        handleCheckout,
        activeCounterId,
        activeCounterName,
        onAddToCart: (product) => addItem(product, isReturnMode),
        onRemoveFromCart: removeItem,
        onUpdateCartQty: updateQty,
        onUpdateCartLength: updateLength,
        onSetCustomer: (customer) => dispatch(setCustomer(customer?.id || customer)), // Added customer?.id || customer
        onLookupOrCreateCustomer,
        onSetTaxMode: (mode) => dispatch(setTaxMode(mode.toUpperCase() as any)), // Changed toUpperCase
        onSetPaymentMethod: (method) => dispatch(setPaymentMethod(method.toUpperCase() as any)), // Changed toUpperCase
        onSetRedeemedPoints: (points) => dispatch(setRedeemedPoints(points)),
        onSetActiveCounter: (counterId) => dispatch(setActiveCounter(counterId)),
        switchSession,
        addSession: addNewSession,
        removeSession: removeSessionByIdx,
        resumeBill: resumeHeldBill,
        discardHeldBill: discardBill,
        isCategoryBrowserOpen,
        setIsCategoryBrowserOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        categories,
        getSubcategories,
        allProductTypes: [], // Changed to empty array
        posContainerRef,
        onClearCart: clear,
        lastBill,
        reprintLastBill: () => console.log('Reprint not implemented'), // Mocked
        downloadLastBill: () => console.log('Download not implemented'), // Mocked
        allBranches
    };
};

