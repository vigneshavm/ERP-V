import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import Item from '../../inventory/models/Item.js';
import Bill from '../../finance/models/Bill.js';
import Supplier from '../models/Supplier.js';
import { error } from '../../../config/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        tenantId?: string;
        name?: string;
        [key: string]: any;
    };
}

const generatePurchaseNumber = async (_tenantId: string): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PUR-${dateStr}`;
    const lastPurchase = await Purchase.findOne({
        purchaseNumber: new RegExp(`^${prefix}`),
    }).sort({ purchaseNumber: -1 });

    let sequence = 1;
    if (lastPurchase) {
        const parts = lastPurchase.purchaseNumber.split('-');
        if (parts.length >= 3) {
            const seq = parseInt(parts[2]);
            if (!isNaN(seq))
                sequence = seq + 1;
        }
    }
    return `${prefix}-${sequence.toString().padStart(3, '0')}`;
};

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
export const createPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { details, items, status } = req.body;

        if (!req.body.p_vendor_id) {
            throw new Error("Supplier (Vendor) is required");
        }

        const supplier = await Supplier.findById(req.body.p_vendor_id).session(session);
        const supShortCode = supplier?.shortCode || 'SUP';

        // Supplier Credit Protocol
        if (status === 'COMPLETED' && supplier) {
            const { paymentPromiseDate } = req.body;
            if (!paymentPromiseDate) {
                // 1. Check Credit Period Limit (Overdue Invoices)
                const overdueBills = await Bill.countDocuments({
                    supplier: supplier._id,
                    paymentStatus: { $ne: 'paid' },
                    dueDate: { $lt: new Date() },
                    // tenantId: req.user?.tenantId // Ensure index usage if possible
                }).session(session);

                if (overdueBills > 0) {
                    const error: any = new Error(`Supplier Lockout: ${overdueBills} overdue invoices. Manager action required.`);
                    error.statusCode = 403;
                    error.code = 'CREDIT_PERIOD_EXCEEDED';
                    throw error;
                }

                // 2. Check Credit Limit (Total Outstanding)
                if (supplier.creditLimit && supplier.creditLimit > 0) {
                    const result = await Bill.aggregate([
                        { $match: { supplier: supplier._id, paymentStatus: { $ne: 'paid' } } },
                        { $group: { _id: null, total: { $sum: { $subtract: ["$amount", "$paidAmount"] } } } }
                    ]).session(session);

                    const currentOutstanding = result[0]?.total || 0;
                    const newAmount = details.total_amount || 0;

                    if (currentOutstanding + newAmount > supplier.creditLimit) {
                        const error: any = new Error(`Credit Limit Exceeded. Outstanding: ${currentOutstanding}, Limit: ${supplier.creditLimit}`);
                        error.statusCode = 403;
                        error.code = 'CREDIT_LIMIT_EXCEEDED';
                        error.shortage = (currentOutstanding + newAmount) - supplier.creditLimit;
                        throw error;
                    }
                }
            }
        }

        const purchaseNumber = await generatePurchaseNumber(req.user?.tenantId || 'default');

        // Process items: Create new inventory items for variants or new designs
        const processedItems = [];
        for (const i of items) {
            let productId = i.product_id;
            let productName = i.product_name || 'Unknown';
            let catCode = i.category_code || 'CAT';

            // If it's a new item (no product_id or marked as new)
            if (!productId || productId === 'new') {
                const sku = i.sku || `${supShortCode}-${catCode}-${i.selling_price || 0}`;

                const newItem = new Item({
                    name: i.product_name,
                    sku: sku,
                    category: i.category_name,
                    categoryCode: catCode,
                    costPrice: i.rate,
                    sellingPrice: i.selling_price || 0,
                    stockQty: 0, // Will be updated below
                    color: i.color,
                    size: i.size,
                    washingInstructions: i.washing_instructions,
                    tenantId: req.user?.tenantId || 'default',
                    addedBy: req.user?._id
                });
                const savedItem = await newItem.save({ session });
                productId = savedItem._id;
                productName = savedItem.name;
            }

            processedItems.push({
                productId,
                productName,
                quantity: i.quantity,
                rate: i.rate,
                taxPercent: i.tax_percent,
                amount: i.amount,
                margin: i.margin || 0,
                sellingPrice: i.selling_price || 0,
                color: i.color,
                size: i.size,
                categoryCode: catCode
            });
        }

        const purchase = new Purchase({
            purchaseNumber,
            tenantId: req.user?.tenantId || 'default',
            vendorId: req.body.p_vendor_id,
            date: details.date || new Date(),
            invoiceNo: details.invoice_no,
            subtotal: details.subtotal,
            taxAmount: details.tax_amount,
            discountAmount: details.discount_amount,
            shippingAmount: details.shipping_amount,
            totalAmount: details.total_amount,
            notes: details.notes,
            status: status || 'DRAFT',
            createdBy: req.user?._id,
            items: processedItems
        });

        for (let i = 0; i < purchase.items.length; i++) {
            const item = purchase.items[i];
            const product = await Item.findById(item.productId).session(session);
            if (product) {
                purchase.items[i].productName = product.name;
                if (status === 'COMPLETED') {
                    product.stockQty = (product.stockQty || 0) + item.quantity;
                    // Update prices and metadata
                    if (item.sellingPrice && item.sellingPrice > 0) {
                        product.sellingPrice = item.sellingPrice;
                        product.costPrice = item.rate;
                    }
                    if (item.color) product.color = item.color;
                    if (item.size) product.size = item.size;

                    await product.save({ session });
                }
            }
        }

        await purchase.save({ session });

        if (status === 'COMPLETED') {
            const creditPeriod = supplier?.creditPeriod || 30;
            const dueDate = new Date(purchase.date);
            dueDate.setDate(dueDate.getDate() + creditPeriod);

            const bill = new Bill({
                billNo: `BILL-${purchaseNumber}`,
                date: purchase.date,
                supplier: purchase.vendorId,
                amount: purchase.totalAmount,
                status: 'unpaid',
                paymentMethod: 'cash',
                createdBy: req.user?._id,
                description: `Generated from Purchase ${purchaseNumber}`,
                paymentStatus: 'unpaid',
                dueDate: dueDate,
                tenantId: req.user?.tenantId
            });
            await bill.save({ session });
        }

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({
            success: true,
            purchase_number: purchaseNumber,
            message: "Purchase created successfully"
        });
    }
    catch (err: any) {
        await session.abortTransaction();
        session.endSession();
        error("Create Purchase Error: " + err.message);
        const status = err.statusCode || 500;
        const responseData = {
            message: err.message,
            code: err.code,
            shortage: err.shortage
        };
        res.status(status).json(responseData);
    }
};

/**
 * @swagger
 * /api/purchase:
 *   get:
 *     summary: Get all purchases
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchases retrieved
 */
export const getAllPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const purchases = await Purchase.find({ createdBy: req.user?._id })
            .populate('vendorId', 'name businessName')
            .sort({ date: -1 });
        res.json(purchases);
    }
    catch (err: any) {
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
export const getPurchaseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('vendorId')
            .populate('items.productId');
        if (!purchase) {
            res.status(404).json({ message: "Purchase not found" });
            return;
        }
        res.json(purchase);
    }
    catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const updatePurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(purchase);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        await Purchase.findByIdAndDelete(req.params.id);
        res.json({ message: "Purchase deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export default {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase
};
