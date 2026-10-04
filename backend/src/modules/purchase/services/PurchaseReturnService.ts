import { injectable, inject } from "tsyringe";
import { Types } from "mongoose";
import { PurchaseReturnRepository, PurchaseReturnScope } from "../repositories/PurchaseReturnRepository.js";
import { DebitNoteRepository } from "../repositories/DebitNoteRepository.js";
import { PurchaseSupplierRepository } from "../../../repositories/PurchaseSupplierRepository.js";
import { GRNRepository } from "../../../repositories/GRNRepository.js";
import { InventoryService } from "../../inventory/services/InventoryService.js";
import { SerializedUnitService } from "../../inventory/services/SerializedUnitService.js";
import { CashBankService } from "../../finance/services/CashBankService.js";
import { IPurchaseReturn } from "../models/PurchaseReturn.js";
import { AppError } from "../../../utils/AppError.js";
import { RequestContext } from "../../../utils/requestContext.js";
import { info } from "../../../config/logger.js";

export type RefundMethod = "credit" | "cash" | "bank_transfer" | "adjust_next_bill";

export interface PurchaseReturnItemInput {
    itemId?: string;
    productName: string;
    quantity: number;
    rate: number;
    tax?: number;
    amount?: number;
    reason?: string;
    /** GRN-wise return: the batch (GRN lotNumber) this quantity comes back from. */
    batchNumber?: string;
    /** Barcode-wise return: the specific serialized unit. */
    serializedUnitId?: string;
}

export interface CreatePurchaseReturnInput {
    supplierId: string;
    items: PurchaseReturnItemInput[];
    billId?: string;
    grnId?: string;
    refundMethod?: RefundMethod;
    bankAccount?: string;
    discount?: number;
    notes?: string;
    returnDate?: string | Date;
}

/** How each item's stock is taken out, decided during validation and applied afterwards. */
type StockAction =
    | { kind: "none" }
    | { kind: "serialized"; itemId: string; unitId: string; serialNumber: string }
    | { kind: "batch"; itemId: string; quantity: number; batchNumber: string }
    | { kind: "legacy"; itemId: string; quantity: number };

const scopeOf = (ctx: RequestContext): PurchaseReturnScope => ({ tenantId: ctx.tenantId, userId: ctx.userId });

/**
 * Purchase returns: goods sent back to a supplier.
 *
 * Creating one (1) takes the stock out -- by serialized unit, by GRN batch (checked against what
 * that GRN accepted), or as a plain quantity -- (2) raises an APPROVED debit note, which is what
 * reduces the supplier's payable in the supplier ledger, (3) saves the return linked to the debit
 * note, and (4) records a cash/bank refund when the supplier paid money back.
 *
 * Ported from the pre-refactor PurchaseReturnController. Differences: everything is validated
 * before any stock moves; returns are tenant-scoped; the old `$inc: { dues }` supplier updates
 * were dropped because `dues` is not a Supplier field (Mongoose discarded them).
 */
@injectable()
export class PurchaseReturnService {
    constructor(
        @inject(PurchaseReturnRepository) private purchaseReturnRepository: PurchaseReturnRepository,
        @inject(DebitNoteRepository) private debitNoteRepository: DebitNoteRepository,
        @inject(PurchaseSupplierRepository) private supplierRepository: PurchaseSupplierRepository,
        @inject(GRNRepository) private grnRepository: GRNRepository,
        @inject(InventoryService) private inventoryService: InventoryService,
        @inject(SerializedUnitService) private serializedUnitService: SerializedUnitService,
        @inject(CashBankService) private cashBankService: CashBankService,
    ) { }

    async createPurchaseReturn(ctx: RequestContext, input: CreatePurchaseReturnInput): Promise<IPurchaseReturn> {
        const tenantKey = ctx.tenantId.toString();
        const { supplierId, items, billId, grnId, bankAccount, notes = "", returnDate } = input;
        const refundMethod: RefundMethod = input.refundMethod ?? "credit";
        const discount = Number(input.discount) || 0;

        const supplier = await this.supplierRepository.findRawByIdForTenant(supplierId, tenantKey);
        if (!supplier) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");

        const sourceGrn: any = grnId ? await this.grnRepository.findByIdForTenant(grnId, tenantKey) : null;
        if (grnId && !sourceGrn) throw new AppError("Goods Receipt Note not found", 404, "GRN_NOT_FOUND");
        if (sourceGrn && String(sourceGrn.vendorId) !== String(supplierId)) {
            throw new AppError("This GRN does not belong to the selected supplier", 400, "GRN_SUPPLIER_MISMATCH");
        }

        // 1. Validate every item and decide its stock action -- nothing is written yet.
        const actions: StockAction[] = [];
        const requestedPerBatch = new Map<string, number>();
        for (const item of items) {
            if (!item.itemId) {
                actions.push({ kind: "none" });
                continue;
            }
            if (item.serializedUnitId) {
                const unit: any = await this.serializedUnitService.findUnitOfItem(item.serializedUnitId, item.itemId, tenantKey);
                if (!unit) throw new AppError(`Serialized unit not found for item ${item.productName}`, 404, "SERIALIZED_UNIT_NOT_FOUND");
                if (unit.status !== "IN_STOCK") {
                    throw new AppError(`Unit ${unit.serialNumber} is ${unit.status}, not returnable (already ${String(unit.status).toLowerCase()})`, 400, "UNIT_NOT_RETURNABLE");
                }
                if (sourceGrn && unit.grnId && String(unit.grnId) !== String(grnId)) {
                    throw new AppError(`Unit ${unit.serialNumber} was not received under this GRN`, 400, "UNIT_NOT_ON_GRN");
                }
                actions.push({ kind: "serialized", itemId: item.itemId, unitId: item.serializedUnitId, serialNumber: unit.serialNumber });
            } else if (sourceGrn && item.batchNumber) {
                const grnItem = sourceGrn.items.find((gi: any) =>
                    String(gi.productId) === String(item.itemId) && (gi.lotNumber || "") === item.batchNumber
                );
                if (!grnItem) {
                    throw new AppError(`Item ${item.productName} / batch ${item.batchNumber} was not received on this GRN`, 400, "BATCH_NOT_ON_GRN");
                }
                const key = `${item.itemId}|${item.batchNumber}`;
                const requested = (requestedPerBatch.get(key) || 0) + item.quantity;
                requestedPerBatch.set(key, requested);
                const alreadyReturned = await this.purchaseReturnRepository.quantityReturnedAgainstGrn(sourceGrn._id, item.itemId, item.batchNumber);
                const remaining = grnItem.acceptedQty - alreadyReturned;
                if (requested > remaining) {
                    throw new AppError(
                        `Cannot return ${requested} of ${item.productName} (batch ${item.batchNumber}) -- only ${remaining} left returnable from this GRN`,
                        400,
                        "RETURN_EXCEEDS_RECEIVED",
                    );
                }
                actions.push({ kind: "batch", itemId: item.itemId, quantity: item.quantity, batchNumber: item.batchNumber });
            } else {
                actions.push({ kind: "legacy", itemId: item.itemId, quantity: item.quantity });
            }
        }

        const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0);
        const taxAmount = items.reduce((sum, i) => sum + (i.quantity * i.rate * (i.tax || 0)) / 100, 0);
        const totalAmount = subtotal + taxAmount - discount;
        const returnId = await this.purchaseReturnRepository.nextReturnId(scopeOf(ctx));

        // 2. Take the stock out.
        for (const action of actions) {
            if (action.kind === "serialized") {
                await this.serializedUnitService.updateStatus(action.unitId, tenantKey, "RETURNED");
                await this.inventoryService.removeReturnedUnit(action.itemId, ctx.tenantId, action.serialNumber, ctx.userId);
            } else if (action.kind === "batch") {
                await this.inventoryService.reduceStockFromBatch(action.itemId, action.quantity, action.batchNumber, tenantKey, ctx.user, "PURCHASE_RETURN");
            } else if (action.kind === "legacy") {
                await this.inventoryService.bulkAdjustStock([action.itemId], action.quantity, "SUBTRACT", tenantKey, ctx.user);
            }
        }

        // 3. Debit note -- the supplier-ledger entry that reduces what we owe.
        const debitNote = await this.debitNoteRepository.create({
            noteId: await this.debitNoteRepository.nextNoteId(ctx.tenantId),
            date: returnDate ? new Date(returnDate) : new Date(),
            vendorId: String(supplierId),
            vendorName: supplier.businessName || "Unknown",
            reason: "RETURN",
            items: items.map((i) => ({
                name: i.productName,
                qty: i.quantity,
                amount: i.amount ?? i.quantity * i.rate * (1 + (i.tax || 0) / 100),
            })),
            totalAmount,
            status: "APPROVED",
            createdBy: String(ctx.userId),
            notes: `Auto-generated from Purchase Return ${returnId}`,
        });

        // 4. The return itself.
        const purchaseReturn = await this.purchaseReturnRepository.create({
            returnId,
            tenantId: ctx.tenantId,
            bill: billId ? new Types.ObjectId(billId) : undefined,
            grnId: grnId ? new Types.ObjectId(grnId) : undefined,
            supplier: new Types.ObjectId(supplierId),
            debitNoteId: String(debitNote._id),
            items: items as any,
            subtotal,
            taxAmount,
            discountAmount: discount,
            totalAmount,
            refundMethod,
            bankAccount: bankAccount ? new Types.ObjectId(bankAccount) : undefined,
            notes,
            returnDate: returnDate ? new Date(returnDate) : new Date(),
            createdBy: ctx.userId,
        });

        // 5. Money back from the supplier, if any.
        await this.cashBankService.recordPurchaseReturnRefund({
            refundMethod,
            bankAccountId: bankAccount,
            amount: totalAmount,
            returnId,
            userId: ctx.userId,
        });

        info(`Purchase return created: ${returnId}`, { requestId: ctx.requestId, tenantId: tenantKey, purchaseReturnId: String(purchaseReturn._id), total: totalAmount });
        return purchaseReturn;
    }

    async listPurchaseReturns(ctx: RequestContext): Promise<IPurchaseReturn[]> {
        return this.purchaseReturnRepository.list(scopeOf(ctx));
    }

    async getPurchaseReturn(ctx: RequestContext, id: string): Promise<IPurchaseReturn> {
        const purchaseReturn = await this.purchaseReturnRepository.findById(scopeOf(ctx), id);
        if (!purchaseReturn) throw new AppError("Purchase return not found", 404, "PURCHASE_RETURN_NOT_FOUND");
        return purchaseReturn;
    }

    /**
     * Deletes a return and fully reverses it: stock goes back (unit / batch / plain quantity, the
     * same way it was taken out), the linked debit note is cancelled so the supplier ledger no
     * longer counts it, and any cash or bank refund is reversed. Checked before anything is written:
     * a serialized unit that has left RETURNED status (e.g. re-sold) blocks the delete.
     */
    async deletePurchaseReturn(ctx: RequestContext, id: string): Promise<void> {
        const tenantKey = ctx.tenantId.toString();
        const purchaseReturn: any = await this.purchaseReturnRepository.findRawById(scopeOf(ctx), id);
        if (!purchaseReturn) throw new AppError("Purchase return not found", 404, "PURCHASE_RETURN_NOT_FOUND");

        // 1. Check every unit can come back before touching anything.
        const units = new Map<string, any>();
        for (const item of purchaseReturn.items || []) {
            if (!item.itemId || !item.serializedUnitId) continue;
            const unit: any = await this.serializedUnitService.findUnitOfItem(String(item.serializedUnitId), String(item.itemId), tenantKey);
            if (!unit || unit.status !== "RETURNED") {
                throw new AppError(
                    `Unit ${unit?.serialNumber ?? item.serializedUnitId} is no longer in RETURNED status, so this return can't be reversed`,
                    409,
                    "RETURN_NOT_REVERSIBLE",
                );
            }
            units.set(String(item.serializedUnitId), unit);
        }

        // 2. Put the stock back.
        for (const item of purchaseReturn.items || []) {
            if (!item.itemId) continue;
            const itemId = String(item.itemId);
            if (item.serializedUnitId) {
                const unit = units.get(String(item.serializedUnitId));
                await this.serializedUnitService.updateStatus(String(item.serializedUnitId), tenantKey, "IN_STOCK");
                await this.inventoryService.restoreReturnedUnit(itemId, ctx.tenantId, unit.serialNumber, ctx.userId);
            } else if (purchaseReturn.grnId && item.batchNumber) {
                await this.inventoryService.restoreBatchFromReturn(itemId, item.quantity, item.batchNumber, item.rate, purchaseReturn.supplier, ctx.tenantId, ctx.userId);
            } else {
                await this.inventoryService.bulkAdjustStock([itemId], item.quantity, "ADD", tenantKey, ctx.user);
            }
        }

        // 3. The supplier ledger stops counting the return.
        if (purchaseReturn.debitNoteId) {
            await this.debitNoteRepository.cancel(ctx.tenantId, purchaseReturn.debitNoteId, `Cancelled: purchase return ${purchaseReturn.returnId} deleted`);
        }

        // 4. Money the supplier paid back is reversed.
        if (purchaseReturn.refundMethod === "bank_transfer" && purchaseReturn.bankAccount) {
            await this.cashBankService.reversePurchaseReturnBankRefund({
                bankAccountId: purchaseReturn.bankAccount,
                amount: purchaseReturn.totalAmount,
                returnId: purchaseReturn.returnId,
                userId: ctx.userId,
            });
        } else if (purchaseReturn.refundMethod === "cash") {
            await this.cashBankService.reversePurchaseReturnCashRefund({
                amount: purchaseReturn.totalAmount,
                returnId: purchaseReturn.returnId,
                userId: ctx.userId,
            });
        }

        await this.purchaseReturnRepository.delete(scopeOf(ctx), id);
        info(`Purchase return deleted and reversed: ${purchaseReturn.returnId}`, { requestId: ctx.requestId, tenantId: tenantKey, total: purchaseReturn.totalAmount });
    }
}
