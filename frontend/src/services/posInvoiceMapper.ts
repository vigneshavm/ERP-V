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
    // Wholesale/Retail (WR) Billing: WRSalesEntry.tsx builds a Sale-shaped object the same way
    // usePOSCheckout does (so it goes through the same stock/discount/loyalty logic in
    // createInvoice) and reads saleChannel/counterName back off it here, rather than this
    // function taking a separate options param -- keeps every existing caller unchanged.
    const paidMethods = ['CASH', 'CARD', 'UPI'];
    const isPaid = paidMethods.includes((sale.paymentMethod || '').toString().toUpperCase());

    const items = (sale.items || []).map((item: CartItem) => {
        // The current checkout displays measured cuts only for the canonical Meter unit.
        // Refuse aliases until its totals, cut editor and receipts share that unit contract.
        const measuredUnit = /^(MTR|METER|METRE)$/i.test(String(item.unit || '').trim());
        if (measuredUnit && item.unit !== 'Meter') {
            throw new Error(`Measured unit "${item.unit}" for ${item.name} is unavailable in this checkout. Its cut editor and totals must support this unit before billing.`);
        }
        if (!Number.isFinite(item.qty) || item.qty === 0) {
            throw new Error(`Quantity for ${item.name} must be a finite, non-zero number.`);
        }
        if (measuredUnit && (typeof item.cutLength !== 'number' || !Number.isFinite(item.cutLength) || item.cutLength <= 0)) {
            throw new Error(`Enter a positive cut length for ${item.name}; no default metre will be billed.`);
        }
        const quantity = measuredUnit ? item.cutLength! * item.qty : item.qty;
        // The existing SQL writer formats salsntry.qty to two decimal places. Reject
        // information loss rather than silently rounding the measured quantity.
        const scaledQuantity = quantity * 100;
        if (!Number.isFinite(quantity) || Math.round(scaledQuantity) === 0 || !Number.isSafeInteger(Math.round(scaledQuantity)) || Math.abs(scaledQuantity - Math.round(scaledQuantity)) > 1e-8) {
            throw new Error(`Quantity for ${item.name} exceeds the existing billing precision of two decimal places.`);
        }

        // Quick Entry lines (product type + typed price) have no stock item; the server saves them
        // as plain lines without touching stock.
        const isQuickEntry = (item as any).isQuickEntry === true || String(item.id ?? '').startsWith('QE-');

        return {
            item: isQuickEntry ? undefined : item.id || (item as any)._id,
            // The SQL billing path resolves the shop item by its stable barcode, without a Mongo id.
            barcode: isQuickEntry ? undefined : item.barcode,
            isQuickEntry: isQuickEntry || undefined,
            name: (item as any).name,
            quantity,
            price: item.price,
            discountPercent: item.discountPercent || 0,
            salesmanCode: item.salesmanCode || undefined,
            // gstRate (line-actual rate, normally mirroring the product's stored GST rate) takes
            // precedence over the older gstPercentage field -- same precedence usePOSTotals.ts and
            // receiptGenerator.ts use, so the saved invoice's tax matches what was actually charged.
            // ?? not || throughout — a genuinely 0% GST item must stay 0%, not fall back to a default.
            // Default is 5%, matching usePOSTotals.ts and receiptGenerator.ts -- previously this
            // fell back to 0%, which meant an unconfigured line was charged at usePOSTotals' 18%
            // default but recorded on the invoice at 0%, the same class of mismatch this file was
            // meant to fix.
            tax: item.gstRate ?? item.gstPercentage ?? 5,
            // Returned item: the bill it was bought on (shop-database mode picks the sale line from it).
            returnFromBill: quantity < 0 ? item.returnFromBill || undefined : undefined,
            returnFromLine: quantity < 0 ? item.returnFromLine || undefined : undefined,
        };
    });

    return {
        idempotencyKey: sale.idempotencyKey || sale.id,
        expectedTotal: sale.expectedTotal,
        customerId: sale.customerId || undefined,
        items,
        discount: sale.discountAmount || 0,
        // Only meaningful when discount exceeds the tenant's cap and MIS Controls'
        // requireApprovalForHighDiscount is on -- see usePOSCheckout's enforcement check.
        discountApprovedBy: sale.discountApprovedBy || undefined,
        paymentMethod: (sale.paymentMethod || 'CASH').toString().toLowerCase(),
        paidAmount: isPaid ? sale.total : 0,
        changeReturned: 0,
        // Preserve explicit tender allocations for reviewed callers; never turn a split
        // into a single payment. The SQL rules validate amounts and supported scope.
        splitPaymentDetails: sale.splitPaymentDetails ?? [],
        creditApplied: 0,
        previousDueAmount: 0,
        // Invoice Billing: MRP-Pending flag -- see backend's IInvoice.ts for the full rationale.
        isMrpPending: sale.isMrpPending || false,
        mrpPendingNote: sale.mrpPendingNote || undefined,
        // Wholesale/Retail (WR) Billing -- see backend's IInvoice.ts for the full rationale.
        // Omitted (undefined) for every existing caller, which createInvoice defaults to RETAIL.
        saleChannel: sale.saleChannel || undefined,
        counterName: sale.counterName || undefined,
        salesmanCode: sale.salesmanCode || undefined,
        // Whether line prices include GST (the shop-database writer needs it to split tax out correctly).
        taxMode: sale.taxMode || undefined
    };
};
