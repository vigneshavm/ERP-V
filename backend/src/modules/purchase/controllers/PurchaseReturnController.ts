import { Request, Response } from 'express';
import mongoose from 'mongoose';

import PurchaseReturn from '../models/PurchaseReturn.js';
// import Bill from '../../../models/Bill.js'; (Unused)
import Supplier from '../../crm/models/Supplier.js';
import BankAccount from '../../finance/models/BankAccount.js';
import CashbankTransaction from '../../finance/models/CashbankTransaction.js';
import { info, error } from '../../../config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
}

// ReturnItem interface removed to fix build

/**
 * @swagger
 * /api/purchase-returns:
 *   post:
 *     summary: Create a new purchase return
 *     tags: [Purchase - Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplierId, items]
 *             properties:
 *               supplierId: { type: string }
 *               items: { type: array, items: { type: object } }
 *     responses:
 *       201:
 *         description: Purchase return created successfully
 */
// Imports at top
import { container } from "tsyringe";
import { InventoryService } from '../../inventory/services/InventoryService.js';
import DebitNote from '../models/DebitNote.js';
import GRN from '../models/GRN.js';
import SerializedUnit from '../../inventory/models/SerializedUnit.js';
import Item from '../../inventory/models/Item.js';
import StockLog from '../../inventory/models/StockLog.js';
import { SerializedUnitService } from '../../inventory/services/SerializedUnitService.js';
import { AppError } from '../../../utils/AppError.js';

export const createPurchaseReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            billId,
            supplierId,
            grnId,
            items,
            refundMethod,
            bankAccount,
            discount = 0,
            notes = '',
            returnDate
        } = req.body;

        if (!supplierId || !items || items.length === 0) {
            res.status(400).json({ message: 'Supplier and items are required' });
            return;
        }

        const tenantId = req.user?.tenantId; // Assuming tenantId is on user
        if (!tenantId) {
            res.status(401).json({ message: 'Unauthorized: Missing Tenant ID' });
            return;
        }

        // When this return is scoped to a specific GRN, validate it up front and load it once
        // -- each item's requested return quantity gets checked against that GRN's own
        // acceptedQty (minus whatever's already been returned against it) below, so a cashier
        // can't return more of a batch than was actually received.
        let sourceGrn: any = null;
        if (grnId) {
            sourceGrn = await GRN.findOne({ _id: grnId, tenantId });
            if (!sourceGrn) {
                res.status(404).json({ message: 'Goods Receipt Note not found' });
                return;
            }
            if (String(sourceGrn.vendorId) !== String(supplierId)) {
                res.status(400).json({ message: 'This GRN does not belong to the selected supplier' });
                return;
            }
        }

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
        const taxAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate * item.tax / 100), 0);
        const totalAmount = subtotal + taxAmount - discount;

        // Generate ID
        const count = await PurchaseReturn.countDocuments({ createdBy: req.user?._id });
        const returnId = `PR-${String(count + 1).padStart(5, '0')}`;

        // 1. Adjust Stock (Reduce Inventory)
        const inventoryService = container.resolve(InventoryService);
        const serializedUnitService = container.resolve(SerializedUnitService);

        for (const item of items) {
            if (!item.itemId) continue;

            if (item.serializedUnitId) {
                // Barcode-wise return: one specific physical unit, not a batch quantity.
                const unit = await SerializedUnit.findOne({ _id: item.serializedUnitId, tenantId, itemId: item.itemId });
                if (!unit) {
                    throw new AppError(`Serialized unit not found for item ${item.productName}`, 404);
                }
                if (unit.status !== 'IN_STOCK') {
                    throw new AppError(`Unit ${unit.serialNumber} is ${unit.status}, not returnable (already ${unit.status.toLowerCase()})`, 400);
                }
                if (sourceGrn && unit.grnId && String(unit.grnId) !== String(grnId)) {
                    throw new AppError(`Unit ${unit.serialNumber} was not received under this GRN`, 400);
                }

                await serializedUnitService.updateStatus(item.serializedUnitId, tenantId, 'RETURNED');

                const currentItem: any = await Item.findOne({ _id: item.itemId, tenantId });
                await Item.findByIdAndUpdate(item.itemId, { $inc: { stockQty: -1 } });
                await StockLog.create({
                    itemId: item.itemId,
                    tenantId,
                    type: 'RETURN',
                    delta: -1,
                    finalQty: (currentItem?.stockQty || 1) - 1,
                    reason: `PURCHASE_RETURN: Unit ${unit.serialNumber}`,
                    performedBy: req.user?._id
                });
            } else if (sourceGrn && item.batchNumber) {
                // GRN-wise/lot-wise return: validate against what that GRN actually accepted,
                // minus anything already returned against this same GRN+item+batch.
                const grnItem = sourceGrn.items.find((gi: any) =>
                    String(gi.productId) === String(item.itemId) && (gi.lotNumber || '') === item.batchNumber
                );
                if (!grnItem) {
                    throw new AppError(`Item ${item.productName} / batch ${item.batchNumber} was not received on this GRN`, 400);
                }

                const priorReturns = await PurchaseReturn.aggregate([
                    { $match: { grnId: sourceGrn._id } },
                    { $unwind: '$items' },
                    { $match: { 'items.itemId': new mongoose.Types.ObjectId(item.itemId), 'items.batchNumber': item.batchNumber } },
                    { $group: { _id: null, total: { $sum: '$items.quantity' } } }
                ]);
                const alreadyReturned = priorReturns[0]?.total || 0;
                const remaining = grnItem.acceptedQty - alreadyReturned;
                if (item.quantity > remaining) {
                    throw new AppError(`Cannot return ${item.quantity} of ${item.productName} (batch ${item.batchNumber}) -- only ${remaining} left returnable from this GRN`, 400);
                }

                await inventoryService.reduceStockFromBatch(
                    item.itemId,
                    item.quantity,
                    item.batchNumber,
                    tenantId,
                    req.user,
                    'PURCHASE_RETURN'
                );
            } else {
                // Legacy path: a return with no GRN/batch scoping, unchanged from before.
                await inventoryService.bulkAdjustStock(
                    [item.itemId],
                    item.quantity,
                    'SUBTRACT',
                    tenantId,
                    req.user
                );
            }
        }

        // 2. Create Debit Note (Financial Document)
        // Count for Debit Note ID
        const dnCount = await DebitNote.countDocuments({ createdBy: req.user?._id }); // Scoped to user or tenant? DebitNote createdBy matches. 
        const noteId = `DN-${String(dnCount + 1).padStart(5, '0')}`;

        const debitNote = await DebitNote.create({
            noteId,
            date: returnDate || new Date(),
            vendorId: supplierId,
            vendorName: (await Supplier.findById(supplierId))?.businessName || 'Unknown', // Ideally fetch once
            reason: 'RETURN', // Since this is a Purchase Return
            items: items.map((i: any) => ({
                name: i.productName,
                qty: i.quantity,
                amount: i.amount
            })),
            totalAmount: totalAmount,
            status: 'APPROVED', // Auto-approved as it comes from a Return
            createdBy: req.user?._id,
            notes: `Auto-generated from Purchase Return ${returnId}`
        });

        // 3. Create Purchase Return with Link
        const purchaseReturn = await PurchaseReturn.create({
            returnId,
            bill: billId || null,
            grnId: grnId || null,
            supplier: supplierId,
            debitNoteId: debitNote._id, // Link here
            items,
            subtotal,
            taxAmount,
            discountAmount: discount,
            totalAmount,
            refundMethod,
            bankAccount,
            notes,
            returnDate: returnDate || new Date(),
            createdBy: req.user?._id
        });

        // Handle Refunds / Dues (Same logic as before, but ensure consistent with Debit Note)
        // If refundMethod is 'credit' (default), the Debit Note effectively stands as the credit.
        // The Debit Note creation (if we were using DebitNoteService) might handle ledger.
        // But here we do it manually.

        // Update Supplier Dues (Debit reduces payables)
        // *Only if* the Debit Note handling relies on us updating the supplier. 
        // Since we created the Debit Note manually above, we Update Supplier Dues here.

        if (refundMethod === 'credit' || refundMethod === 'adjust_next_bill') {
            await Supplier.findByIdAndUpdate(supplierId, {
                $inc: { dues: -totalAmount }
            });
        }
        // If refundMethod is 'cash' or 'bank', we also record the Money In transaction (as before),
        // effectively "settling" the Debit Note immediately.
        // We should probably mark Debit Note as 'SETTLED' or 'Redeemed' if cash returned? 
        // Standard flow: Return -> Debit Note (Asset) -> Refund (Cash) -> Closes Debit Note.
        // For simplicity, we just leave Debit Note as APPROVED and reduce dues. 
        // If Cash comes in, it technically increases Asset (Cash) and Reduces Asset (Debit Note / Dues).
        // The code below handles 'Money In' and 'Supplier Dues' update.

        // Handle Bank/Cash logic (Existing Code preserved/adapted)
        if (refundMethod === 'bank_transfer' && bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: bankAccount, userId: req.user?._id });
            if (bankAcc) {
                await CashbankTransaction.create({
                    type: 'in',
                    amount: totalAmount,
                    toAccount: bankAccount,
                    fromAccount: 'purchase_return',
                    description: `Refund for purchase return ${returnId}`,
                    date: new Date(),
                    userId: req.user?._id,
                });
                await BankAccount.updateOne({ _id: bankAccount }, { $inc: { currentBalance: totalAmount } });
            }
            // Even if cash returned, we update supplier dues? 
            // If we reduced stock (Asset down), we expect Cash (Asset up). Net zero.
            // Supplier balance shouldn't change if it's a cash transaction? 
            // Wait. Purchase (Credit) -> Stock Up, Payable Up.
            // Return (Cash) -> Stock Down, Cash Up. Payable stays same (billed amount is owed).
            // Return (Credit) -> Stock Down, Payable Down.
            // The code below updates dues even for cash/bank. This implies the 'Bill' is still open and we are just getting money back?
            // Or does it mean we paid for it, and now getting refund?
            // If we paid, Dues = 0. Refund makes Dues negative (Advance)?
            // Let's stick to existing logic: $inc: { dues: -totalAmount }.
            // If refund is cash, we record cash IN. 
            // But if we record Cash IN, we shouldn't reduce Payable? 
            // If we reduce Payable AND get Cash, we double dip? 
            // Correct Accounting:
            // 1. Credit Return: Dr Supplier (Liability Down), Cr Purchase Return / Stock (Asset Down).
            // 2. Cash Return: Dr Cash (Asset Up), Cr Purchase Return / Stock (Asset Down). Supplier untouched.

            // The logic `if (refundMethod === 'credit' ...)` handles case 1.
            // The logic below handles case 2 (Cash/Bank).
            // So we should NOT update Supplier Dues if it's Cash/Bank?
            // Existing code DID update supplier dues unconditionally.
            // Line 135: await Supplier.findByIdAndUpdate ...

            // I will refine this: Only update Supplier Dues if refundMethod is NOT cash/bank.
            // Actually, if I update Dues, I am saying "I owe you less". 
            // If they give me cash, I owe them less? No, the transaction is settled.
            // Logic:
            // Case A (Credit): I return goods. I owe less. Dues decrease.
            // Case B (Cash): I return goods. They give cash. I owe same amount for the original bill.
            // The previous implementation reduced dues unconditionally. This seems buggy for Cash refunds if meant to track "Outstanding for Bill".
            // However, maybe "Dues" tracks generic balance. 
            // Let's stick to: Update Dues for Credit/Adjust. Update Cash for Cash/Bank.

        } else if (refundMethod === 'cash') {
            await CashbankTransaction.create({
                type: 'in',
                amount: totalAmount,
                toAccount: 'cash',
                fromAccount: 'purchase_return',
                description: `Cash refund for purchase return ${returnId}`,
                date: new Date(),
                userId: req.user?._id,
            });
            // Cash received.
        } else {
            // Credit / Adjust
            await Supplier.findByIdAndUpdate(supplierId, {
                $inc: { dues: -totalAmount }
            });
        }

        res.status(201).json(purchaseReturn);
    } catch (err) {
        error(`Create Purchase Return error: ${(err as Error).message}`);
        res.status((err as any).statusCode || 500).json({ message: (err as Error).message || 'Server Error' });
    }
};

/**
 * @swagger
 * /api/purchase-returns:
 *   get:
 *     summary: Get all purchase returns
 *     tags: [Purchase - Returns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchase returns retrieved
 */
export const getAllPurchaseReturns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const returns = await PurchaseReturn.find({ createdBy: req.user?._id })
            .populate('supplier', 'businessName')
            .populate('grnId', 'grnNumber')
            .sort({ createdAt: -1 });
        res.status(200).json(returns);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc Get single purchase return by ID
 * @route GET /api/purchase-returns/:id
 */
/**
 * @swagger
 * /api/purchase-returns/{id}:
 *   get:
 *     summary: Get single purchase return by ID
 *     tags: [Purchase - Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Purchase return details retrieved
 */
export const getPurchaseReturnById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid ID format' });
            return;
        }
        const pr = await PurchaseReturn.findOne({ _id: req.params.id, createdBy: req.user?._id })
            .populate('supplier', 'businessName')
            .populate('bill', 'billNo')
            .populate('grnId', 'grnNumber');
        if (!pr) {
            res.status(404).json({ message: 'Purchase return not found' });
            return;
        }
        res.status(200).json(pr);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc Delete purchase return (reversal)
 * @route DELETE /api/purchase-returns/:id
 */
export const deletePurchaseReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid ID format' });
            return;
        }

        const pr = await PurchaseReturn.findOne({ _id: id, createdBy: req.user?._id });
        if (!pr) {
            res.status(404).json({ message: 'Purchase return not found' });
            return;
        }

        // Handle Bank Refund Reversal
        if (pr.refundMethod === 'bank_transfer' && pr.bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: pr.bankAccount, userId: req.user?._id });
            if (bankAcc) {
                // Find and delete the associated cashbank transaction
                const cashbankTxn = await CashbankTransaction.findOne({
                    amount: pr.totalAmount,
                    toAccount: pr.bankAccount,
                    type: 'in', // IN was reversed, so we deduct it
                    description: new RegExp(`purchase return ${pr.returnId}`),
                    userId: req.user?._id
                });

                if (cashbankTxn) {
                    // Update bank balance (deduct money because 'in' is being reversed)
                    await BankAccount.updateOne(
                        { _id: pr.bankAccount },
                        {
                            $inc: { currentBalance: -pr.totalAmount },
                            $pull: { transactions: cashbankTxn._id }
                        }
                    );
                    await CashbankTransaction.findByIdAndDelete(cashbankTxn._id);
                }
            }
        }

        // Reverse Supplier Dues (Add back the dues because PR reduced them)
        await Supplier.findByIdAndUpdate(pr.supplier, {
            $inc: { dues: pr.totalAmount }
        });

        // Delete the purchase return record
        await PurchaseReturn.findByIdAndDelete(id);

        info(`Purchase return deleted: ${pr.returnId} - Reversed ₹${pr.totalAmount}`);
        res.status(200).json({ message: 'Purchase return deleted and reversed successfully' });
    } catch (err) {
        error(`Delete Purchase Return error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error' });
    }
};

export default {
    createPurchaseReturn,
    getAllPurchaseReturns,
    getPurchaseReturnById,
    deletePurchaseReturn,
};
