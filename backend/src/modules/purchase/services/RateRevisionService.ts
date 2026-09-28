import { injectable, inject } from "tsyringe";
import mongoose, { Types } from "mongoose";
import { RateRevisionRepository } from "../repositories/RateRevisionRepository.js";
import { PurchaseSupplierRepository } from "../../../repositories/PurchaseSupplierRepository.js";
import { InventoryService } from "../../inventory/services/InventoryService.js";
import { SupplierPayableService } from "../../finance/services/SupplierPayableService.js";
import { IRateRevision } from "../models/RateRevision.js";
import { AppError } from "../../../utils/AppError.js";
import { RequestContext } from "../../../utils/requestContext.js";
import { info, error as logError } from "../../../config/logger.js";

export interface CreateRateRevisionInput {
    itemId: string;
    supplierId: string;
    batchNumber: string;
    oldRate: number;
    newRate: number;
    affectedQty: number;
    reason?: string;
}

/**
 * Rate revisions: a supplier raises the price of goods already received (per batch).
 *
 * Approval (1) sets the batch's cost to the new rate (and re-derives the item's average cost),
 * then, in one transaction, (2) adds the difference to what we owe the supplier -- an unpaid
 * supplier bill plus journal entry -- and (3) marks the revision APPROVED. If (2)/(3) fail the
 * batch cost is put back. A revision can only be decided once.
 */
@injectable()
export class RateRevisionService {
    constructor(
        @inject(RateRevisionRepository) private rateRevisionRepository: RateRevisionRepository,
        @inject(PurchaseSupplierRepository) private supplierRepository: PurchaseSupplierRepository,
        @inject(InventoryService) private inventoryService: InventoryService,
        @inject(SupplierPayableService) private supplierPayableService: SupplierPayableService,
    ) { }

    async createRevision(ctx: RequestContext, input: CreateRateRevisionInput): Promise<IRateRevision> {
        const tenantKey = ctx.tenantId.toString();
        if (input.newRate <= input.oldRate) {
            throw new AppError("New rate must be higher than old rate (use a debit note for a reduction)", 400, "RATE_NOT_HIGHER");
        }
        const supplier = await this.supplierRepository.findRawByIdForTenant(input.supplierId, tenantKey);
        if (!supplier) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");

        const revision = await this.rateRevisionRepository.create({
            itemId: new Types.ObjectId(input.itemId),
            supplierId: new Types.ObjectId(input.supplierId),
            batchNumber: input.batchNumber,
            oldRate: input.oldRate,
            newRate: input.newRate,
            affectedQty: input.affectedQty,
            diffAmount: (input.newRate - input.oldRate) * input.affectedQty,
            reason: input.reason || "",
            status: "PENDING",
            tenantId: tenantKey,
            createdBy: ctx.userId,
        });
        info("Rate revision created", { requestId: ctx.requestId, tenantId: tenantKey, rateRevisionId: String(revision._id) });
        return revision;
    }

    async listRevisions(ctx: RequestContext): Promise<IRateRevision[]> {
        return this.rateRevisionRepository.list(ctx.tenantId.toString());
    }

    async approveRevision(ctx: RequestContext, id: string): Promise<IRateRevision> {
        const tenantKey = ctx.tenantId.toString();
        const revision = await this.rateRevisionRepository.findById(tenantKey, id);
        if (!revision) throw new AppError("Rate revision not found", 404, "RATE_REVISION_NOT_FOUND");
        if (revision.status !== "PENDING") throw new AppError(`Rate revision is already ${revision.status.toLowerCase()}`, 409, "RATE_REVISION_DECIDED");

        const supplier: any = await this.supplierRepository.findRawByIdForTenant(String(revision.supplierId), tenantKey);
        if (!supplier) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");

        // 1. Batch cost -- also proves the item/batch exists before anything is posted.
        await this.inventoryService.updateBatchCost(String(revision.itemId), revision.batchNumber, revision.newRate, tenantKey, ctx.user);

        // 2 + 3. Payable and status, together.
        const session = await mongoose.startSession();
        try {
            let approved: IRateRevision | null = null;
            await session.withTransaction(async () => {
                approved = await this.rateRevisionRepository.decide(tenantKey, id, "APPROVED", ctx.userId, session);
                if (!approved) throw new AppError("Rate revision was already decided", 409, "RATE_REVISION_DECIDED");
                await this.supplierPayableService.postSupplierCharge({
                    tenantId: ctx.tenantId,
                    userId: ctx.userId,
                    supplier,
                    amount: revision.diffAmount,
                    reference: `RRV-${String(revision._id).slice(-8).toUpperCase()}`,
                    description: `Rate revision: batch ${revision.batchNumber}, ${revision.affectedQty} x (${revision.newRate} - ${revision.oldRate})`,
                    session,
                });
            });
            info("Rate revision approved", { requestId: ctx.requestId, tenantId: tenantKey, rateRevisionId: id, amount: revision.diffAmount });
            return approved as unknown as IRateRevision;
        } catch (err) {
            // Put the batch cost back so cost and payables stay consistent.
            try {
                await this.inventoryService.updateBatchCost(String(revision.itemId), revision.batchNumber, revision.oldRate, tenantKey, ctx.user);
            } catch (revertErr) {
                logError("Rate revision: could not restore batch cost after a failed approval", { requestId: ctx.requestId, rateRevisionId: id, error: (revertErr as Error).message });
            }
            throw err;
        } finally {
            await session.endSession();
        }
    }

    async rejectRevision(ctx: RequestContext, id: string): Promise<IRateRevision> {
        const tenantKey = ctx.tenantId.toString();
        const rejected = await this.rateRevisionRepository.decide(tenantKey, id, "REJECTED", ctx.userId);
        if (!rejected) {
            const existing = await this.rateRevisionRepository.findById(tenantKey, id);
            if (!existing) throw new AppError("Rate revision not found", 404, "RATE_REVISION_NOT_FOUND");
            throw new AppError(`Rate revision is already ${existing.status.toLowerCase()}`, 409, "RATE_REVISION_DECIDED");
        }
        info("Rate revision rejected", { requestId: ctx.requestId, tenantId: tenantKey, rateRevisionId: id });
        return rejected;
    }
}
