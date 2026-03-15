import { CartItem } from "@repo/shared";

/**
 * Calculates loyalty points based on cart items and tenant configuration.
 * Basic implementation: 1 point per 100 units of currency.
 */
export const calculateLoyaltyPoints = (items: CartItem[], tenantConfig: any): number => {
    if (!tenantConfig || !items) return 0;
    
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    // Default rule: 1 point per 100 units
    const pointValue = tenantConfig.loyaltyConfig?.pointValue || 100;
    return Math.floor(subtotal / pointValue);
};
