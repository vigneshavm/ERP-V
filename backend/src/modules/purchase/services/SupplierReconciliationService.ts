import { injectable, inject } from "tsyringe";
import { SupplierReconciliationRepository } from "../repositories/SupplierReconciliationRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { ISupplierReconciliation } from "../models/SupplierReconciliation.js";
import { info } from "../../../config/logger.js";
import { Types } from "mongoose";

@injectable()
export class SupplierReconciliationService {
    constructor(
        @inject(SupplierReconciliationRepository) private reconciliationRepository: SupplierReconciliationRepository
    ) { }

    async markReconciled(
        tenantId: Types.ObjectId,
        userId: Types.ObjectId,
        body: any
    ): Promise<ISupplierReconciliation> {
        const { supplierId, transactionType, transactionId, status = 'RECONCILED', notes } = body;

        if (!supplierId || !transactionType || !transactionId) {
            throw new AppError("Missing required fields: supplierId, transactionType, transactionId", 400);
        }

        const reconciliation = await this.reconciliationRepository.findUpsert(
            transactionId,
            tenantId,
            {
                supplierId: supplierId as any,
                transactionType,
                transactionId,
                status,
                notes,
                reconciledAt: new Date(),
                createdBy: userId
            }
        );

        info(`Transaction reconciled: ${transactionId}`);
        return reconciliation;
    }

    async getReconciliationStatus(supplierId: string, tenantId: Types.ObjectId): Promise<ISupplierReconciliation[]> {
        if (!supplierId) {
            throw new AppError("Supplier ID is required", 400);
        }

        return this.reconciliationRepository.findBySupplier(new Types.ObjectId(supplierId), tenantId);
    }

    async unreconcile(id: string, tenantId: Types.ObjectId, _userId: Types.ObjectId): Promise<void> {
        const reconciliation = await this.reconciliationRepository.findById(id, tenantId);
        if (!reconciliation) {
            throw new AppError("Reconciliation record not found", 404);
        }

        await this.reconciliationRepository.delete(id, tenantId);
        info(`Reconciliation removed: ${reconciliation.transactionId}`);
    }
}
