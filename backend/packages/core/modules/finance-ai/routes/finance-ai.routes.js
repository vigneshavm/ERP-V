import { Router } from 'express';
import { container } from "tsyringe";
import { DocumentController } from '../controllers/DocumentController.js';
import { TransactionController } from '../controllers/TransactionController.js';
import { AIController } from '../controllers/AIController.js';
const router = Router();
// Controllers
const documentController = container.resolve(DocumentController);
const transactionController = container.resolve(TransactionController);
const aiController = container.resolve(AIController);
/**
 * @route   POST /api/v1/finance/documents/upload
 * @desc    Upload document for AI extraction
 */
router.post('/documents/upload', (req, res) => documentController.uploadDocument(req, res));
/**
 * @route   GET /api/v1/finance/jobs/:jobId
 * @desc    Poll status of an AI job
 */
router.get('/jobs/:jobId', (req, res) => documentController.getJobStatus(req, res));
/**
 * @route   GET /api/v1/finance/transactions
 * @desc    List tenant-scoped transactions
 */
router.get('/transactions', (req, res) => transactionController.listTransactions(req, res));
/**
 * @route   POST /api/v1/finance/transactions
 * @desc    Create transaction (idempotent)
 */
router.post('/transactions', (req, res) => transactionController.createTransaction(req, res));
/**
 * @route   POST /api/v1/finance/ai/predict-cashflow
 * @desc    Generate cashflow forecast
 */
router.post('/ai/predict-cashflow', (req, res) => aiController.predictCashflow(req, res));
/**
 * @route   POST /api/v1/finance/ai/chat
 * @desc    Chat with AI assistant
 */
router.post('/ai/chat', (req, res) => aiController.chat(req, res));
export default router;
