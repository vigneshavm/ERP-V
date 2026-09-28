import express from 'express';
import { container } from 'tsyringe';
import { protect } from '../../../middlewares/authMiddleware.js';
import { SupplierGroupController } from '../controllers/SupplierGroupController.js';

const router = express.Router();

router.route('/')
    .post(protect, (req, res) => container.resolve(SupplierGroupController).createGroup(req, res))
    .get(protect, (req, res) => container.resolve(SupplierGroupController).getGroups(req, res));

router.route('/:id')
    .put(protect, (req, res) => container.resolve(SupplierGroupController).updateGroup(req, res))
    .delete(protect, (req, res) => container.resolve(SupplierGroupController).deleteGroup(req, res));

export default router;
