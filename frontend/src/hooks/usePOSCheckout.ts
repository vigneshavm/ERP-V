import React, { useCallback, useRef } from 'react';
import { getSalesperson } from './useSalesperson';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { processSale } from '../redux/thunks/saleThunks';
import { incrementCounterBillNumber } from '../redux/slices/tenantSlice';
import { setTaxMode, clearCart, setCustomer, setRedeemedPoints } from '../redux/slices/posSlice';
import { Sale, CartItem, Session } from "../types/sales";
import { Branch, Tenant } from "../types/tenant";
import { DEFAULT_MIS_CONFIG } from "../types/tenant/mis";
import { calculateLoyaltyPoints } from "../utils/loyalty";
import { printSaleReceipt } from "../utils/printService";
import { TaxMode } from "../types/common";
import api from "../services/api";
import { buildPosInvoicePayload } from "../services/posInvoiceMapper";

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
    isSqlBilling?: boolean;
}

// crypto.randomUUID() only exists on secure origins (https / localhost); on a LAN http address it is
// undefined and Finalize Bill used to die silently before reaching the server.
const newIdempotencyKey = (): string => {
    const c: any = (globalThis as any).crypto;
    if (c?.randomUUID) return c.randomUUID();
    const b = new Uint8Array(16);
    if (c?.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    return Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
};

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
    onCheckoutSuccess,
    isSqlBilling = false
}: UsePOSCheckoutProps) => {
    const dispatch = useDispatch<AppDispatch>();

    // Same cart => same Idempotency-Key until the bill is saved, so a retry after a timeout or a second
    // click cannot save a second bill (the server returns the first one).
    const keyRef = useRef<{ sig: string; key: string } | null>(null);
    const keyForCart = (): string => {
        const sig = JSON.stringify([activeCounterId, cart.map(i => [i.id, i.qty, i.price, (i as any).cutLength, i.discountPercent]), activeSession.discountAmount, activeSession.paymentMethod, activeSession.taxMode]);
        if (!keyRef.current || keyRef.current.sig !== sig) keyRef.current = { sig, key: newIdempotencyKey() };
        return keyRef.current.key;
    };

    const runCheckout = useCallback(async () => {
        if (cart.length === 0 || isProcessing) return;

        // A bill needs a billing counter: its number is "<counter>-<seq>" and reports group by it.
        // Without one the bill used to be numbered "null-0001" and saved with no counter.
        if (!activeCounterId) {
            toast.error('Select a counter first — pick this till in the "Terminal" box at the top of the POS screen. (No counters listed? Add them in Settings → Branches.)', { position: 'top-center' });
            return;
        }
        if (isSqlBilling && !navigator.onLine) {
            toast.error('Connect to the shop database before billing. SQL counter bills require an online server price and return preview.', { position: 'top-center' });
            return;
        }

        // --- Discount Policy Enforcement (MIS Controls) ---
        // Blocks checkout client-side, before the receipt prints, rather than only
        // relying on the backend rejection -- processSale (redux/thunks/saleThunks.ts)
        // is optimistic (prints + records locally before the API call resolves), so a
        // server-side-only rejection would still let an over-cap sale print and queue
        // for silent retry. Mirrors backend/src/modules/sales/controllers/PosController.ts's
        // createInvoice check so both sides agree on the same policy.
        const discountAmount = activeSession.discountAmount || 0;
        let discountApprovedBy: string | undefined;
        if (!isSqlBilling && discountAmount > 0) {
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
        if (isSqlBilling && !isOnline) {
            toast.error('Connection to the shop database was lost before the bill could be saved. Reconnect and preview again.', { position: 'top-center', autoClose: false });
            setIsProcessing(false);
            return;
        }

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
            // Tell the cashier; this used to fail with only a console message, so "Finalize Bill"
            // appeared to do nothing.
            console.error("Critical: Cannot process sale. Missing Branch data.");
            toast.error("Can't complete the sale: no branch or business profile is set up for this shop.");
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
            idempotencyKey: keyForCart(),
            date: new Date().toISOString(),
            items: cart,
            total: isSqlBilling ? finalTotal + redemptionAmount : finalTotal,
            customerId: isSqlBilling ? undefined : activeSession.customerId || undefined,
            sector: currentSector,
            branchId: effectiveBranch.id, // Use resolved Branch ID
            counterId: activeCounterId!,
            counterName: counter?.name || activeCounterId!,
            salesmanCode: getSalesperson() || undefined,
            taxMode: activeSession.taxMode,
            paymentMethod: activeSession.paymentMethod,
            status: isPreOrder ? 'PREORDER' : 'COMPLETED',
            paymentStatus: (['CASH', 'CARD', 'UPI'].includes(activeSession.paymentMethod)) ? 'PAID' : 'PENDING',
            userId: user?.id,
            redeemedPoints: isSqlBilling ? 0 : activeSession.redeemedPoints,
            redemptionAmount: isSqlBilling ? 0 : redemptionAmount,
            discountAmount,
            discountApprovedBy,
            isMrpPending: activeSession.isMrpPending || false,
            mrpPendingNote: activeSession.mrpPendingNote
        };

        if (isSqlBilling) {
            try {
                const previewPayload = buildPosInvoicePayload(sale);
                const { data } = await api.post('/api/pos/invoice/preview', previewPayload);
                const serverTotal = Number(data?.preview?.total);
                if (!data?.success || !Number.isFinite(serverTotal)) {
                    throw new Error(data?.message || 'The shop database did not return a valid bill preview.');
                }
                const tillEstimate = sale.total;
                if (Math.abs(serverTotal - tillEstimate) >= 0.01) {
                    const accepted = window.confirm(
                        `Shop database total: ₹${serverTotal.toFixed(2)}\nTill estimate: ₹${tillEstimate.toFixed(2)}\n\nContinue with the shop database total?`,
                    );
                    if (!accepted) {
                        setIsProcessing(false);
                        return;
                    }
                }
                // Receipt and local sale now carry the same amount the shop database preview computed.
                sale.total = serverTotal;
                sale.expectedTotal = serverTotal;
            } catch (previewError: any) {
                const message = previewError?.response?.data?.message || previewError?.message || 'Could not preview this bill against the shop database.';
                toast.error(message, { position: 'top-center', autoClose: false });
                setIsProcessing(false);
                return;
            }
        }

        const currentTenant = effectiveTenant; // Use resolved Tenant
        if (!isSqlBilling && currentTenant && sale.customerId) {
            const earned = calculateLoyaltyPoints(sale.items, currentTenant);
            if (earned > 0) sale.loyaltyPointsEarned = earned;
        }

        if (isOnline) {
            // Wait for the server so the receipt carries its bill number (processSale swaps sale.id
            // for it); if the server can't be reached the provisional number stays and it's queued.
            try {
                await dispatch(processSale(sale));
            } catch (saveError: any) {
                toast.error(saveError?.response?.data?.message || saveError?.message || 'The bill changed after preview. Preview it again before saving.', { position: 'top-center', autoClose: false });
                setIsProcessing(false);
                return;
            }
            // Increment the counter on the RESOLVED branch
            keyRef.current = null; // saved: the next bill gets a fresh key
            dispatch(incrementCounterBillNumber({ branchId: effectiveBranch.id, counterId: activeCounterId! }));
        } else {
            try {
                // processSale queues the sale itself when offline; adding it here as well queued every
                // offline bill twice, so it was sent to the server twice once back online.
                await dispatch(processSale(sale));
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

        // Start the next bill empty. Nothing cleared the cart after a sale before, so the sold items
        // stayed on screen and could be billed again. (A sale the server rejects is queued for
        // retry by processSale, so it's recorded either way.)
        dispatch(clearCart());
        dispatch(setCustomer(null));
        dispatch(setRedeemedPoints(0));

        setIsProcessing(false);
        setIsPreOrder(false);

        if (onCheckoutSuccess) {
            onCheckoutSuccess(sale);
        }

        setTimeout(() => dispatch(setTaxMode(defaultTaxMode)), 100);
    }, [
        cart, isProcessing, activeSession, activeCounterId, currentBranch,
        currentSector, user, branches, tenants, getBranchName, isPreOrder,
        finalTotal, redemptionAmount, cartSubtotal, defaultTaxMode, dispatch, setIsProcessing, setIsPreOrder, onCheckoutSuccess, isSqlBilling
    ]);

    // Never fail silently: any unexpected error after the click is shown and unlocks the button.
    const handleCheckout = useCallback(async () => {
        try {
            await runCheckout();
        } catch (e: any) {
            console.error('Finalize Bill failed:', e);
            toast.error(`Finalize Bill failed: ${e?.message || e}`, { position: 'top-center', autoClose: false });
            setIsProcessing(false);
        }
    }, [runCheckout, setIsProcessing]);

    return { handleCheckout };
};
