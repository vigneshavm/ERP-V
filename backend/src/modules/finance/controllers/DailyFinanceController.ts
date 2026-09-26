import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import DailyFinance from '../models/DailyFinance.js';
import { error as logError } from '../../../config/logger.js';

// Daily cash/online sales entries from the Daily Finance screen. Records are keyed by the id the
// browser generated (`clientId`), so the offline queue can replay a create or update safely: a
// retried request updates the same record instead of adding another. The tenant always comes from
// the authenticated user, never from the request body.

const EDITABLE_FIELDS = ['date', 'cashSales', 'onlineSales', 'expenses', 'cashInDrawer', 'notes', 'sector'] as const;

const num = (v: unknown): number => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
};

// Picks the editable fields from a request body; totalSales is always derived, never trusted.
export const toDailyFinanceFields = (body: Record<string, unknown>) => {
    const fields: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
        if (body[key] !== undefined) fields[key] = body[key];
    }
    for (const key of ['cashSales', 'onlineSales', 'expenses', 'cashInDrawer'] as const) {
        if (fields[key] !== undefined) fields[key] = num(fields[key]);
    }
    if (fields.cashSales !== undefined || fields.onlineSales !== undefined) {
        fields.totalSales = num(fields.cashSales) + num(fields.onlineSales);
    }
    return fields;
};

// API shape the frontend maps from: `id` is the client id the record was created with.
const toResponse = (doc: any) => ({
    id: doc.clientId,
    date: doc.date instanceof Date ? doc.date.toISOString().split('T')[0] : doc.date,
    cashSales: doc.cashSales,
    onlineSales: doc.onlineSales,
    totalSales: doc.totalSales,
    expenses: doc.expenses,
    cashInDrawer: doc.cashInDrawer,
    notes: doc.notes || '',
    sector: doc.sector,
    tenantId: doc.tenantId,
    updatedAt: doc.updatedAt,
});

const tenantOf = (req: AuthenticatedRequest, res: Response): string | null => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
        res.status(400).json({ success: false, message: 'Daily finance requires a tenant account' });
        return null;
    }
    return String(tenantId);
};

const isDuplicateDay = (err: unknown) => (err as { code?: number })?.code === 11000;

export const listDailyFinance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const tenantId = tenantOf(req, res);
    if (!tenantId) return;
    try {
        const docs = await DailyFinance.find({ tenantId }).sort({ date: -1 }).lean();
        res.status(200).json({ success: true, data: docs.map(toResponse) });
    } catch (err) {
        logError(`List Daily Finance Error: ${(err as Error).message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Create, idempotent on the client id: replaying the same create returns the stored record.
export const createDailyFinance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const tenantId = tenantOf(req, res);
    if (!tenantId) return;
    const clientId = req.body?.id;
    if (!clientId || !req.body?.date) {
        res.status(400).json({ success: false, message: 'id and date are required' });
        return;
    }
    try {
        const doc = await DailyFinance.findOneAndUpdate(
            { tenantId, clientId },
            { $set: toDailyFinanceFields(req.body), $setOnInsert: { tenantId, clientId } },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(201).json({ success: true, data: toResponse(doc) });
    } catch (err) {
        if (isDuplicateDay(err)) {
            res.status(409).json({ success: false, message: 'A daily finance record already exists for this date' });
            return;
        }
        logError(`Create Daily Finance Error: ${(err as Error).message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateDailyFinance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const tenantId = tenantOf(req, res);
    if (!tenantId) return;
    try {
        const doc = await DailyFinance.findOneAndUpdate(
            { tenantId, clientId: req.params.id },
            { $set: toDailyFinanceFields(req.body || {}) },
            { new: true, runValidators: true }
        );
        if (!doc) {
            res.status(404).json({ success: false, message: 'Daily finance record not found' });
            return;
        }
        res.status(200).json({ success: true, data: toResponse(doc) });
    } catch (err) {
        if (isDuplicateDay(err)) {
            res.status(409).json({ success: false, message: 'A daily finance record already exists for this date' });
            return;
        }
        logError(`Update Daily Finance Error: ${(err as Error).message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Idempotent: deleting a record that is already gone succeeds, so a replayed delete clears the queue.
export const deleteDailyFinance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const tenantId = tenantOf(req, res);
    if (!tenantId) return;
    try {
        await DailyFinance.deleteOne({ tenantId, clientId: req.params.id });
        res.status(200).json({ success: true });
    } catch (err) {
        logError(`Delete Daily Finance Error: ${(err as Error).message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
