var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { singleton } from 'tsyringe';
import { container } from 'tsyringe';
import { LoyaltyService } from '../services/LoyaltyService.js';
let LoyaltyController = class LoyaltyController {
    getCustomerLoyalty = asyncHandler(async (req, res) => {
        const service = container.resolve(LoyaltyService);
        const customer = await service.getCustomerLoyalty(req.params.id, req.user._id);
        res.status(200).json(customer);
    });
    getLoyaltyHistory = asyncHandler(async (req, res) => {
        const service = container.resolve(LoyaltyService);
        const transactions = await service.getLoyaltyHistory(req.params.id, req.user._id);
        res.status(200).json(transactions);
    });
    adjustPoints = asyncHandler(async (req, res) => {
        const service = container.resolve(LoyaltyService);
        const { customerId, points, type, description } = req.body;
        const result = await service.adjustPoints(customerId, points, type, description, req.user._id);
        res.status(200).json(result);
    });
};
LoyaltyController = __decorate([
    singleton()
], LoyaltyController);
export { LoyaltyController };
