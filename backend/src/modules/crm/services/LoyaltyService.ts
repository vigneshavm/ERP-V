import Customer from "../models/Customer.js";
import LoyaltyTransaction from "../models/LoyaltyTransaction.js";
import ConfigService from "../../core/services/ConfigService.js";

export class LoyaltyService {
    /**
     * Calculate earned points for a given spend
     */
    static calculateEarnedPoints(spendAmount: number, spendPerPointRule: number = 100): number {
        if (!spendAmount || spendAmount <= 0) return 0;
        const ratio = spendPerPointRule > 0 ? spendPerPointRule : 100;
        return Math.floor(spendAmount / ratio);
    }

    /**
     * Calculate monetary discount value of points
     */
    static calculatePointsDiscountValue(points: number, rupeesPer100PointsRule: number = 10): number {
        if (!points || points <= 0) return 0;
        return (points / 100) * rupeesPer100PointsRule;
    }

    /**
     * Award loyalty points to a customer upon successful invoice payment
     */
    static async earnPoints(
        tenantId: string,
        customerId: string,
        invoiceId: string,
        spendAmount: number,
        session?: any
    ): Promise<number> {
        const { spendPerPoint } = await ConfigService.getLoyaltyRuleConfig(tenantId);
        const earned = this.calculateEarnedPoints(spendAmount, spendPerPoint);
        if (earned <= 0) return 0;

        const customer = await Customer.findOne({ _id: customerId, tenantId }).session(session || null);
        if (!customer) return 0;

        const newBalance = (customer.points || 0) + earned;
        customer.points = newBalance;
        await customer.save({ session });

        await LoyaltyTransaction.create([{
            tenantId,
            customerId,
            type: 'EARN',
            points: earned,
            balanceAfter: newBalance,
            invoiceId,
            description: `Earned ${earned} points for spend ₹${spendAmount}`
        }], { session: session || null });

        return earned;
    }

    /**
     * Redeem customer loyalty points at checkout
     */
    static async redeemPoints(
        tenantId: string,
        customerId: string,
        invoiceId: string,
        pointsToRedeem: number,
        session?: any
    ): Promise<number> {
        if (!pointsToRedeem || pointsToRedeem <= 0) return 0;

        const customer = await Customer.findOne({ _id: customerId, tenantId }).session(session || null);
        if (!customer || (customer.points || 0) < pointsToRedeem) {
            throw new Error(`Insufficient loyalty points. Available: ${customer?.points || 0}`);
        }

        const newBalance = customer.points - pointsToRedeem;
        customer.points = newBalance;
        await customer.save({ session });

        const { rupeesPer100Points } = await ConfigService.getLoyaltyRuleConfig(tenantId);
        const discountValue = this.calculatePointsDiscountValue(pointsToRedeem, rupeesPer100Points);

        await LoyaltyTransaction.create([{
            tenantId,
            customerId,
            type: 'REDEEM',
            points: -pointsToRedeem,
            balanceAfter: newBalance,
            invoiceId,
            description: `Redeemed ${pointsToRedeem} points for ₹${discountValue} discount`
        }], { session: session || null });

        return discountValue;
    }

    /**
     * Get loyalty transactions ledger for a customer
     */
    static async getLoyaltyLedger(tenantId: string, customerId: string) {
        return await LoyaltyTransaction.find({ tenantId, customerId }).sort({ createdAt: -1 });
    }
}

export default LoyaltyService;
