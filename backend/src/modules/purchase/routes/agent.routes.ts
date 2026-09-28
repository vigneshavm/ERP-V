import express from 'express';
import { container } from 'tsyringe';
import { AgentController } from '../controllers/AgentController.js';
import { protect } from '../../../middlewares/authMiddleware.js';

const router = express.Router();
const agentController = container.resolve(AgentController);

router.route('/')
    .post(protect, agentController.createAgent)
    .get(protect, agentController.getAgents);

router.route('/:id')
    .put(protect, agentController.updateAgent)
    .delete(protect, agentController.deleteAgent);

export default router;
