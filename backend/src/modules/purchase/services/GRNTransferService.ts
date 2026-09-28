import { injectable, inject } from "tsyringe";
import mongoose, { Types } from "mongoose";
import { GRNTransferRepository } from "../repositories/GRNTransferRepository.js";
import { GRNRepository } from "../../../repositories/GRNRepository.js";
import { InventoryService } from "../../inventory/services/InventoryService.js";
import { IGRNTransfer } from "../models/GRNTransfer.js";
import { AppError } from "../../../utils/AppError.js";
import { RequestContext } from "../../../utils/requestContext.js";
import { info } from "../../../config/logger.js";

export interface GRNTransferItemInput {
    productId: string;
    productName?: string;
    quantity: number;
    batchNumber?: string;
}

export interface CreateGRNTransferInput {
    sourceGrnId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: GRNTransferItemInput[];
    notes?: string;
}

/**
 * Moving material received on a GRN from one warehouse to another. All-or-nothing (one
 * transaction): every item must be on the GRN and available in the source warehouse.
 * Restored from the pre-refactor GRNTransferController, whose refactored version only saved
 * the record without moving any stock.
 */
@injectable()
export class GRNTransferService {
    constructor(
        @inject(GRNTransferRepository) private grnTransferRepository: GRNTransferRepository,
        @inject(GRNRepository) private grnRepository: GRNRepository,
        @inject(InventoryService) private inventoryService: InventoryService,
    ) { }

    async createTransfer(ctx: RequestContext, input: CreateGRNTransferInput): Promise<IGRNTransfer> {
        const tenantKey = ctx.tenantId.toString();
        if (input.fromWarehouseId === input.toWarehouseId) {
            throw new AppError("Source and destination warehouse must be different", 400, "SAME_WAREHOUSE");
        }

        const session = await mongoose.startSession();
        try {
            let created: IGRNTransfer | undefined;
            await session.withTransaction(async () => {
                const grn: any = await this.grnRepository.findByIdForTenant(input.sourceGrnId, tenantKey, session);
                if (!grn) throw new AppError("Goods Receipt Note not found", 404, "GRN_NOT_FOUND");

                const processedItems = [];
                for (const line of input.items) {
                    const grnItem = grn.items.find((gi: any) => String(gi.productId) === String(line.productId));
                    if (!grnItem) {
                        throw new AppError(`Item ${line.productName || line.productId} was not received on this GRN`, 400, "ITEM_NOT_ON_GRN");
                    }
                    await this.inventoryService.moveBetweenWarehouses(
                        line.productId,
                        line.quantity,
                        input.fromWarehouseId,
                        input.toWarehouseId,
                        ctx.tenantId,
                        `GRN ${grn.grnNumber}: ${input.fromWarehouseId} -> ${input.toWarehouseId}`,
                        ctx.userId,
                        session,
                    );
                    processedItems.push({
                        productId: new Types.ObjectId(line.productId),
                        productName: line.productName || grnItem.productName,
                        quantity: line.quantity,
                        batchNumber: line.batchNumber || grnItem.lotNumber,
                    });
                }

                const prefix = `GTR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-`;
                const latest = await this.grnTransferRepository.latestNumberWithPrefix(tenantKey, prefix, session);
                const next = latest ? parseInt(latest.slice(prefix.length), 10) + 1 : 1;

                created = await this.grnTransferRepository.create({
                    transferNumber: `${prefix}${String(next).padStart(4, "0")}`,
                    tenantId: tenantKey,
                    sourceGrnId: new Types.ObjectId(input.sourceGrnId),
                    fromWarehouseId: input.fromWarehouseId,
                    toWarehouseId: input.toWarehouseId,
                    items: processedItems as any,
                    notes: input.notes,
                    createdBy: ctx.userId,
                } as Partial<IGRNTransfer>, session);
            });
            info(`GRN transfer created: ${created!.transferNumber}`, { requestId: ctx.requestId, tenantId: tenantKey, grnTransferId: String(created!._id) });
            return created!;
        } finally {
            await session.endSession();
        }
    }

    async listTransfers(ctx: RequestContext, filter: { sourceGrnId?: string } = {}): Promise<IGRNTransfer[]> {
        return this.grnTransferRepository.list(ctx.tenantId.toString(), filter);
    }

    async getTransfer(ctx: RequestContext, id: string): Promise<IGRNTransfer> {
        const transfer = await this.grnTransferRepository.findById(ctx.tenantId.toString(), id);
        if (!transfer) throw new AppError("GRN transfer not found", 404, "GRN_TRANSFER_NOT_FOUND");
        return transfer;
    }
}
