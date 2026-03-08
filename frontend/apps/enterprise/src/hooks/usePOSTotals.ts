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
        const currentTenant = tenants.find(t => t.id === userId); // Note: Original used user?.tenantId which I'll pass as userId for context if needed, or better, pass tenantId directly.
        // Actually the original use: const currentTenant = tenants.find(t => t.id === user?.tenantId);

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
