import { Router } from 'express';
import { getBusinessSectors, getProductCategories } from '../controllers/SectorCategoryController.js';

const router = Router();

// Public / Authenticated endpoints for DB-driven sectors & mapped categories
router.get('/business-sectors', getBusinessSectors);
router.get('/product-categories', getProductCategories);

export default router;
