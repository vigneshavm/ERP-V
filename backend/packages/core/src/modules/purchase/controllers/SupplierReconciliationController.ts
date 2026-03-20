import { Request, Response } from 'express';
import SupplierReconciliation from '../models/SupplierReconciliation.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

/**
 * @swagger
 * /api/purchase/reconciliation:
 *   post:
 *     summary: Mark a transaction as reconciled
 *     tags: [Reconciliation]
 */
export const markReconciled = asyncHandler(async (req: Request, res: Response) =>{
    const userId = req.user!._id;
    const tenantId = req.user.tenantId;
    const { supplierId, transactionType, transactionId, status = 'RECONCILED', notes } = req.body;

    if (!supplierId || !transactionType || !transactionId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const reconciliation = await SupplierReconciliation.findOneAndUpdate(
        { tenantId, transactionId },
        {
            supplierId,
            transactionType,
            transactionId,
            status,
            notes,
            reconciledAt: new Date(),
            createdBy: userId
        },
        { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: reconciliation });

/**
 * @swagger
 * /api/purchase/reconciliation/status:
 *   get:
 *     summary: Get reconciliation status for a supplier
 *     tags: [Reconciliation]
 */
export const getReconciliationStatus = asyncHandler(async (req: Request, res: Response) =>{
    const tenantId = req.user.tenantId;
    const { supplierId } = req.query;

    if (!supplierId) {
        return res.status(400).json({ success: false, message: 'Supplier ID is required' });
    }

    const reconciledItems = await SupplierReconciliation.find({
        tenantId,
        supplierId
    }).select('transactionId status notes');

    const statusMap: Record<string, any> = {};
    reconciledItems.forEach(item => {
        statusMap[item.transactionId] = {
            status: item.status,
            notes: item.notes
        };
    });

    res.status(200).json({ success: true, data: statusMap });

/**
 * @swagger
 * /api/purchase/reconciliation/{transactionId}:
 *   delete:
 *     summary: Un-reconcile (delete) a transaction
 *     tags: [Reconciliation]
 */
export const unreconcile = asyncHandler(async (req: Request, res: Response) =>{
    const tenantId = req.user.tenantId;
    const { transactionId } = req.params;

    await SupplierReconciliation.findOneAndDelete({ tenantId, transactionId });

    res.status(200).json({ success: true, message: 'Transaction unreconciled' });
