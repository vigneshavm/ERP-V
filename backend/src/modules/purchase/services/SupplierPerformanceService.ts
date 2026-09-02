import Purchase from "../models/Purchase.js";
import PurchaseReturn from "../models/PurchaseReturn.js";
import Supplier from "../models/Supplier.js";
import GRN from "../models/GRN.js";

export const evaluateSupplier = async (supplierId: string) => {
    // 1. Fetch Summary Stats
    const totalOrders = await Purchase.countDocuments({ vendorId: supplierId, status: { $in: ['COMPLETED', 'RECEIVED'] } });

    // 2. Fetch GRNs to calculate real lead times and late deliveries
    const grns = await GRN.find({ vendorId: supplierId }).populate('purchaseId');
    const returns = await PurchaseReturn.find({ supplier: supplierId });
    const totalReturns = returns.length;

    let lateDeliveries = 0;
    let totalLeadTimeDays = 0;
    let grnDeliveryCount = 0;

    for (const grn of grns) {
        const po = grn.purchaseId as any;
        if (po && po.date) {
            const leadTimeMs = new Date(grn.receivedDate).getTime() - new Date(po.date).getTime();
            const leadTimeDays = Math.max(0, Math.round(leadTimeMs / (1000 * 60 * 60 * 24)));
            totalLeadTimeDays += leadTimeDays;
            grnDeliveryCount++;

            if (po.expectedDeliveryDate && new Date(grn.receivedDate) > new Date(po.expectedDeliveryDate)) {
                lateDeliveries++;
            }
        }
    }

    const averageDeliveryTime = grnDeliveryCount > 0 ? Math.round((totalLeadTimeDays / grnDeliveryCount) * 10) / 10 : 3;

    // 3. Reliability Score Calculation (Base: 100)
    let score = 100;

    if (totalOrders > 0) {
        // Late delivery penalty: -5 per late delivery
        const latePenalty = (lateDeliveries / totalOrders) * 40;
        // Quality return penalty: -50 * return rate
        const returnPenalty = (totalReturns / totalOrders) * 50;
        score -= (latePenalty + returnPenalty);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    // 4. Update Supplier Performance Metrics
    const metrics = {
        totalOrders,
        lateDeliveries,
        totalReturns,
        averageDeliveryTime,
        reliabilityScore: score,
        lastEvaluated: new Date()
    };

    await Supplier.findByIdAndUpdate(supplierId, { performanceMetrics: metrics });
    return metrics;
};

export default { evaluateSupplier };
