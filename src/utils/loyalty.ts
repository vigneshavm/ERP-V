import { CartItem } from '../types/sales';
import { Tenant } from '../types/tenant';

export const calculateLoyaltyPoints = (items: CartItem[], tenant: Tenant): number => {
    if (!tenant.loyaltyConfig) return 0;

    const { earningRate, pointsPerRate, categoryPercentages } = tenant.loyaltyConfig;
    let totalPoints = 0;

    items.forEach(item => {
        const itemTotal = item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty);
        // Default multiplier: e.g. 1 point per 100 = 1%
        let multiplier = (pointsPerRate / earningRate) * 100;

        if (categoryPercentages && item.category && categoryPercentages[item.category] !== undefined) {
            multiplier = categoryPercentages[item.category];
        }

        totalPoints += (itemTotal * multiplier) / 100;
    });

    return Math.floor(totalPoints);
};
