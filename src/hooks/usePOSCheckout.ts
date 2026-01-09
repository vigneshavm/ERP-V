import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch, processSale, incrementCounterBillNumber, setTaxMode } from '../store';
import { Sale, CartItem, Session } from '../types/sales';
import { Branch, Tenant } from '../types/tenant';
import { calculateLoyaltyPoints } from '../utils/loyalty';
import { printSaleReceipt } from '../utils/printService';
import { db } from '../services/db';
import { TaxMode } from '../types/common';

interface UsePOSCheckoutProps {
    cart: CartItem[];
    isProcessing: boolean;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    activeSession: Session;
    activeCounterId: string | null;
    currentBranch: string;
    currentSector: any;
    user: any;
    branches: Branch[];
    tenants: Tenant[];
    getBranchName: (id: string) => string;
    isPreOrder: boolean;
    setIsPreOrder: React.Dispatch<React.SetStateAction<boolean>>;
    finalTotal: number;
    redemptionAmount: number;
    defaultTaxMode: TaxMode;
}

export const usePOSCheckout = ({
    cart,
    isProcessing,
    setIsProcessing,
    activeSession,
    activeCounterId,
    currentBranch,
    currentSector,
    user,
    branches,
    tenants,
    getBranchName,
    isPreOrder,
    setIsPreOrder,
    finalTotal,
    redemptionAmount,
    defaultTaxMode
}: UsePOSCheckoutProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const handleCheckout = useCallback(async () => {
        if (cart.length === 0 || isProcessing) return;

        setIsProcessing(true);
        const isOnline = navigator.onLine;

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
            counterId: activeCounterId!,
            counterName: counter?.name || activeCounterId!,
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
            try {
                await db.offlineSales.add({
                    ...sale,
                    synced: false,
                    retryCount: 0
                });
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
    }, [
        cart, isProcessing, activeSession, activeCounterId, currentBranch,
        currentSector, user, branches, tenants, getBranchName, isPreOrder,
        finalTotal, redemptionAmount, defaultTaxMode, dispatch, setIsProcessing, setIsPreOrder
    ]);

    return { handleCheckout };
};
