import { injectable, inject } from "tsyringe";
import { LoyaltyRepository } from '@smarterp/shared/repositories/LoyaltyRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { ObjectId } from "mongodb";

@injectable()
export class LoyaltyService {
    constructor(
        @inject(LoyaltyRepository) private repo: LoyaltyRepository
    ) { }

    async getCustomerLoyalty(customerId: string, userId: string): Promise<any> {
        if (!ObjectId.isValid(customerId)) throw new AppError("Invalid customer ID", 400);
        const customer = await this.repo.findCustomer(customerId, userId, { name: 1, points: 1, tier: 1 });
        if (!customer) throw new AppError("Customer not found", 404);
        return customer;
    }

    async getLoyaltyHistory(customerId: string, userId: string): Promise<any[]> {
        if (!ObjectId.isValid(customerId)) throw new AppError("Invalid customer ID", 400);
        return this.repo.findLoyaltyTransactions(customerId, userId);
    }

    async adjustPoints(customerId: string, points: number, type: string | undefined, description: string | undefined, userId: string): Promise<any> {
        if (!ObjectId.isValid(customerId)) throw new AppError("Invalid customer ID", 400);

        const customer = await this.repo.findCustomer(customerId, userId);
        if (!customer) throw new AppError("Customer not found", 404);

        // Update points
        const newPoints = (customer.points || 0) + points;

        // Tier logic
        let tier = 'Bronze';
        if (newPoints >= 5000) tier = 'Platinum';
        else if (newPoints >= 2000) tier = 'Gold';
        else if (newPoints >= 500) tier = 'Silver';

        await this.repo.updateCustomer(customerId, { points: newPoints, tier });

        // Record transaction
        await this.repo.createLoyaltyTransaction({
            customer: customerId,
            type: type || (points >= 0 ? 'BONUS' : 'REDEEMED'),
            points: Math.abs(points),
            description: description || 'Manual adjustment',
            owner: userId,
        });

        return { message: 'Loyalty points adjusted', points: newPoints, tier };
    }
}
