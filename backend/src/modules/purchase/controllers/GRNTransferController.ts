import { Response } from "express";
import mongoose from "mongoose";
import GRNTransfer from "../models/GRNTransfer.js";
import GRN from "../models/GRN.js";
import Item from "../../inventory/models/Item.js";
import StockLog from "../../inventory/models/StockLog.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { AppError } from "../../../utils/AppError.js";
import { error } from "../../../config/logger.js";

/**
 * @desc    Move GRN-received stock from one warehouse/bin location to another, with an
 *          audit trail back to the originating GRN. Mirrors Textilesoft's
 *          GRNwiseMaterialTransfer / GRNwiseComboMaterialTransfer pages.
 * @route   POST /api/grn-transfers
 * @access  Private
 */
export const createTransfer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?._id;
        const { sourceGrnId, fromWarehouseId, toWarehouseId, items, notes } = req.body;

        if (!tenantId || !userId) throw new AppError("Unauthorized", 401);
        if (!sourceGrnId) throw new AppError("Source GRN is required", 400);
        if (!fromWarehouseId || !toWarehouseId) throw new AppError("Both a from and to warehouse are required", 400);
        if (fromWarehouseId === toWarehouseId) throw new AppError("Source and destination warehouse must be different", 400);
        if (!items || items.length === 0) throw new AppError("At least one item is required", 400);

        const grn = await GRN.findOne({ _id: sourceGrnId, tenantId }).session(session);
        if (!grn) throw new AppError("Goods Receipt Note not found", 404);

        const processedItems = [];

        for (const reqItem of items) {
            const grnItem = grn.items.find((gi: any) => String(gi.productId) === String(reqItem.productId));
            if (!grnItem) {
                throw new AppError(`Item ${reqItem.productName || reqItem.productId} was not received on this GRN`, 400);
            }

            const item: any = await Item.findOne({ _id: reqItem.productId, tenantId }).session(session);
            if (!item) throw new AppError(`Item not found: ${reqItem.productId}`, 404);

            const levels = [...(item.warehouseLevels || [])];
            const fromIdx = levels.findIndex((l: any) => l.warehouseId === fromWarehouseId);
            const availableAtSource = fromIdx >= 0 ? levels[fromIdx].qty : 0;

            if (availableAtSource < reqItem.quantity) {
                throw new AppError(
                    `Insufficient stock for ${item.name} at warehouse ${fromWarehouseId}. Available: ${availableAtSource}, requested: ${reqItem.quantity}`,
                    400
                );
            }

            levels[fromIdx] = { ...levels[fromIdx], qty: availableAtSource - reqItem.quantity };

            const toIdx = levels.findIndex((l: any) => l.warehouseId === toWarehouseId);
            if (toIdx >= 0) {
                levels[toIdx] = { ...levels[toIdx], qty: levels[toIdx].qty + reqItem.quantity };
            } else {
                levels.push({ warehouseId: toWarehouseId, qty: reqItem.quantity });
            }

            await Item.findByIdAndUpdate(
                reqItem.productId,
                { $set: { warehouseLevels: levels.filter((l: any) => l.qty > 0 || l.warehouseId === toWarehouseId) } },
                { session }
            );

            // Total stockQty is unaffected -- this is a location move, not a quantity change.
            await StockLog.create([{
                itemId: reqItem.productId,
                tenantId,
                type: 'TRANSFER',
                delta: 0,
                finalQty: item.stockQty,
                reason: `GRN ${grn.grnNumber}: ${fromWarehouseId} -> ${toWarehouseId}`,
                performedBy: userId
            }], { session });

            processedItems.push({
                productId: reqItem.productId,
                productName: reqItem.productName || grnItem.productName,
                quantity: reqItem.quantity,
                batchNumber: reqItem.batchNumber || grnItem.lotNumber
            });
        }

        const lastTransfer = await GRNTransfer.findOne({ tenantId }).sort({ createdAt: -1 }).session(session);
        let nextNum = 1;
        if (lastTransfer && lastTransfer.transferNumber) {
            const parts = lastTransfer.transferNumber.split('-');
            const seq = parseInt(parts[parts.length - 1]);
            if (!isNaN(seq)) nextNum = seq + 1;
        }
        const transferNumber = `GTR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextNum).padStart(4, '0')}`;

        const transfer = await GRNTransfer.create([{
            transferNumber,
            tenantId,
            sourceGrnId,
            fromWarehouseId,
            toWarehouseId,
            items: processedItems,
            notes,
            createdBy: userId
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Material transferred", transfer: transfer[0] });
    } catch (err: any) {
        await session.abortTransaction();
        error(`Create GRN Transfer failed: ${err.message}`);
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

export const getTransfers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId;
        const query: Record<string, any> = { tenantId };
        if (req.query.sourceGrnId) query.sourceGrnId = req.query.sourceGrnId;

        const transfers = await GRNTransfer.find(query)
            .sort({ createdAt: -1 })
            .populate('sourceGrnId', 'grnNumber');
        res.json({ success: true, data: transfers });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export default { createTransfer, getTransfers };
