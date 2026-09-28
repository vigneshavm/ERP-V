import { injectable, singleton, inject } from "tsyringe";
import mongoose from "mongoose";
import { GRNRepository } from "../../../repositories/GRNRepository.js";
import { PurchaseRepository } from "../../../repositories/PurchaseRepository.js";
import { InventoryService } from "../../inventory/services/InventoryService.js";
import { IGRN, IGRNItem } from "../models/GRN.js";
import { IUser } from "../../../interfaces/IUser.js";
import { AppError } from "../../../utils/AppError.js";

/**
 * Goods Receipt Note intake: validates the Purchase Order, receives items into stock (landed-cost
 * amortized shipping), and updates the PO's fulfilment status -- all inside one transaction.
 * GRNController only translates HTTP <-> this service.
 */
@injectable()
@singleton()
export class GRNService {
    constructor(
        @inject(GRNRepository) private grnRepository: GRNRepository,
        @inject(PurchaseRepository) private purchaseRepository: PurchaseRepository,
        @inject(InventoryService) private inventoryService: InventoryService,
    ) { }

    private async generateGRNNumber(tenantId: string, session: mongoose.ClientSession): Promise<string> {
        const lastGRN = await this.grnRepository.findLatestForTenant(tenantId, session);
        let nextNum = 1;
        if (lastGRN?.grnNumber) {
            const parts = lastGRN.grnNumber.split("-");
            const seq = parseInt(parts[parts.length - 1]);
            if (!isNaN(seq)) nextNum = seq + 1;
        }
        return `GRN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(nextNum).padStart(4, "0")}`;
    }

    async createGRN(user: IUser, body: any): Promise<IGRN> {
        const tenantId = user.tenantId?.toString();
        if (!tenantId || !user._id) throw new AppError("Unauthorized", 401);

        const { purchaseId, deliveryNoteNo, warehouseId, items, notes } = body;
        if (!purchaseId) throw new AppError("Purchase Order ID is required", 400);

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const purchase = await this.purchaseRepository.findForTenant(purchaseId, tenantId, session);
            if (!purchase) throw new AppError("Purchase Order not found", 404);

            if (purchase.status === "CANCELLED") {
                throw new AppError("Cannot create Goods Receipt Note against a cancelled Purchase Order", 400);
            }

            const grnNumber = await this.generateGRNNumber(tenantId, session);

            const shippingAmount = purchase.shippingAmount || 0;
            const subtotalVal = purchase.subtotal || 1;

            const processedItems: IGRNItem[] = [];
            let totalAccepted = 0;
            let totalOrdered = 0;

            for (const itemInput of items) {
                const poItem = purchase.items.find((i) => i.productId.toString() === itemInput.productId);
                const orderedQty = poItem ? poItem.quantity : itemInput.orderedQty || 0;
                const receivedQty = itemInput.receivedQty || 0;
                const damagedQty = itemInput.damagedQty || 0;
                const rejectedQty = itemInput.rejectedQty || 0;
                const acceptedQty = Math.max(0, receivedQty - (damagedQty + rejectedQty));
                const rate = itemInput.rate || poItem?.rate || 0;
                const itemAmount = poItem ? poItem.amount : rate * orderedQty;

                totalOrdered += orderedQty;
                totalAccepted += acceptedQty;

                // Amortize Landed Shipping Overhead into COGS
                const itemLandedOverhead = shippingAmount > 0 && acceptedQty > 0
                    ? (shippingAmount * (itemAmount / subtotalVal)) / acceptedQty
                    : 0;
                const landedRate = Number((rate + itemLandedOverhead).toFixed(2));

                if (acceptedQty > 0) {
                    await this.inventoryService.addStock(
                        itemInput.productId,
                        acceptedQty,
                        landedRate,
                        {
                            batchNumber: itemInput.lotNumber || `${grnNumber}-Batch`,
                            supplierId: purchase.vendorId.toString(),
                        },
                        tenantId,
                        user,
                        session,
                    );
                }

                processedItems.push({
                    productId: itemInput.productId,
                    productName: itemInput.productName || poItem?.productName || "Unknown Item",
                    orderedQty,
                    receivedQty,
                    acceptedQty,
                    damagedQty,
                    rejectedQty,
                    rate,
                    rejectionReason: itemInput.rejectionReason,
                    lotNumber: itemInput.lotNumber || `${grnNumber}-Batch`,
                } as IGRNItem);
            }

            const grnStatus = totalAccepted >= totalOrdered ? "ACCEPTED" : totalAccepted > 0 ? "PARTIAL" : "REJECTED";

            const grn = await this.grnRepository.create(
                {
                    grnNumber,
                    tenantId,
                    purchaseId: purchase._id,
                    vendorId: purchase.vendorId,
                    receivedDate: new Date(),
                    warehouseId: warehouseId || "MAIN_WAREHOUSE",
                    deliveryNoteNo,
                    status: grnStatus,
                    items: processedItems,
                    notes,
                    receivedBy: user._id,
                } as Partial<IGRN>,
                session,
            );

            purchase.status = totalAccepted >= totalOrdered ? "COMPLETED" : "PARTIALLY_RECEIVED";
            await purchase.save({ session });

            await session.commitTransaction();
            return grn;
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    async getGRNs(tenantId: string, query: { vendorId?: string; purchaseId?: string }): Promise<IGRN[]> {
        return this.grnRepository.findAll({ tenantId, vendorId: query.vendorId, purchaseId: query.purchaseId });
    }
}
