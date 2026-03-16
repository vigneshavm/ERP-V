var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { LoyaltyRepository } from '@smarterp/shared/repositories/LoyaltyRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { ObjectId } from "mongodb";
let LoyaltyService = class LoyaltyService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getCustomerLoyalty(customerId, userId) {
        if (!ObjectId.isValid(customerId))
            throw new AppError("Invalid customer ID", 400);
        const customer = await this.repo.findCustomer(customerId, userId, { name: 1, points: 1, tier: 1 });
        if (!customer)
            throw new AppError("Customer not found", 404);
        return customer;
    }
    async getLoyaltyHistory(customerId, userId) {
        if (!ObjectId.isValid(customerId))
            throw new AppError("Invalid customer ID", 400);
        return this.repo.findLoyaltyTransactions(customerId, userId);
    }
    async adjustPoints(customerId, points, type, description, userId) {
        if (!ObjectId.isValid(customerId))
            throw new AppError("Invalid customer ID", 400);
        const customer = await this.repo.findCustomer(customerId, userId);
        if (!customer)
            throw new AppError("Customer not found", 404);
        // Update points
        const newPoints = (customer.points || 0) + points;
        // Tier logic
        let tier = 'Bronze';
        if (newPoints >= 5000)
            tier = 'Platinum';
        else if (newPoints >= 2000)
            tier = 'Gold';
        else if (newPoints >= 500)
            tier = 'Silver';
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
};
LoyaltyService = __decorate([
    injectable(),
    __param(0, inject(LoyaltyRepository)),
    __metadata("design:paramtypes", [LoyaltyRepository])
], LoyaltyService);
export { LoyaltyService };
