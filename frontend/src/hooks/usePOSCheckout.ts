import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { processSale } from '../redux/thunks/saleThunks';
import { incrementCounterBillNumber } from '../redux/slices/tenantSlice';
import { setTaxMode } from '../redux/slices/posSlice';
import { Sale, CartItem, Session } from "../types/sales";
import { Branch, Tenant } from "../types/tenant";
import { DEFAULT_MIS_CONFIG } from "../types/tenant/mis";
import { calculateLoyaltyPoints } from "../utils/loyalty";
import { printSaleReceipt } from "../utils/printService";
import { db } from "../services/db";
import { TaxMode } from "../types/common";

// Roles allowed to approve a discount above the tenant's MIS Controls cap. Mirrors
// backend/src/modules/sales/controllers/PosController.ts's DISCOUNT_APPROVER_ROLES.
const DISCOUNT_APPROVER_ROLES = ['owner', 'co-owner', 'manager'];

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
    cartSubtotal: number;
    defaultTaxMode: TaxMode;
    onCheckoutSuccess?: (sale: Sale) => void;
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
    cartSubtotal,
    defaultTaxMode,
    onCheckoutSuccess
}: UsePOSCheckoutProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const handleCheckout = useCallback(async () => {
        if (cart.length === 0 || isProcessing) return;

        // --- Discount Policy Enforcement (MIS Controls) ---
        // Blocks checkout client-side, before the receipt prints, rather than only
        // relying on the backend rejection -- processSale (redux/thunks/saleThunks.ts)
        // is optimistic (prints + records locally before the API call resolves), so a
        // server-side-only rejection would still let an over-cap sale print and queue
        // for silent retry. Mirrors backend/src/modules/sales/controllers/PosController.ts's
        // createInvoice check so both sides agree on the same policy.
        const discountAmount = activeSession.discountAmount || 0;
        let discountApprovedBy: string | undefined;
        if (discountAmount > 0) {
            const effectiveTenantForPolicy = tenants.find(t => t.id === user?.tenantId) || tenants[0];
            const misConfig = { ...DEFAULT_MIS_CONFIG, ...(effectiveTenantForPolicy?.misConfig || {}) };
            const discountPercent = cartSubtotal > 0 ? (discountAmount / cartSubtotal) * 100 : 0;

            if (discountPercent > misConfig.maxDiscountPercent) {
                if (!misConfig.allowDiscountOverride) {
                    alert(`Discount of ${discountPercent.toFixed(1)}% exceeds the allowed maximum of ${misConfig.maxDiscountPercent}%. Discount override is disabled for this store.`);
                    return;
                }
                if (misConfig.requireApprovalForHighDiscount) {
                    if (user?.role && DISCOUNT_APPROVER_ROLES.includes(user.role)) {
                        // Current cashier already holds a manager/owner/co-owner role --
                        // self-approve rather than prompting for someone else's sign-off.
                        discountApprovedBy = user.id;
                    } else {
                        alert(`Discount of ${discountPercent.toFixed(1)}% exceeds the allowed maximum of ${misConfig.maxDiscountPercent}% and requires manager approval. Please have a manager, co-owner, or owner process this sale.`);
                        return;
                    }
                }
            }
        }

        setIsProcessing(true);
        const isOnline = navigator.onLine;

        await new Promise(resolve => setTimeout(resolve, 800));

        // --- Robust Data Resolution ---
        // 1. Resolve Tenant
        const effectiveTenant = tenants.find(t => t.id === user?.tenantId) || tenants[0];

        // 2. Resolve Branch
        let effectiveBranch = branches.find(b => b.id === currentBranch);

        // Fallback 1: If currentBranch is 'All' or invalid, try finding branch by activeCounterId
        if (!effectiveBranch && activeCounterId) {
            effectiveBranch = branches.find(b => b.counters?.some(c => c.id === activeCounterId));
        }

        // Fallback 2: Default to first branch if we have any
        if (!effectiveBranch && branches.length > 0) {
            effectiveBranch = branches[0];
        }

        // Fallback 3: Construct a virtual branch from Tenant details
        if (!effectiveBranch && effectiveTenant) {
            effectiveBranch = {
                id: 'virtual-default',
                name: effectiveTenant.name,
                city: effectiveTenant.companyDetails?.city || '',
                address: effectiveTenant.companyDetails?.addressLine1 || '',
                phone: effectiveTenant.companyDetails?.phone || '',
                config: {},
                isHeadOffice: true
            };
        }

        if (!effectiveBranch) {
            console.error("Critical: Cannot process sale. Missing Branch data.");
            setIsProcessing(false);
            return;
        }

        // Use the EFFECTIVE branch for bill numbering logic
        const currentBranchData = effectiveBranch;
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
            branchId: effectiveBranch.id, // Use resolved Branch ID
            counterId: activeCounterId!,
            counterName: counter?.name || activeCounterId!,
            taxMode: activeSession.taxMode,
            paymentMethod: activeSession.paymentMethod,
            status: isPreOrder ? 'PREORDER' : 'COMPLETED',
            paymentStatus: (['CASH', 'CARD', 'UPI'].includes(activeSession.paymentMethod)) ? 'PAID' : 'PENDING',
            userId: user?.id,
            redeemedPoints: activeSession.redeemedPoints,
            redemptionAmount: redemptionAmount,
            discountAmount,
            discountApprovedBy,
            isMrpPending: activeSession.isMrpPending || false,
            mrpPendingNote: activeSession.mrpPendingNote
        };

        const currentTenant = effectiveTenant; // Use resolved Tenant
        if (currentTenant && sale.customerId) {
            const earned = calculateLoyaltyPoints(sale.items, currentTenant);
            if (earned > 0) sale.loyaltyPointsEarned = earned;
        }

        if (isOnline) {
            dispatch(processSale(sale));
            // Increment the counter on the RESOLVED branch
            dispatch(incrementCounterBillNumber({ branchId: effectiveBranch.id, counterId: activeCounterId! }));
        } else {
            try {
                await db.offlineSales.add({
                    ...sale,
                    synced: false,
                    retryCount: 0
                });
                dispatch(processSale(sale));
                dispatch(incrementCounterBillNumber({ branchId: effectiveBranch.id, counterId: activeCounterId! }));
            } catch (err) {
                console.error('Failed to save offline sale:', err);
                alert('Critical Error: Could not save sale offline.');
                setIsProcessing(false);
                return;
            }
        }

        // Print Receipt using resolved data
        if (effectiveTenant && effectiveBranch) {
            const wasFullScreen = !!document.fullscreenElement;
            printSaleReceipt(sale, effectiveTenant, effectiveBranch, () => {
                if (wasFullScreen && !document.fullscreenElement) {
                    // This will need to be passed down or handled by a context, but since we are inside a hook, 
                    // we don't have direct access to `toggleFullScreen` unless passed in.
                    // However, standard `document.documentElement.requestFullscreen()` works if allowed.
                    document.documentElement.requestFullscreen().catch(err => console.log("Auto-restore fullscreen blocked:", err));
                }
            });
        } else {
            // Should not happen due to check above, but safe to keep
            console.error("Critical: Cannot print receipt. Missing Tenant or Branch data.", { effectiveTenant, effectiveBranch });
        }

        // --- CX Feedback Trigger ---
        if (sale.customerId && sale.status === 'COMPLETED') {
            console.log(`[CX Intelligence] Triggering feedback request for Sale: ${sale.id} to Customer: ${sale.customerId}`);
            // Logic to send WhatsApp/Email/SMS with Feedback Link
            // In a real system: await FeedbackService.sendRequest(sale);
        }

        setIsProcessing(false);
        setIsPreOrder(false);

        if (onCheckoutSuccess) {
            onCheckoutSuccess(sale);
        }

        setTimeout(() => dispatch(setTaxMode(defaultTaxMode)), 100);
    }, [
        cart, isProcessing, activeSession, activeCounterId, currentBranch,
        currentSector, user, branches, tenants, getBranchName, isPreOrder,
        finalTotal, redemptionAmount, cartSubtotal, defaultTaxMode, dispatch, setIsProcessing, setIsPreOrder, onCheckoutSuccess
    ]);

    return { handleCheckout };
};
