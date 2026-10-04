import { injectable, inject } from "tsyringe";
import { Types } from "mongoose";
import { SupplierReconciliationRepository } from "../repositories/SupplierReconciliationRepository.js";
import { AppError } from "../../../utils/AppError.js";
import type { SupplierReconciliationEntry } from "../../../integrations/textilesoft/erpSupplierReconciliation.js";
import { info } from "../../../config/logger.js";

@injectable()
export class SupplierReconciliationService {
    constructor(
        @inject(SupplierReconciliationRepository) private reconciliationRepository: SupplierReconciliationRepository
    ) { }

    async markReconciled(
        _tenantId: Types.ObjectId,
        userId: Types.ObjectId,
        body: any
    ): Promise<SupplierReconciliationEntry> {
        const { supplierId, transactionType, transactionId, status = 'RECONCILED', notes } = body;

        if (!supplierId || !transactionType || !transactionId) {
            throw new AppError("Missing required fields: supplierId, transactionType, transactionId", 400);
        }

        const reconciliation = await this.reconciliationRepository.findUpsert(
            transactionId,
            {
                supplierId: String(supplierId),
                transactionType,
                status,
                notes,
                createdBy: String(userId),
            }
        );

        info(`Transaction reconciled: ${transactionId}`);
        return reconciliation;
    }

    async getReconciliationStatus(supplierId: string, _tenantId: Types.ObjectId): Promise<SupplierReconciliationEntry[]> {
        if (!supplierId) {
            throw new AppError("Supplier ID is required", 400);
        }

        return this.reconciliationRepository.findBySupplier(supplierId);
    }

    async unreconcile(id: string, _tenantId: Types.ObjectId, _userId: Types.ObjectId): Promise<void> {
        const reconciliation = await this.reconciliationRepository.findById(id);
        if (!reconciliation) {
            throw new AppError("Reconciliation record not found", 404);
        }

        await this.reconciliationRepository.delete(id);
        info(`Reconciliation removed: ${reconciliation.transactionId}`);
    }
}
