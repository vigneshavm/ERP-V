import { Request, Response } from 'express';
import Invoice from '../models/Invoice.js';
import { error } from '../../../config/logger.js';

/**
 * Wholesale/Retail (WR) Billing: reporting endpoints.
 *
 * WR sales are ordinary Invoice documents tagged `saleChannel: 'WHOLESALE'` (see IInvoice.ts) --
 * these two endpoints just aggregate that same collection filtered on the flag, rather than
 * introducing a parallel WR sale/report data model. Mirrors the read-only aggregation style
 * already used by getSupplierTotals (PurchaseController.ts).
 */

interface AuthenticatedRequest extends Request {
    tenantId?: string;
}

/**
 * @swagger
 * /api/sales-invoice/wholesale/invoices:
 *   get:
 *     summary: List wholesale-channel invoices (WR Sales Bill View)
 *     tags: [Sales - Wholesale]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices retrieved
 */
export const listWholesaleSales = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Tenant-scoped (like getMrpPendingInvoices, PosController.ts) rather than the
        // createdBy-scoped InvoiceRepository.findAll path behind /api/sales-invoice/invoices --
        // a WR bill view needs every wholesale bill for the shop, not just the viewer's own.
        const invoices = await Invoice.find({
            tenantId: req.tenantId,
            saleChannel: 'WHOLESALE',
            isDeleted: { $ne: true }
        })
            .populate('customer', 'name phone')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, invoices });
    } catch (err) {
        error(`List WR sales failed: ${(err as Error).message}`);
        res.status(500).json({ success: false, message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/sales-invoice/wholesale/reports/sales:
 *   get:
 *     summary: WR sales report -- daily totals for wholesale-channel invoices
 *     tags: [Sales - Wholesale]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report retrieved
 */
export const getWholesaleSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { from, to } = req.query;
        const match: Record<string, any> = {
            tenantId: req.tenantId,
            saleChannel: 'WHOLESALE',
            isDeleted: { $ne: true }
        };
        if (from || to) {
            match.createdAt = {};
            if (from) match.createdAt.$gte = new Date(from as string);
            if (to) match.createdAt.$lte = new Date(to as string);
        }

        const byDay = await Invoice.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    invoiceCount: { $sum: 1 },
                    subtotal: { $sum: '$subtotal' },
                    tax: { $sum: '$tax' },
                    discount: { $sum: '$discount' },
                    totalAmount: { $sum: '$totalAmount' },
                    paidAmount: { $sum: '$paidAmount' }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        const byCounter = await Invoice.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $ifNull: ['$counterName', 'Unassigned'] },
                    invoiceCount: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        const summary = byDay.reduce(
            (acc, d) => ({
                invoiceCount: acc.invoiceCount + d.invoiceCount,
                totalAmount: acc.totalAmount + d.totalAmount,
                paidAmount: acc.paidAmount + d.paidAmount
            }),
            { invoiceCount: 0, totalAmount: 0, paidAmount: 0 }
        );

        res.status(200).json({ success: true, summary, byDay, byCounter });
    } catch (err) {
        error(`WR sales report failed: ${(err as Error).message}`);
        res.status(500).json({ success: false, message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/sales-invoice/wholesale/reports/stock:
 *   get:
 *     summary: WR stock report -- quantity sold per item through the wholesale channel
 *     tags: [Sales - Wholesale]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report retrieved
 */
export const getWholesaleStockReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { from, to } = req.query;
        const match: Record<string, any> = {
            tenantId: req.tenantId,
            saleChannel: 'WHOLESALE',
            isDeleted: { $ne: true }
        };
        if (from || to) {
            match.createdAt = {};
            if (from) match.createdAt.$gte = new Date(from as string);
            if (to) match.createdAt.$lte = new Date(to as string);
        }

        const rows = await Invoice.aggregate([
            { $match: match },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.item',
                    name: { $first: '$items.name' },
                    quantitySold: { $sum: '$items.quantity' },
                    totalSaleValue: { $sum: '$items.total' }
                }
            },
            {
                $lookup: {
                    from: 'items',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $addFields: {
                    currentStockQty: { $ifNull: [{ $arrayElemAt: ['$product.stockQty', 0] }, null] },
                    wholesaleRate: { $ifNull: [{ $arrayElemAt: ['$product.wholesaleRate', 0] }, null] }
                }
            },
            { $project: { product: 0 } },
            { $sort: { quantitySold: -1 } }
        ]);

        res.status(200).json({ success: true, rows });
    } catch (err) {
        error(`WR stock report failed: ${(err as Error).message}`);
        res.status(500).json({ success: false, message: 'Server Error', error: (err as Error).message });
    }
};
