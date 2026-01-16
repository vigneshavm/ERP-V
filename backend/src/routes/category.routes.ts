import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';

const router = Router();
const controller = new CategoryController();

router.get('/', controller.getCategories);

export default router;
