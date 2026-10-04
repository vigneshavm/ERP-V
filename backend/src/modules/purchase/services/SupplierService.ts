import { injectable, singleton, inject } from "tsyringe";
import { PurchaseSupplierRepository } from "../../../repositories/PurchaseSupplierRepository.js";
import Purchase from "../models/Purchase.js";
import PurchaseReturn from "../models/PurchaseReturn.js";
import Bill from "../../finance/models/Bill.js";
import { sumPaymentOuts } from "../../../integrations/textilesoft/erpPaymentOut.js";
import { sumApprovedDebitNotes } from "../../../integrations/textilesoft/erpDebitNote.js";
import { ISupplier } from "../models/Supplier.js";
import { AppError } from "../../../utils/AppError.js";
import { Types } from "mongoose";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import { createSqlSupplier, deleteSqlSupplier, findSqlSupplier, sqlSupplierList, updateSqlSupplier } from "../../../integrations/textilesoft/sqlSuppliers.js";

/** CRUD + live balance stats for the Purchase module's own Supplier records. */
@injectable()
@singleton()
export class SupplierService {
    constructor(
        @inject(PurchaseSupplierRepository) private supplierRepository: PurchaseSupplierRepository,
    ) { }

    async createSupplier(tenantId: string, userId: string, body: Partial<ISupplier>): Promise<ISupplier> {
        if (isSqlItemSource()) {
            if (!body.businessName?.trim()) throw new AppError("Supplier name is required", 400);
            return await createSqlSupplier(body as Record<string, unknown>) as ISupplier;
        }
        const existing = await this.supplierRepository.findByName(tenantId, body.businessName as string);
        if (existing) throw new AppError("Supplier with this name already exists", 400);

        const lastSupplier = await this.supplierRepository.findLatestForTenant(tenantId);
        let nextId = 1;
        if (lastSupplier?.supplierId?.includes("-")) {
            const lastNum = parseInt(lastSupplier.supplierId.split("-")[1]);
            if (!isNaN(lastNum)) nextId = lastNum + 1;
        }
        const supplierId = `SUP-${nextId.toString().padStart(5, "0")}`;

        return this.supplierRepository.create({
            tenantId,
            supplierId,
            businessName: body.businessName,
            contactPersonName: body.contactPersonName,
            contactNo: body.contactNo,
            email: body.email,
            physicalAddress: body.physicalAddress,
            gstNo: body.gstNo,
            panNo: body.panNo,
            supplierType: body.supplierType,
            openingBalance: body.openingBalance || 0,
            balanceType: body.balanceType || "payable",
            creditPeriod: body.creditPeriod || 0,
            status: body.status || "active",
            supplierGroup: body.supplierGroup || undefined,
            groupId: body.groupId || undefined,
            defaultPaymentMode: body.defaultPaymentMode || "NEFT",
            isOneTime: !!body.isOneTime,
            bankAccounts: body.bankAccounts || [],
            owner: new Types.ObjectId(userId),
        } as Partial<ISupplier>);
    }

    async getSuppliers(tenantId: string): Promise<ISupplier[]> {
        if (isSqlItemSource()) return await sqlSupplierList() as ISupplier[];
        return this.supplierRepository.findAllForTenant(tenantId);
    }

    async getSupplierById(id: string, tenantId: string) {
        if (isSqlItemSource()) {
            const supplier = await findSqlSupplier(id);
            if (!supplier) throw new AppError("Supplier not found", 404);
            return supplier;
        }
        const supplier = await this.supplierRepository.findByIdForTenant(id, tenantId);
        if (!supplier) throw new AppError("Supplier not found", 404);

        const s = supplier as any;
        const [billStats, paymentTotal, debitNoteTotal] = await Promise.all([
            Bill.aggregate([
                { $match: { supplier: s._id, tenantId, status: { $nin: ["draft", "rejected", "cancelled"] } } },
                { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
            ]),
            sumPaymentOuts(String(s._id), ['cleared', 'pending']),
            sumApprovedDebitNotes(String(s._id)),
        ]);

        const totalInvoiced = (billStats[0]?.totalAmount || 0) + (s.manualTotalInvoiced || 0);
        const totalPaid = paymentTotal + (s.manualTotalPaid || 0);
        const totalDebitNotes = debitNoteTotal;
        const openingBalance = s.openingBalance || 0;

        // Net Balance = (Opening + Invoiced) - (Paid + DebitNotes), assuming standard payable context
        const netBalance = openingBalance + totalInvoiced - (totalPaid + totalDebitNotes);

        return {
            ...supplier,
            totalAmount: totalInvoiced,
            totalPaid,
            netBalance,
            debitNoteTotal: totalDebitNotes,
            manualTotalInvoiced: s.manualTotalInvoiced || 0,
            manualTotalPaid: s.manualTotalPaid || 0,
        };
    }

    async updateSupplier(id: string, tenantId: string, updateData: Partial<ISupplier>): Promise<ISupplier> {
        if (isSqlItemSource()) {
            const updated = await updateSqlSupplier(id, updateData as Record<string, unknown>);
            if (!updated) throw new AppError("Supplier not found", 404);
            return updated as ISupplier;
        }
        const existing = await this.supplierRepository.findRawByIdForTenant(id, tenantId);
        if (!existing) throw new AppError("Supplier not found", 404);

        const updated = await this.supplierRepository.updateForTenant(id, tenantId, updateData);
        if (!updated) throw new AppError("Supplier not found", 404);
        return updated;
    }

    async deleteSupplier(id: string, tenantId: string): Promise<void> {
        if (isSqlItemSource()) {
            if (!(await deleteSqlSupplier(id))) throw new AppError("Supplier not found", 404);
            return;
        }
        const hasPurchases = await Purchase.findOne({ vendorId: id, tenantId });
        if (hasPurchases) {
            throw new AppError("Cannot delete supplier with existing purchase records. Please delete associated purchases first.", 400);
        }

        const hasReturns = await PurchaseReturn.findOne({ vendorId: id, tenantId });
        if (hasReturns) {
            throw new AppError("Cannot delete supplier with existing purchase return records. Please delete associated returns first.", 400);
        }

        const supplier = await this.supplierRepository.deleteForTenant(id, tenantId);
        if (!supplier) throw new AppError("Supplier not found", 404);
    }
}
