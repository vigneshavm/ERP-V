import { injectable, singleton } from "tsyringe";
import {
    findSupplierReconciliationById,
    listSupplierReconciliationsBySupplier,
    listSupplierReconciliationsByStatus,
    upsertSupplierReconciliation,
    deleteSupplierReconciliation,
    type SupplierReconciliationEntry,
} from "../../../integrations/textilesoft/erpSupplierReconciliation.js";

@injectable()
@singleton()
export class SupplierReconciliationRepository {
    async findById(id: string): Promise<SupplierReconciliationEntry | null> {
        return findSupplierReconciliationById(id);
    }

    async findBySupplier(supplierId: string): Promise<SupplierReconciliationEntry[]> {
        return listSupplierReconciliationsBySupplier(supplierId);
    }

    async findByStatus(status: string): Promise<SupplierReconciliationEntry[]> {
        return listSupplierReconciliationsByStatus(status);
    }

    async findUpsert(
        transactionId: string,
        data: {
            supplierId: string;
            transactionType: SupplierReconciliationEntry["transactionType"];
            status?: SupplierReconciliationEntry["status"];
            notes?: string;
            createdBy?: string;
        },
    ): Promise<SupplierReconciliationEntry> {
        return upsertSupplierReconciliation(transactionId, data);
    }

    async delete(id: string): Promise<boolean> {
        return deleteSupplierReconciliation(id);
    }
}
