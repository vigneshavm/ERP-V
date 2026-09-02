import { Sale, CartItem } from "../types/sales";

/**
 * Maps a client-side Sale (built at checkout in usePOSCheckout, or replayed later from the
 * offline queue) into the payload backend/src/modules/sales/controllers/PosController.ts's
 * createInvoice expects (POST /api/pos/invoice).
 *
 * Centralized here — rather than duplicated inline — so the immediate-checkout sync
 * (redux/thunks/saleThunks.ts) and the offline-queue replay (services/SyncManager.ts) can't
 * drift apart the way the old inline `{ sale_json: sale }` payloads had.
 */
export const buildPosInvoicePayload = (sale: Sale) => {
    const paidMethods = ['CASH', 'CARD', 'UPI'];
    const isPaid = paidMethods.includes((sale.paymentMethod || '').toString().toUpperCase());

    const items = (sale.items || []).map((item: CartItem) => {
        // Meter-based lines are billed by cut length, same convention as usePOSTotals.ts
        const quantity = item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty;

        return {
            item: item.id || (item as any)._id,
            name: (item as any).name,
            quantity,
            price: item.price,
            // ?? not || — a genuinely 0% GST item must stay 0%, not fall back to a default rate
            tax: item.gstPercentage ?? 0
        };
    });

    return {
        customerId: sale.customerId || undefined,
        items,
        discount: 0,
        paymentMethod: (sale.paymentMethod || 'CASH').toString().toLowerCase(),
        paidAmount: isPaid ? sale.total : 0,
        changeReturned: 0,
        splitPaymentDetails: [] as any[],
        creditApplied: 0,
        previousDueAmount: 0
    };
};
