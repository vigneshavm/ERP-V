import { Router } from 'express';
import {
    createStore,
    getStores,
    updateStore,
    transferStock
} from '../controllers/StoreController.js';

// Assume authMiddleware and tenantMiddleware are applied at a higher level in app.ts or index.ts

const router = Router();

router.get('/', getStores);
router.post('/', createStore);
router.put('/:id', updateStore);
router.post('/:id/stock-transfer', transferStock);

export default router;
