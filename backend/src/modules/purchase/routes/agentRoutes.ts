import express from 'express';
import { protect } from '../../../middlewares/authMiddleware.js';
import {
    createAgent,
    getAgents,
    updateAgent,
    deleteAgent
} from '../controllers/AgentController.js';

const router = express.Router();

router.route('/')
    .post(protect, createAgent)
    .get(protect, getAgents);

router.route('/:id')
    .put(protect, updateAgent)
    .delete(protect, deleteAgent);

export default router;
