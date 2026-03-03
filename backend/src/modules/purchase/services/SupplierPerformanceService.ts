import Purchase from "../models/Purchase.js";
import PurchaseReturn from "../models/PurchaseReturn.js";
import Supplier from "../models/Supplier.js";
// GRN import removed as it was not found and is unused
// Assuming GRN is part of Purchase or separate model. Based on previous context, GRN might be a separate collection or part of purchase flow.
// Just in case, let's use Purchase dates if GRN model isn't distinct or use the GRN date if captured in Purchase/Bill.
// Correction: We don't have a direct GRN mongoose model imported in previous steps, but we have Purchase. 
// Let's assume for MVP: "Late" = Purchase Status COMPLETED date > Purchase Expected Date (if exists) or created vs update.

export const evaluateSupplier = async (supplierId: string) => {
    // 1. Fetch Summary Stats
    const totalOrders = await Purchase.countDocuments({ vendorId: supplierId, status: 'COMPLETED' });

    // 2. Calculate Late Deliveries (Proxy: Bill Date > PO Date + Buffer? Or if we have expectedDelivery)
    // For now, let's assume if status is 'COMPLETED' and it took > 7 days from creation (mock logic) 
    // OR ideally we check 'expectedDelivery' in PO vs 'updatedAt' (Completion).
    // Let's rely on returns for quality score first as it's more deterministic.

    const returns = await PurchaseReturn.find({ supplier: supplierId });
    const totalReturns = returns.length;

    // 3. Score Calculation
    // Base Score: 100
    // -5 for each return incidence
    // -2 for each late delivery (mock: 10% of orders are late for simulation if no real date tracking)

    let score = 100;

    // Return Penalty (Quality)
    if (totalOrders > 0) {
        const returnRate = totalReturns / totalOrders; // e.g., 0.1 (10%)
        score -= (returnRate * 100); // -10 points
    }

    // Cap Score
    score = Math.max(0, Math.min(100, Math.round(score)));

    // 4. Update Supplier
    const metrics = {
        totalOrders,
        lateDeliveries: 0, // Placeholder until verified delivery tracking
        totalReturns,
        averageDeliveryTime: 3, // Mock average days
        reliabilityScore: score,
        lastEvaluated: new Date()
    };

    await Supplier.findByIdAndUpdate(supplierId, { performanceMetrics: metrics });
    return metrics;
};

export default { evaluateSupplier };
