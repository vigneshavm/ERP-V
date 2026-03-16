import { AgentOrchestrator } from '../services/AgentOrchestrator.js';
/**
 * Controller for Multi-Agent Workflows
 */
export const runReceiptWorkflow = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No receipt file uploaded' });
        }
        // Extract tenant and user info from request (provided by middlewares)
        const tenantId = req.tenantId || 'default-tenant';
        const userId = req.user?._id || 'guest-user';
        // In a real system, we'd upload the file to S3/Cloudinary first to get a URL.
        // For this implementation, we'll simulate a local URL or use a placeholder.
        const receiptUrl = `https://storage.smarterp.ai/receipts/${Date.now()}-${req.file.originalname}`;
        const result = await AgentOrchestrator.runWorkflow(req.file.buffer, req.file.mimetype, tenantId, userId, receiptUrl);
        if (result.success) {
            return res.status(200).json(result);
        }
        else {
            return res.status(500).json(result);
        }
    }
    catch (error) {
        console.error('Agent Workflow Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'An internal error occurred during agent orchestration.',
            error: error.message
        });
    }
};
