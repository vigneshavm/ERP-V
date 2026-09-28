import { Response } from 'express';
import JournalEntry from '../models/JournalEntry.js';
import { error, info } from '../../../config/logger.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

export const getJournalEntries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, accountId } = req.query;
        const query: any = { tenantId: req.user.tenantId };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate as string);
            if (endDate) query.date.$lte = new Date(endDate as string);
        }

        if (accountId) {
            query['entries.accountId'] = accountId;
        }

        const entries = await JournalEntry.find(query)
            .sort({ date: -1 })
            .populate('createdBy', 'name email');

        res.status(200).json(entries);
    } catch (err) {
        error(`Get Journal Entries Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const createJournalEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { date, description, reference, entries, branchId } = req.body;

        if (!entries || !Array.isArray(entries) || entries.length < 2) {
            res.status(400).json({ message: 'Journal entry must have at least two line items.' });
            return;
        }

        // Calculate totals
        const totalDebit = entries.reduce((sum: number, e: any) => sum + (Number(e.debit) || 0), 0);
        const totalCredit = entries.reduce((sum: number, e: any) => sum + (Number(e.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            res.status(400).json({
                message: `Entries are unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}, Diff: ${totalDebit - totalCredit}`
            });
            return;
        }

        // Determine tenantId from authenticated request
        const tenantId = req.user.tenantId;

        const newEntry = await JournalEntry.create({
            tenantId,
            branchId,
            date: date || new Date(),
            description,
            reference,
            entries,
            status: 'POSTED', // Auto-post for now
            createdBy: req.user.name || req.user._id
        });

        info(`Journal Entry created by ${req.user?.name}: ${description}`);
        res.status(201).json(newEntry);
    } catch (err) {
        error(`Create Journal Entry Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const getJournalEntryById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const entry = await JournalEntry.findById(req.params.id).populate('createdBy', 'name');
        if (!entry) {
            res.status(404).json({ message: 'Journal Entry not found' });
            return;
        }
        res.status(200).json(entry);
    } catch (err) {
        error(`Det Journal Entry Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

const JournalEntryController = {
    getJournalEntries,
    createJournalEntry,
    getJournalEntryById
};

export default JournalEntryController;
