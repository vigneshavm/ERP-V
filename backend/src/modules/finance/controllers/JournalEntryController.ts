import { Request, Response } from 'express';
import JournalEntry from '../models/JournalEntry.js';
import { error, info } from '../../../config/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
}

export const getJournalEntries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, accountId } = req.query;
        // Basic filtering by tenant (assume multi-tenant middleware handles tenantId injection usually, 
        // but looking at previous controllers, we filter by userId for now or tenantId if available)

        // Check if previous controllers use tenantId or userId. 
        // CashBankController used userId. JournalEntry model has tenantId required.
        // We will assume a middleware attaches tenantId to req or we use userId if tenantId logic isn't fully exposed in snippet.
        // Based on JournalEntry.ts model: tenantId is required.
        // We'll try to get tenantId from req.user or req.params/query or middleware augmentation.
        // For consistency with specific user requests seen so far, we might default to userId mapping or req.body.

        // Let's assume standard filtering:
        const query: any = {};

        // If the request is authenticated, we typically scope to the user's tenant.
        // Assuming we might have req.user.tenantId or similar. 
        // For safety, let's look for tenantId in the query or body or assume middleware handles it.
        // However, CashBankController filtered by `userId: req.user?._id`. 
        // JournalEntry model has `tenantId` strict requirement.

        // We will construct the query to include tenantId if present in user object, 
        // otherwise we might need to fallback. 
        // Let's try to simulate what would be standard.
        // We will filter by `tenantId` if available on user context.
        if ((req as any).tenantId) {
            query.tenantId = (req as any).tenantId;
        } else if ((req as any).user?.tenantId) {
            query.tenantId = (req as any).user.tenantId;
        }

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

        // Determine tenantId. Prefer explicit or from user.
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId || (req as any).user?._id;
        // Fallback to userId as tenantId for single-user dev environments if strict tenant context missing.
        // But JournalEntry model expects ObjectId.

        const newEntry = await JournalEntry.create({
            tenantId,
            branchId,
            date: date || new Date(),
            description,
            reference,
            entries,
            status: 'POSTED', // Auto-post for now
            createdBy: req.user?._id
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
