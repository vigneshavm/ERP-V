import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import Item from '../../inventory/models/Item.js';
import Bill from '../../finance/models/Bill.js';
import JournalEntry from '../../finance/models/JournalEntry.js';
import Tenant from '../../core/models/Tenant.js';
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
        if (!supplier) {
            throw new Error("Supplier (Vendor) not found");
        }

        if (supplier.status === 'inactive') {
            const err: any = new Error("Cannot create Purchase Order for an inactive vendor");
            err.statusCode = 400;
            throw err;
        }

        const supShortCode = supplier.shortCode || 'SUP';

        // Supplier Credit Protocol
        if (status === 'COMPLETED' && supplier) {
            const { paymentPromiseDate, overrideCreditLimit } = req.body;

            // If override is TRUE or User is Co-Owner/Owner, skip these checks
            const userRole = req.user?.systemRole?.toLowerCase() || req.user?.role?.toLowerCase() || '';
            const isExempt = userRole === 'co-owner' || userRole === 'owner' || userRole === 'admin';

            if (!paymentPromiseDate && !overrideCreditLimit && !isExempt) {
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
                        error.data = {
                            currentOutstanding,
                            limit: supplier.creditLimit,
                            shortage: (currentOutstanding + newAmount) - supplier.creditLimit
                        };
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
            const catCode = i.category_code || 'CAT';

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
                categoryCode: catCode,
                lotNumber: i.lot_number
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
                if (status === 'COMPLETED' || status === 'RECEIVED') {
                    const { container } = await import('tsyringe');
                    const { InventoryService } = await import('../../inventory/services/InventoryService.js');
                    const inventoryService = container.resolve(InventoryService);

                    const shipping = details.shipping_amount || 0;
                    const subtotalVal = details.subtotal || 1;
                    const itemLandedOverhead = shipping > 0 ? (shipping * (item.amount / subtotalVal)) / item.quantity : 0;
                    const landedRate = Number((item.rate + itemLandedOverhead).toFixed(2));

                    await inventoryService.addStock(
                        item.productId.toString(),
                        item.quantity,
                        landedRate,
                        {
                            batchNumber: (item as any).lotNumber || `${purchaseNumber}-Batch`,
                            expiryDate: undefined,
                            supplierId: purchase.vendorId.toString()
                        },
                        req.user?.tenantId || 'default',
                        req.user,
                        session
                    );
                }
            }
        }

        await purchase.save({ session });

        if (status === 'COMPLETED') {
            const creditPeriod = supplier?.creditPeriod || 30;
            const dueDate = new Date(purchase.date);
            dueDate.setDate(dueDate.getDate() + creditPeriod);

            const isCash = req.body.details?.payment_method === 'Cash';

            const bill = new Bill({
                billNo: `BILL-${purchaseNumber}`,
                vendorInvoiceNo: purchase.invoiceNo,
                date: purchase.date,
                supplier: purchase.vendorId,
                amount: purchase.totalAmount,
                status: isCash ? 'paid' : 'unpaid',
                paymentMethod: req.body.details?.payment_method || 'credit',
                createdBy: req.user?._id,
                description: `Generated from Purchase ${purchaseNumber}`,
                paymentStatus: isCash ? 'paid' : 'unpaid',
                paidAmount: isCash ? purchase.totalAmount : 0,
                dueDate: isCash ? purchase.date : dueDate,
                tenantId: req.user?.tenantId
            });
            await bill.save({ session });

            // ---------------------------------------------------------
            // 4. AUTOMATED LEDGER POSTING (Double Entry Accounting)
            // ---------------------------------------------------------
            try {
                const tenant = await Tenant.findOne({ _id: req.user?.tenantId }).session(session);
                const tenantState = tenant?.address?.state?.toLowerCase() || '';
                const supplierState = supplier.state?.toLowerCase() || '';

                // Tax Logic: Intra-state (Same) -> CGST/SGST, Inter-state (Diff) -> IGST
                const isInterState = tenantState && supplierState && tenantState !== supplierState;

                const taxAmount = details.tax_amount || 0;
                let cgst = 0, sgst = 0, igst = 0;

                if (taxAmount > 0) {
                    if (isInterState) {
                        igst = taxAmount;
                    } else {
                        cgst = taxAmount / 2;
                        sgst = taxAmount / 2;
                    }
                }

                // Ledger Entries
                // Debit: Purchase Account (Base Amount)
                // Debit: Input Tax (CGST/SGST or IGST)
                // Credit: Supplier (Total Amount)

                const journalEntries = [
                    {
                        accountId: 'PURCHASE_ACCOUNT', // Replace with real ID lookup later
                        accountName: 'Purchase Account',
                        debit: details.total_amount - taxAmount,
                        credit: 0
                    },
                    {
                        accountId: supplier._id.toString(),
                        accountName: supplier.businessName,
                        debit: 0,
                        credit: details.total_amount
                    }
                ];

                if (igst > 0) {
                    journalEntries.push({
                        accountId: 'INPUT_IGST',
                        accountName: 'Input IGST',
                        debit: igst,
                        credit: 0
                    });
                } else {
                    if (cgst > 0) {
                        journalEntries.push({
                            accountId: 'INPUT_CGST',
                            accountName: 'Input CGST',
                            debit: cgst,
                            credit: 0
                        });
                    }
                    if (sgst > 0) {
                        journalEntries.push({
                            accountId: 'INPUT_SGST',
                            accountName: 'Input SGST',
                            debit: sgst,
                            credit: 0
                        });
                    }
                }

                const journalEntry = new JournalEntry({
                    tenantId: req.user?.tenantId,
                    date: purchase.date,
                    description: `Purchase Recorded - ${purchase.purchaseNumber}`,
                    reference: purchase.purchaseNumber,
                    entries: journalEntries,
                    status: 'POSTED',
                    createdBy: req.user?._id
                });

                await journalEntry.save({ session });

            } catch (jeError: any) {
                console.error("Ledger Posting Failed:", jeError);
                // We don't block the purchase if ledger fails, but ideally we should.
                // For now, logging error. In strict ERP, this should rollback.
            }
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
            data: err.data // Pass back detailed data for frontend modal
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
        const query: any = {};
        if (req.user?.tenantId) {
            query.tenantId = req.user.tenantId;
        } else {
            query.createdBy = req.user?._id;
        }

        const purchases = await Purchase.find(query)
            .populate('vendorId', 'name businessName')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
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

// ... existing exports ...

export const getSupplierTotals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const totals = await Purchase.aggregate([
            {
                $match: {
                    tenantId: req.user?.tenantId,
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: "$vendorId",
                    totalAmount: { $sum: "$totalAmount" },
                    billCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "suppliers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "supplier"
                }
            },
            { $unwind: "$supplier" },
            {
                $project: {
                    _id: 1,
                    supplierName: "$supplier.businessName",
                    totalAmount: 1,
                    billCount: 1
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);
        res.json(totals);
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
export const getPurchaseHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { itemId } = req.params;
        const tenantId = req.user?.tenantId;

        // Find last 10 purchases containing this item
        const purchases = await Purchase.find({
            tenantId,
            'items.productId': itemId,
            status: 'COMPLETED'
        })
            .sort({ date: -1 })
            .limit(10)
            .populate('vendorId', 'businessName shortCode');

        const history = purchases.map(p => {
            const item = p.items.find(i => i.productId.toString() === itemId);
            return {
                _id: p._id,
                date: p.date,
                vendorName: (p.vendorId as any)?.businessName || 'Unknown',
                vendorId: (p.vendorId as any)?._id,
                quantity: item?.quantity || 0,
                rate: item?.rate || 0,
                unit: item?.unitId || ''
            };
        });

        res.json({ success: true, data: history });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const updatePOStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, expectedDeliveryDate } = req.body;
        const tenantId = req.user?.tenantId;

        const purchase = await Purchase.findOne({ _id: id, tenantId });
        if (!purchase) {
            res.status(404).json({ message: "Purchase Order not found" });
            return;
        }

        if (status) purchase.status = status;
        if (expectedDeliveryDate) purchase.expectedDeliveryDate = new Date(expectedDeliveryDate);

        if (status === 'APPROVED') {
            purchase.approvedBy = req.user?._id as any;
            purchase.approvedAt = new Date();
        } else if (status === 'SENT_TO_VENDOR') {
            purchase.sentToVendorAt = new Date();
        }

        await purchase.save();
        res.json({ success: true, message: `PO status updated to ${status}`, purchase });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export default {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    getSupplierTotals,
    getPurchaseHistory,
    updatePOStatus
};
