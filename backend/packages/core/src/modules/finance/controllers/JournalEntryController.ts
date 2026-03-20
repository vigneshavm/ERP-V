import { Request, Response } from 'express';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { AuthenticatedRequest } from '@smarterp/shared/middlewares/authMiddleware.js';
import { container } from 'tsyringe';
import { JournalEntryService } from '../services/JournalEntryService.js';

export const getJournalEntries = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(JournalEntryService);
    const tenantId = req.tenantId || req.user!.tenantId;
    const { startDate, endDate, accountId } = req.query;
    const entries = await service.getEntries(tenantId, {
        startDate: startDate as string, endDate: endDate as string, accountId: accountId as string
    });
    res.status(200).json(entries);
});

export const createJournalEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(JournalEntryService);
    const tenantId = req.tenantId || req.user!.tenantId || req.user!._id;
    const entry = await service.createEntry(req.body, tenantId as string, req.user!._id as string, req.user!.name);
    res.status(201).json(entry);
});

export const getJournalEntryById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(JournalEntryService);
    const entry = await service.getEntryById(req.params.id as string);
    res.status(200).json(entry);
});

export const postJournalEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(JournalEntryService);
    const tenantId = req.tenantId || req.user!.tenantId;
    const entry = await service.postEntry(req.params.id as string, tenantId as string, req.user!._id as string);
    res.status(200).json(entry);
});

export const voidJournalEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(JournalEntryService);
    const tenantId = req.tenantId || req.user!.tenantId;
    const entry = await service.voidEntry(req.params.id as string, tenantId as string, req.user!._id as string);
    res.status(200).json(entry);
});

const JournalEntryController = { getJournalEntries, createJournalEntry, getJournalEntryById, postJournalEntry, voidJournalEntry };
export default JournalEntryController;
