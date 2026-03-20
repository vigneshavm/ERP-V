import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import SubscriptionPlan from '../models/SubscriptionPlan.js';

@singleton()
export class SubscriptionPlanController {
    /**
     * @swagger
     * /api/subscription-plans:
     *   get:
     *     summary: Get all active subscription plans
     *     tags: [Subscription]
     *     responses:
     *       200:
     *         description: List of subscription plans
     */
    public getPlans = async (_req: Request, res: Response): Promise<void> => {
        const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
        res.status(200).json({ success: true, data: plans });
    };
}
