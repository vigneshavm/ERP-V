import { sqlSupplierList } from "../../../integrations/textilesoft/sqlSuppliers.js";

interface AgeingBucket {
    "0-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
}

interface SupplierAgeing {
    supplierId: string;
    businessName: string;
    buckets: AgeingBucket;
    totalDue: number;
}

/** SQL-only legacy supplier ageing. dbo.supplierdetail provides opening balance; the existing
 * source tables do not provide compatible credit-bill allocation keys, so the balance is assigned
 * to the oldest bucket and invoice ageing is omitted. */
export const getSupplierAgeingReport = async (_tenantId: string): Promise<SupplierAgeing[]> => {
    const suppliers = await sqlSupplierList();
    return suppliers
        .map((supplier) => {
            const balance = Number(supplier.netBalance ?? supplier.openingBalance ?? 0);
            return {
                supplierId: String(supplier._id),
                businessName: String(supplier.businessName ?? "Unknown supplier"),
                buckets: { "0-30": 0, "31-60": 0, "61-90": 0, "90+": balance },
                totalDue: balance,
            };
        })
        .filter((supplier) => Math.abs(supplier.totalDue) > 0.01);
};
