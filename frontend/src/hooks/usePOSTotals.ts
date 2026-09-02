import { useMemo } from 'react';
import { Session, CartItem } from "../types/sales";
import { Tenant } from "../types/tenant";

interface UsePOSTotalsProps {
    cart: CartItem[];
    activeSession: Session;
    tenants: Tenant[];
    userId?: string;
}

export const usePOSTotals = ({ cart, activeSession, tenants, userId }: UsePOSTotalsProps) => {
    const totals = useMemo(() => {
        let subtotal = 0;
        let tax = 0;

        cart.forEach(item => {
            // ?? not || — a genuinely 0%-GST item must stay 0%, not fall back to 18%
            const gstRate = (item.gstPercentage ?? 18) / 100;
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
        // userId is the tenant id here (see usePOSTotals call site) — kept as a distinct prop
        // name from tenantId since some callers pass user?.tenantId directly.
        const currentTenant = tenants.find(t => t.id === userId);

        const redValue = currentTenant?.loyaltyConfig?.redemptionValue || 1;
        const redAmt = (activeSession.redeemedPoints || 0) * redValue;

        return {
            cartSubtotal: subtotal,
            taxAmount: tax,
            cartTotal: rawTotal,
            redemptionAmount: redAmt,
            finalTotal: Math.max(0, rawTotal - redAmt)
        };
    }, [cart, activeSession.taxMode, activeSession.redeemedPoints, tenants, userId]);

    return totals;
};
