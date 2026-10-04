import { injectable, inject } from "tsyringe";
import { DebitNoteRepository } from "../repositories/DebitNoteRepository.js";
import { PurchaseSupplierRepository } from "../../../repositories/PurchaseSupplierRepository.js";
import { InventoryService } from "../../inventory/services/InventoryService.js";
import type { DebitNoteEntry, DebitNoteReason as SqlDebitNoteReason } from "../../../integrations/textilesoft/erpDebitNote.js";
import { AppError } from "../../../utils/AppError.js";
import { RequestContext } from "../../../utils/requestContext.js";
import { info, error as logError } from "../../../config/logger.js";

export type DebitNoteReason = SqlDebitNoteReason;
export type DebitNoteStatus = DebitNoteEntry["status"];

export interface DebitNoteItemInput {
    itemId?: string;
    name: string;
    qty: number;
    /** Line amount (qty x rate incl. tax), as stored on the note and counted in the supplier ledger. */
    amount: number;
}

export interface CreateDebitNoteInput {
    vendorId: string;
    reason: DebitNoteReason;
    items: DebitNoteItemInput[];
    status?: "DRAFT" | "PENDING" | "APPROVED";
    date?: string | Date;
    notes?: string;
    poReference?: string;
    branchId?: string;
}

/** Reasons where approving the note takes the listed stock out (same set as before the refactor). */
const STOCK_REASONS: DebitNoteReason[] = ["RETURN", "QUALITY", "SHORTAGE", "OTHER"];

/** Which status changes are allowed. APPROVED is final: it has moved stock and counts in the supplier ledger. */
const TRANSITIONS: Record<DebitNoteStatus, DebitNoteStatus[]> = {
    DRAFT: ["PENDING", "APPROVED", "REJECTED"],
    PENDING: ["DRAFT", "APPROVED", "REJECTED"],
    REJECTED: ["DRAFT"],
    APPROVED: [],
};

/**
 * Manual debit notes (price difference, quality, shortage, ...). An APPROVED note reduces what we
 * owe the supplier (supplier ledger) and, for stock reasons, takes the listed items out of stock.
 * Notes raised by purchase returns are created by PurchaseReturnService, not here.
 */
@injectable()
export class DebitNoteService {
    constructor(
        @inject(DebitNoteRepository) private debitNoteRepository: DebitNoteRepository,
        @inject(PurchaseSupplierRepository) private supplierRepository: PurchaseSupplierRepository,
        @inject(InventoryService) private inventoryService: InventoryService,
    ) { }

    async createDebitNote(ctx: RequestContext, input: CreateDebitNoteInput): Promise<DebitNoteEntry> {
        const tenantKey = ctx.tenantId.toString();
        const supplier: any = await this.supplierRepository.findRawByIdForTenant(input.vendorId, tenantKey);
        if (!supplier) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");

        const status = input.status ?? "DRAFT";
        const takesStock = status === "APPROVED" && STOCK_REASONS.includes(input.reason);
        if (takesStock) await this.assertStock(ctx, input.items);

        const note = await this.debitNoteRepository.create({
            noteId: await this.debitNoteRepository.nextNoteId(ctx.tenantId),
            date: input.date ? new Date(input.date) : new Date(),
            vendorId: input.vendorId,
            vendorName: supplier.businessName || "Unknown",
            reason: input.reason,
            items: input.items.map((i) => ({
                ...(i.itemId ? { itemId: i.itemId } : {}),
                name: i.name,
                qty: i.qty,
                amount: i.amount,
            })),
            totalAmount: input.items.reduce((sum, i) => sum + i.amount, 0),
            status,
            poReference: input.poReference,
            branchId: input.branchId || "Main",
            notes: input.notes,
            createdBy: String(ctx.userId),
        });

        if (takesStock) {
            try {
                await this.takeStockOut(ctx, note);
            } catch (err) {
                // Leave a note that clearly didn't happen rather than an APPROVED one without its stock effect.
                await this.debitNoteRepository.transitionStatus(ctx.tenantId, String(note._id), ["APPROVED"], "DRAFT");
                throw err;
            }
        }

        info(`Debit note created: ${note.noteId}`, { requestId: ctx.requestId, tenantId: tenantKey, debitNoteId: String(note._id), status });
        return note;
    }

    async listDebitNotes(ctx: RequestContext): Promise<DebitNoteEntry[]> {
        return this.debitNoteRepository.findAll(ctx.tenantId);
    }

    async getDebitNote(ctx: RequestContext, id: string): Promise<DebitNoteEntry> {
        const note = await this.debitNoteRepository.findById(id, ctx.tenantId);
        if (!note) throw new AppError("Debit note not found", 404, "DEBIT_NOTE_NOT_FOUND");
        return note;
    }

    async changeStatus(ctx: RequestContext, id: string, to: DebitNoteStatus): Promise<DebitNoteEntry> {
        const note = await this.getDebitNote(ctx, id);
        if (note.status === to) return note;
        if (!TRANSITIONS[note.status].includes(to)) {
            throw new AppError(`A ${note.status.toLowerCase()} debit note can't be changed to ${to.toLowerCase()}`, 409, "DEBIT_NOTE_INVALID_TRANSITION");
        }

        const takesStock = to === "APPROVED" && STOCK_REASONS.includes(note.reason);
        if (takesStock) await this.assertStock(ctx, note.items.map((i) => ({ itemId: i.itemId ? String(i.itemId) : undefined, name: i.name, qty: i.qty, amount: i.amount })));

        const updated = await this.debitNoteRepository.transitionStatus(ctx.tenantId, id, [note.status], to);
        if (!updated) throw new AppError("This debit note was changed by someone else; refresh and try again", 409, "DEBIT_NOTE_CHANGED");

        if (takesStock) {
            try {
                await this.takeStockOut(ctx, updated);
            } catch (err) {
                await this.debitNoteRepository.transitionStatus(ctx.tenantId, id, ["APPROVED"], note.status);
                throw err;
            }
        }
        info(`Debit note ${updated.noteId}: ${note.status} -> ${to}`, { requestId: ctx.requestId, tenantId: ctx.tenantId.toString(), debitNoteId: id });
        return updated;
    }

    async deleteDebitNote(ctx: RequestContext, id: string): Promise<void> {
        const note = await this.getDebitNote(ctx, id);
        if (note.status === "APPROVED") {
            throw new AppError("Approved debit notes can't be deleted (they have moved stock and count in the supplier ledger)", 409, "DEBIT_NOTE_APPROVED");
        }
        await this.debitNoteRepository.delete(id, ctx.tenantId);
        info(`Debit note deleted: ${note.noteId}`, { requestId: ctx.requestId, tenantId: ctx.tenantId.toString() });
    }

    private async assertStock(ctx: RequestContext, items: DebitNoteItemInput[]): Promise<void> {
        const lines = items.filter((i) => i.itemId).map((i) => ({ itemId: String(i.itemId), quantity: i.qty, label: i.name }));
        if (lines.length) await this.inventoryService.assertStockAvailable(lines, ctx.tenantId);
    }

    private async takeStockOut(ctx: RequestContext, note: DebitNoteEntry): Promise<void> {
        for (const item of note.items) {
            if (!item.itemId) continue;
            try {
                await this.inventoryService.reduceStock(String(item.itemId), item.qty, ctx.tenantId, ctx.user, `DEBIT_NOTE_${note.reason}`);
            } catch (err) {
                logError(`Debit note ${note.noteId}: stock reduction failed for ${item.name}`, { requestId: ctx.requestId, error: (err as Error).message });
                throw err;
            }
        }
    }
}
