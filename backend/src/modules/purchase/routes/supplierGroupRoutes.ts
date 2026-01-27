import express from 'express';
import { protect } from '../../../middlewares/authMiddleware.js';
import {
    createGroup,
    getGroups,
    updateGroup,
    deleteGroup
} from '../controllers/SupplierGroupController.js';

const router = express.Router();

router.route('/')
    .post(protect, createGroup)
    .get(protect, getGroups);

router.route('/:id')
    .put(protect, updateGroup)
    .delete(protect, deleteGroup);

export default router;
