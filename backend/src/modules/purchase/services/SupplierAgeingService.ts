import mongoose from "mongoose";
import Bill from "../../finance/models/Bill.js";
import Supplier from "../models/Supplier.js";
import DebitNote from "../models/DebitNote.js";

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

export const getSupplierAgeingReport = async (tenantId: string): Promise<SupplierAgeing[]> => {
    // 1. Fetch all suppliers for this tenant to get Opening Balances and Names
    const suppliers = await Supplier.find({ tenantId });
    const supplierIds = suppliers.map(s => s._id);

    const ageingMap = new Map<string, SupplierAgeing>();
    const today = new Date();

    // Initialize map with suppliers and their Opening Balance
    for (const s of suppliers) {
        const ob = s.openingBalance || 0;
        ageingMap.set(s._id.toString(), {
            supplierId: s._id.toString(),
            businessName: s.businessName,
            buckets: {
                "0-30": 0,
                "31-60": 0,
                "61-90": 0,
                "90+": ob // Assume Opening Balance is the oldest debt
            },
            totalDue: ob
        });
    }

    // 2. Fetch all Unpaid Bills for these suppliers
    const unpaidBills = await Bill.find({
        supplier: { $in: supplierIds },
        paymentStatus: { $ne: 'paid' },
        status: { $nin: ['draft', 'cancelled', 'rejected'] }
    });

    for (const bill of unpaidBills) {
        const supplierId = bill.supplier.toString();
        const entry = ageingMap.get(supplierId);
        if (!entry) continue;

        const dueAmount = bill.amount - (bill.paidAmount || 0);
        if (dueAmount <= 0) continue;

        entry.totalDue += dueAmount;

        // Use Invoice Date (bill.date) for ageing
        const billDate = new Date(bill.date);
        const diffTime = Math.abs(today.getTime() - billDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
            entry.buckets["0-30"] += dueAmount;
        } else if (diffDays <= 60) {
            entry.buckets["31-60"] += dueAmount;
        } else if (diffDays <= 90) {
            entry.buckets["61-90"] += dueAmount;
        } else {
            entry.buckets["90+"] += dueAmount;
        }
    }

    // 3. Fetch Approved Debit Notes to reduce outstanding
    const debitNotes = await DebitNote.find({
        vendorId: { $in: supplierIds },
        status: 'APPROVED'
    });

    for (const dn of debitNotes) {
        const supplierId = dn.vendorId.toString();
        const entry = ageingMap.get(supplierId);
        if (!entry) continue;

        let creditRemaining = dn.totalAmount;
        entry.totalDue -= creditRemaining;

        // FIFO approach: Reduce oldest debt first (90+, 61-90, 31-60, 0-30)
        const bucketOrder: (keyof AgeingBucket)[] = ["90+", "61-90", "31-60", "0-30"];

        for (const bucket of bucketOrder) {
            if (creditRemaining <= 0) break;

            const bucketVal = entry.buckets[bucket];
            if (bucketVal > 0) {
                const reduction = Math.min(bucketVal, creditRemaining);
                entry.buckets[bucket] -= reduction;
                creditRemaining -= reduction;
            }
        }

        // If credit still remains after all buckets, it could make 0-30 negative (Advance)
        if (creditRemaining > 0) {
            entry.buckets["0-30"] -= creditRemaining;
        }
    }

    // Filter out suppliers with zero total balance to clean up the report
    return Array.from(ageingMap.values()).filter(s => Math.abs(s.totalDue) > 0.01);
};
