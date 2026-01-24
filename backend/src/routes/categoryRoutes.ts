import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController.js';

const router = Router();
const controller = new CategoryController();

router.get('/', controller.getCategories);

export default router;
