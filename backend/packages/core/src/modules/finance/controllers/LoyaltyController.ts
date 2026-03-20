import { Request, Response } from 'express';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { singleton } from 'tsyringe';
import { container } from 'tsyringe';
import { LoyaltyService } from '../services/LoyaltyService.js';

@singleton()
export class LoyaltyController {
    public getCustomerLoyalty = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const service = container.resolve(LoyaltyService);
        const customer = await service.getCustomerLoyalty(req.params.id as string, req.user!._id as string);
        res.status(200).json(customer);
    });

    public getLoyaltyHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const service = container.resolve(LoyaltyService);
        const transactions = await service.getLoyaltyHistory(req.params.id as string, req.user!._id as string);
        res.status(200).json(transactions);
    });

    public adjustPoints = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const service = container.resolve(LoyaltyService);
        const { customerId, points, type, description } = req.body;
        const result = await service.adjustPoints(customerId, points, type, description, req.user!._id as string);
        res.status(200).json(result);
    });
}
