import express from 'express';
import multer from 'multer';
import { extractSupplierFromInvoice, extractSupplierFromText, extractPurchaseInvoice } from '../controllers/ExtractionController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
// @route   POST /api/purchases/extraction/invoice
// @desc    Analyze invoice and extract supplier details
// @access  Private
router.post('/invoice', protect, upload.single('invoice'), extractSupplierFromInvoice);
// @route   POST /api/purchases/extraction/purchase-invoice
// @desc    Analyze purchase invoice and extract itemized details
// @access  Private
router.post('/purchase-invoice', protect, upload.single('invoice'), extractPurchaseInvoice);
// @route   POST /api/purchases/extraction/text
// @desc    Analyze text and extract supplier details
// @access  Private
router.post('/text', protect, extractSupplierFromText);
export default router;
