import express from 'express';
import multer from 'multer';
import { uploadStatement, getTransactions } from '../controllers/bankStatementController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

// Memory storage for multer since we pass it to Gemini AI directly
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max limit
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed!'));
        }
    }
});

// Routes
router.post('/upload', protect, upload.single('statement'), uploadStatement);
router.get('/transactions', protect, getTransactions);

export default router;
