import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { container } from 'tsyringe';
import { JournalEntryService } from '../services/JournalEntryService.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
    tenantId?: string;
}

export const getJournalEntries = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(JournalEntryService);
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
    const { startDate, endDate, accountId } = req.query;
    const entries = await service.getEntries(tenantId, {
        startDate: startDate as string, endDate: endDate as string, accountId: accountId as string
    });
    res.status(200).json(entries);
});

export const createJournalEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(JournalEntryService);
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || req.user?._id;
    const entry = await service.createEntry(req.body, tenantId as string, req.user?._id as string, req.user?.name);
    res.status(201).json(entry);
});

export const getJournalEntryById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(JournalEntryService);
    const entry = await service.getEntryById(req.params.id as string);
    res.status(200).json(entry);
});

const JournalEntryController = { getJournalEntries, createJournalEntry, getJournalEntryById };
export default JournalEntryController;
