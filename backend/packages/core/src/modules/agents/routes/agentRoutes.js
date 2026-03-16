import express from 'express';
import multer from 'multer';
import { runReceiptWorkflow } from '../controllers/AgentController.js';
// import { protect } from '@smarterp/shared/middlewares/authMiddleware.js'; // Assuming auth middleware exists
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
/**
 * @route   POST /api/v1/agents/receipt-workflow
 * @desc    Trigger multi-agent receipt processing
 * @access  Private (Agent protected)
 */
router.post('/receipt-workflow', upload.single('receipt'), runReceiptWorkflow);
export default router;
