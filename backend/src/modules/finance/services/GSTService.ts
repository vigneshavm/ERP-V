import Bill from "../models/Bill.js";
import GSTReconciliation from "../models/GSTReconciliation.js";
// Supplier import removed as it was unused

interface GSTR2BRecord {
    invoiceNo: string;
    date: Date; // ISO string or Date
    gstin: string; // Supplier GSTIN
    supplierName: string;
    taxableAmount: number;
    taxAmount: number;
}

export const reconcileGSTR2B = async (
    tenantId: string,
    _branchId: string,
    returnPeriod: string,
    gstrData: GSTR2BRecord[],
    userId: string
) => {
    // 1. Fetch System Bills for the period
    // returnPeriod "2024-03" -> Start: 2024-03-01, End: 2024-03-31
    const [year, month] = returnPeriod.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const systemBills = await Bill.find({
        tenantId,
        date: { $gte: startDate, $lte: endDate },
        status: { $ne: 'rejected' } // Only valid bills
    }).populate('supplier'); // To get System GSTIN

    // 2. Map for fast lookup
    // Key: GSTIN + InvoiceNo (Normalized)
    const systemMap = new Map();
    systemBills.forEach(bill => {
        const supplier: any = bill.supplier;
        const key = `${supplier?.gstNo?.trim()?.toUpperCase()}_${bill.vendorInvoiceNo?.trim()?.toUpperCase()}`;
        systemMap.set(key, bill);
    });

    const results = [];
    let matchedCount = 0;
    let mismatchCount = 0;
    let missingInSystemCount = 0;

    // 3. Process GSTR Data
    for (const record of gstrData) {
        const key = `${record.gstin?.trim()?.toUpperCase()}_${record.invoiceNo?.trim()?.toUpperCase()}`;
        const matchedBill = systemMap.get(key);

        if (matchedBill) {
            // Check Amounts (Allow small tolerance for roundoff)
            const systemTax = (matchedBill.taxBreakdown?.cgst || 0) + (matchedBill.taxBreakdown?.sgst || 0) + (matchedBill.taxBreakdown?.igst || 0);
            const diff = Math.abs(systemTax - record.taxAmount);

            if (diff < 1.0) {
                // MATCHED
                results.push({
                    billId: matchedBill._id,
                    gstrReference: record.invoiceNo,
                    status: 'MATCHED',
                    reconciledAt: new Date()
                });
                matchedCount++;

                // Update Bill
                matchedBill.gstReconciliationStatus = 'MATCHED';
                matchedBill.itcStatus = 'CLAIMED'; // Auto-claim if matched?
                await matchedBill.save();
            } else {
                // MISMATCH
                results.push({
                    billId: matchedBill._id,
                    gstrReference: record.invoiceNo,
                    status: 'MISMATCH',
                    remarks: `Tax Amount Diff: System=${systemTax}, GSTR=${record.taxAmount}`,
                    reconciledAt: new Date()
                });
                mismatchCount++;

                matchedBill.gstReconciliationStatus = 'MISMATCH';
                await matchedBill.save();
            }

            // Remove from map to track 'Missing in GSTR' later
            systemMap.delete(key);
        } else {
            // MISSING IN SYSTEM
            results.push({
                gstrReference: record.invoiceNo,
                status: 'MISSING_IN_SYSTEM',
                remarks: `Supplier: ${record.supplierName}, GSTIN: ${record.gstin}`,
                reconciledAt: new Date()
            });
            missingInSystemCount++;
        }
    }

    // 4. Remaining in Map = MISSING IN GSTR-2B
    let missingInGSTRCount = 0;
    for (const [_key, bill] of systemMap) {
        results.push({
            billId: bill._id,
            status: 'MISSING_IN_GSTR2B',
            remarks: 'Bill exists in system but not in GSTR-2B upload',
            reconciledAt: new Date()
        });
        missingInGSTRCount++;

        bill.gstReconciliationStatus = 'MISSING_IN_GSTR2B';
        await bill.save();
    }

    // 5. Save Reconciliation Snapshot
    // Check if exists, update or create
    const reconciliation = await GSTReconciliation.findOneAndUpdate(
        { tenantId, returnPeriod },
        {
            importedRecords: gstrData,
            results,
            stats: {
                totalMatched: matchedCount,
                totalMismatch: mismatchCount,
                totalMissingSystem: missingInSystemCount,
                totalMissingGSTR: missingInGSTRCount
            },
            updatedAt: new Date(),
            createdBy: userId
        },
        { upsert: true, new: true }
    );

    return reconciliation;
};

export default { reconcileGSTR2B };
