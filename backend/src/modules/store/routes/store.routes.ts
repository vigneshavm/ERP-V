import { Router } from 'express';
import {
    createStore,
    getStores,
    updateStore,
    transferStock
} from '../controllers/StoreController.js';

// Assume authMiddleware and tenantMiddleware are applied at a higher level in app.ts or index.ts

import { protect } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.use(protect); // Ensure all store routes are protected

router.get('/', getStores);
router.post('/', createStore);
router.put('/:id', updateStore);
router.post('/:id/stock-transfer', transferStock);

export default router;
