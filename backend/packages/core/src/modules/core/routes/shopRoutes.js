import { Router } from 'express';
import { container } from 'tsyringe';
import { ShopController } from '../controllers/ShopController.js';
import { protect as authMiddleware } from '@smarterp/shared/middlewares/authMiddleware.js';
const shopRoutes = Router();
const shopController = container.resolve(ShopController);
shopRoutes.use(authMiddleware); // Protect all shop routes
shopRoutes.get('/settings', shopController.getSettings);
shopRoutes.put('/settings', shopController.updateSettings);
export default shopRoutes;
