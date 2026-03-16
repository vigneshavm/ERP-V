var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { singleton } from 'tsyringe';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
let SubscriptionPlanController = class SubscriptionPlanController {
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
    getPlans = async (_req, res) => {
        try {
            const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
            res.status(200).json({ success: true, data: plans });
        }
        catch (error) {
            console.error('Get Subscription Plans Error:', error);
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    };
};
SubscriptionPlanController = __decorate([
    singleton()
], SubscriptionPlanController);
export { SubscriptionPlanController };
