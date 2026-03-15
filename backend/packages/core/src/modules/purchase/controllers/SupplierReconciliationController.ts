import { Request, Response } from 'express';
import SupplierReconciliation from '../models/SupplierReconciliation.js';

/**
 * @swagger
 * /api/purchase/reconciliation:
 *   post:
 *     summary: Mark a transaction as reconciled
 *     tags: [Reconciliation]
 */
export const markReconciled = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const tenantId = (req as any).user.tenantId;
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
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/purchase/reconciliation/status:
 *   get:
 *     summary: Get reconciliation status for a supplier
 *     tags: [Reconciliation]
 */
export const getReconciliationStatus = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
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
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/purchase/reconciliation/{transactionId}:
 *   delete:
 *     summary: Un-reconcile (delete) a transaction
 *     tags: [Reconciliation]
 */
export const unreconcile = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { transactionId } = req.params;

        await SupplierReconciliation.findOneAndDelete({ tenantId, transactionId });

        res.status(200).json({ success: true, message: 'Transaction unreconciled' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
