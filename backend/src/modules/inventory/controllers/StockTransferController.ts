import { Response } from "express";
import mongoose from "mongoose";
import StockTransfer from "../models/StockTransfer.js";
import Item from "../models/Item.js";
import StockLog from "../models/StockLog.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { AppError } from "../../../utils/AppError.js";
import { error } from "../../../config/logger.js";

/**
 * @desc    Move existing stock from one warehouse to another, with no GRN dependency --
 *          mirrors GRNTransferController.createTransfer's warehouseLevels bookkeeping, minus
 *          the "must trace back to a specific goods receipt" requirement.
 * @route   POST /api/stock-transfers
 * @access  Private
 */
export const createTransfer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?._id;
        const { fromWarehouseId, toWarehouseId, items, notes } = req.body;

        if (!tenantId || !userId) throw new AppError("Unauthorized", 401);
        if (!fromWarehouseId || !toWarehouseId) throw new AppError("Both a from and to warehouse are required", 400);
        if (fromWarehouseId === toWarehouseId) throw new AppError("Source and destination warehouse must be different", 400);
        if (!items || items.length === 0) throw new AppError("At least one item is required", 400);

        const processedItems = [];

        for (const reqItem of items) {
            if (!reqItem.quantity || reqItem.quantity <= 0) {
                throw new AppError(`Quantity must be greater than zero for ${reqItem.productName || reqItem.productId}`, 400);
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
                reason: `Stock Transfer: ${fromWarehouseId} -> ${toWarehouseId}`,
                performedBy: userId
            }], { session });

            processedItems.push({
                productId: reqItem.productId,
                productName: reqItem.productName || item.name,
                quantity: reqItem.quantity
            });
        }

        const lastTransfer = await StockTransfer.findOne({ tenantId }).sort({ createdAt: -1 }).session(session);
        let nextNum = 1;
        if (lastTransfer && lastTransfer.transferNumber) {
            const parts = lastTransfer.transferNumber.split('-');
            const seq = parseInt(parts[parts.length - 1]);
            if (!isNaN(seq)) nextNum = seq + 1;
        }
        const transferNumber = `STR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextNum).padStart(4, '0')}`;

        const transfer = await StockTransfer.create([{
            transferNumber,
            tenantId,
            fromWarehouseId,
            toWarehouseId,
            items: processedItems,
            notes,
            createdBy: userId
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Stock transferred", transfer: transfer[0] });
    } catch (err: any) {
        await session.abortTransaction();
        error(`Create Stock Transfer failed: ${err.message}`);
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

export const getTransfers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId;
        const query: Record<string, any> = { tenantId };
        if (req.query.warehouseId) {
            query.$or = [{ fromWarehouseId: req.query.warehouseId }, { toWarehouseId: req.query.warehouseId }];
        }

        const transfers = await StockTransfer.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: transfers });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export default { createTransfer, getTransfers };
