import { Response } from "express";
import mongoose from "mongoose";
import GRN from "../models/GRN.js";
import Purchase from "../models/Purchase.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { container } from "tsyringe";
import { InventoryService } from "../../inventory/services/InventoryService.js";

export const createGRN = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?._id;
        const { purchaseId, deliveryNoteNo, warehouseId, items, notes } = req.body;

        if (!tenantId || !userId) throw new Error("Unauthorized");
        if (!purchaseId) throw new Error("Purchase Order ID is required");

        const purchase = await Purchase.findOne({ _id: purchaseId, tenantId }).session(session);
        if (!purchase) throw new Error("Purchase Order not found");

        if (purchase.status === 'CANCELLED') {
            throw new Error("Cannot create Goods Receipt Note against a cancelled Purchase Order");
        }

        const lastGRN = await GRN.findOne({ tenantId }).sort({ createdAt: -1 }).session(session);
        let nextNum = 1;
        if (lastGRN && lastGRN.grnNumber) {
            const parts = lastGRN.grnNumber.split('-');
            const seq = parseInt(parts[parts.length - 1]);
            if (!isNaN(seq)) nextNum = seq + 1;
        }
        const grnNumber = `GRN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextNum).padStart(4, '0')}`;

        const inventoryService = container.resolve(InventoryService);
        const processedItems = [];
        let totalAccepted = 0;
        let totalOrdered = 0;

        const shippingAmount = purchase.shippingAmount || 0;
        const subtotalVal = purchase.subtotal || 1;

        for (const itemInput of items) {
            const poItem = purchase.items.find(i => i.productId.toString() === itemInput.productId);
            const orderedQty = poItem ? poItem.quantity : itemInput.orderedQty || 0;
            const receivedQty = itemInput.receivedQty || 0;
            const damagedQty = itemInput.damagedQty || 0;
            const rejectedQty = itemInput.rejectedQty || 0;
            const acceptedQty = Math.max(0, receivedQty - (damagedQty + rejectedQty));
            const rate = itemInput.rate || poItem?.rate || 0;
            const itemAmount = poItem ? poItem.amount : (rate * orderedQty);

            totalOrdered += orderedQty;
            totalAccepted += acceptedQty;

            // Amortize Landed Shipping Overhead into COGS
            const itemLandedOverhead = (shippingAmount > 0 && acceptedQty > 0)
                ? (shippingAmount * (itemAmount / subtotalVal)) / acceptedQty
                : 0;
            const landedRate = Number((rate + itemLandedOverhead).toFixed(2));

            if (acceptedQty > 0) {
                await inventoryService.addStock(
                    itemInput.productId,
                    acceptedQty,
                    landedRate,
                    {
                        batchNumber: itemInput.lotNumber || `${grnNumber}-Batch`,
                        supplierId: purchase.vendorId.toString()
                    },
                    tenantId,
                    req.user,
                    session
                );
            }

            processedItems.push({
                productId: itemInput.productId,
                productName: itemInput.productName || poItem?.productName || 'Unknown Item',
                orderedQty,
                receivedQty,
                acceptedQty,
                damagedQty,
                rejectedQty,
                rate,
                rejectionReason: itemInput.rejectionReason,
                lotNumber: itemInput.lotNumber || `${grnNumber}-Batch`
            });
        }

        const grnStatus = totalAccepted >= totalOrdered ? 'ACCEPTED' : (totalAccepted > 0 ? 'PARTIAL' : 'REJECTED');

        const grn = new GRN({
            grnNumber,
            tenantId,
            purchaseId: purchase._id,
            vendorId: purchase.vendorId,
            receivedDate: new Date(),
            warehouseId: warehouseId || 'MAIN_WAREHOUSE',
            deliveryNoteNo,
            status: grnStatus,
            items: processedItems,
            notes,
            receivedBy: userId
        });

        await grn.save({ session });

        // Update Purchase Order Status
        purchase.status = totalAccepted >= totalOrdered ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
        await purchase.save({ session });

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "GRN created and stock updated for accepted items", grn });

    } catch (err: any) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

export const getGRNs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId;
        const query: Record<string, any> = { tenantId };
        if (req.query.vendorId) query.vendorId = req.query.vendorId;
        if (req.query.purchaseId) query.purchaseId = req.query.purchaseId;

        const grns = await GRN.find(query)
            .sort({ createdAt: -1 })
            .populate('vendorId', 'businessName shortCode')
            .populate('purchaseId', 'purchaseNumber');
        res.json({ success: true, data: grns });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
