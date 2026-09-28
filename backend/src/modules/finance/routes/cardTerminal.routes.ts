import express from 'express';
import { protect } from '../../../middlewares/authMiddleware.js';
import {
    createCardTerminal,
    getCardTerminals,
    updateCardTerminal,
    deleteCardTerminal
} from '../controllers/CardTerminalController.js';

const router = express.Router();

router.route('/')
    .post(protect, createCardTerminal)
    .get(protect, getCardTerminals);

router.route('/:id')
    .put(protect, updateCardTerminal)
    .delete(protect, deleteCardTerminal);

export default router;
