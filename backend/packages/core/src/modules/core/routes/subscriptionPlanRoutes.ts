import { Router } from 'express';
import { container } from 'tsyringe';
import { SubscriptionPlanController } from '../controllers/SubscriptionPlanController.js';
import { protect as authMiddleware } from '@smarterp/shared/middlewares/authMiddleware.js';

const subscriptionPlanRoutes = Router();
const subscriptionPlanController = container.resolve(SubscriptionPlanController);

// Protected routes - any authenticated user can view plans
subscriptionPlanRoutes.get('/', authMiddleware, subscriptionPlanController.getPlans);

export default subscriptionPlanRoutes;
