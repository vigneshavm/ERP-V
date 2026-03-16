import asyncHandler from 'express-async-handler';
import { container } from 'tsyringe';
import { JournalEntryService } from '../services/JournalEntryService.js';
export const getJournalEntries = asyncHandler(async (req, res) => {
    const service = container.resolve(JournalEntryService);
    const tenantId = req.tenantId || req.user?.tenantId;
    const { startDate, endDate, accountId } = req.query;
    const entries = await service.getEntries(tenantId, {
        startDate: startDate, endDate: endDate, accountId: accountId
    });
    res.status(200).json(entries);
});
export const createJournalEntry = asyncHandler(async (req, res) => {
    const service = container.resolve(JournalEntryService);
    const tenantId = req.tenantId || req.user?.tenantId || req.user?._id;
    const entry = await service.createEntry(req.body, tenantId, req.user?._id, req.user?.name);
    res.status(201).json(entry);
});
export const getJournalEntryById = asyncHandler(async (req, res) => {
    const service = container.resolve(JournalEntryService);
    const entry = await service.getEntryById(req.params.id);
    res.status(200).json(entry);
});
export const postJournalEntry = asyncHandler(async (req, res) => {
    const service = container.resolve(JournalEntryService);
    const tenantId = req.tenantId || req.user?.tenantId;
    const entry = await service.postEntry(req.params.id, tenantId, req.user?._id);
    res.status(200).json(entry);
});
export const voidJournalEntry = asyncHandler(async (req, res) => {
    const service = container.resolve(JournalEntryService);
    const tenantId = req.tenantId || req.user?.tenantId;
    const entry = await service.voidEntry(req.params.id, tenantId, req.user?._id);
    res.status(200).json(entry);
});
const JournalEntryController = { getJournalEntries, createJournalEntry, getJournalEntryById, postJournalEntry, voidJournalEntry };
export default JournalEntryController;
