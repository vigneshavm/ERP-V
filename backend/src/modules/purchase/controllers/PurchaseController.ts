import { Response } from 'express';
import { singleton, inject } from 'tsyringe';
import { PurchaseService } from '../services/PurchaseService.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { AppError } from '../../../utils/AppError.js';
import { error } from '../../../config/logger.js';

/**
 * HTTP translation only -- all purchase business logic (supplier credit checks, inventory
 * receipt, bill/ledger posting, transaction boundary) lives in PurchaseService.
 */
@singleton()
export class PurchaseController {
    constructor(
        @inject(PurchaseService) private purchaseService: PurchaseService,
    ) { }

    /**
     * @swagger
     * /api/purchase:
     *   post:
     *     summary: Create a new purchase
     *     tags: [Purchase]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [p_vendor_id, items, details]
     *             properties:
     *               p_vendor_id: { type: string }
     *               details: { type: object }
     *               items: { type: array, items: { type: object } }
     *     responses:
     *       201:
     *         description: Purchase created successfully
     */
    public createPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { purchaseNumber } = await this.purchaseService.createPurchase(req.user, req.body);
            res.status(201).json({
                success: true,
                purchase_number: purchaseNumber,
                message: "Purchase created successfully",
            });
        } catch (err: any) {
            error(`Create Purchase Error: ${err.message}`);
            const status = err.statusCode || 500;
            res.status(status).json({ message: err.message, code: err.code, data: err.data });
        }
    };

    public getAllPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const purchases = await this.purchaseService.getAllPurchases(req.user, req.query);
            res.json(purchases);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

    /**
     * @swagger
     * /api/purchase/{id}:
     *   get:
     *     summary: Get single purchase by ID
     *     tags: [Purchase]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: Purchase details retrieved
     *       404:
     *         description: Purchase not found
     */
    public getPurchaseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const purchase = await this.purchaseService.getPurchaseById(String(req.params.id), req.tenantId.toString());
            res.json(purchase);
        } catch (err: any) {
            res.status(err instanceof AppError ? err.statusCode : 500).json({ message: err.message });
        }
    };

    public updatePurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const purchase = await this.purchaseService.updatePurchase(String(req.params.id), req.tenantId.toString(), req.body);
            res.json(purchase);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

    public deletePurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            await this.purchaseService.deletePurchase(String(req.params.id), req.tenantId.toString());
            res.json({ message: "Purchase deleted successfully" });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

    public getSupplierTotals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const totals = await this.purchaseService.getSupplierTotals(req.tenantId.toString());
            res.json(totals);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

    /**
     * @swagger
     * /api/purchase/history/item/{itemId}:
     *   get:
     *     summary: Get last 5 purchase history for an item
     *     tags: [Purchase]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: itemId
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: List of purchase history
     */
    public getPurchaseHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const history = await this.purchaseService.getPurchaseHistory(req.tenantId.toString(), String(req.params.itemId));
            res.json({ success: true, data: history });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    };

    public updatePOStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { status, expectedDeliveryDate } = req.body;
            const purchase = await this.purchaseService.updatePOStatus(String(req.params.id), req.tenantId.toString(), req.user, status, expectedDeliveryDate);
            res.json({ success: true, message: `PO status updated to ${status}`, purchase });
        } catch (err: any) {
            res.status(err instanceof AppError ? err.statusCode : 500).json({ message: err.message });
        }
    };

}

