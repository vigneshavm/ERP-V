import { Request, Response } from 'express';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { container } from 'tsyringe';
import { BankStatementService } from '../services/BankStatementService.js';

/**
 * AI-powered extraction of bank statements from PDF using Gemini Vision
 */
export const uploadStatement = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const service = container.resolve(BankStatementService);
    const userId = req.user!._id as string;
    if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated properly' });
        return;
    }

    const extractedData = await service.uploadAndExtract(req.file as Express.Multer.File, userId);
    res.status(200).json({
        success: true,
        data: extractedData,
        message: "Bank statement analysis complete and transactions saved."
    });
});

/**
 * Fetch all bank statement transactions for the logged-in user
 */
export const getTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const service = container.resolve(BankStatementService);
    const userId = req.user!._id as string;
    if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
    }

    const transactions = await service.getTransactions(userId, req.query.status as string);
    res.status(200).json({ success: true, data: transactions });
});
