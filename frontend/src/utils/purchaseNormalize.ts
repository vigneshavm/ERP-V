import { PurchaseOrder, PurchaseOrderItem } from "../types/purchase";

/**
 * The backend Purchase document uses camelCase field names (productId, productName,
 * taxPercent, amount, ...) and, depending on which endpoint served it, `items[].productId`
 * may be a bare ObjectId string OR a populated Item object ({_id, name, sku, ...}) -
 * getPurchaseById() populates it, getAllPurchases() does not.
 *
 * The frontend PurchaseOrder/PurchaseOrderItem types use snake_case (product_id,
 * product_name, tax_percent, line_total, ...). Several hooks/components historically
 * assumed the raw backend response already matched that shape and read the snake_case
 * fields directly, which is silently undefined for data that came straight from the API.
 * This normalizer is the single place that reconciles both shapes so every consumer
 * (usePurchaseOrders, useGRNForm, PurchaseOrderDetails, PurchaseOrderList) sees a
 * consistent, correctly-populated PurchaseOrder.
 */
export const normalizePurchaseOrderItem = (item: any): PurchaseOrderItem => {
    if (!item) return item;

    const rawProductId = item.productId ?? item.product_id;
    const productIsPopulated = rawProductId && typeof rawProductId === 'object';
    const productId = productIsPopulated
        ? (rawProductId._id || rawProductId.id || '')
        : (rawProductId || '');
    const populated = productIsPopulated ? rawProductId : null;

    return {
        product_id: productId ? String(productId) : undefined,
        product_name: item.productName ?? item.product_name ?? populated?.name ?? 'Unknown Item',
        sku: item.sku ?? populated?.sku,
        quantity: item.quantity ?? 0,
        rate: item.rate ?? 0,
        tax_percent: item.taxPercent ?? item.tax_percent ?? 0,
        discount_amount: item.discountAmount ?? item.discount_amount ?? 0,
        line_total: item.amount ?? item.line_total ?? 0,
        received_quantity: item.receivedQty ?? item.received_quantity ?? 0,
        lot_number: item.lotNumber ?? item.lot_number,
    };
};

export const normalizePurchaseOrder = (raw: any): PurchaseOrder => {
    if (!raw) return raw;

    const vendor = raw.vendorId;
    const vendorPopulated = vendor && typeof vendor === 'object' ? vendor : null;

    return {
        ...raw,
        id: raw.id || raw._id,
        po_number: raw.po_number || raw.purchaseNumber || raw._id || raw.id,
        vendor_name: raw.vendor_name || vendorPopulated?.businessName || vendorPopulated?.name || 'Unknown Vendor',
        vendor_id: raw.vendor_id || (vendorPopulated ? vendorPopulated._id : vendor) || '',
        po_date: raw.po_date || raw.date,
        total_amount: raw.total_amount ?? raw.totalAmount ?? 0,
        status: raw.status,
        items: Array.isArray(raw.items) ? raw.items.map(normalizePurchaseOrderItem) : [],
        created_at: raw.created_at || raw.createdAt,
        notes: raw.notes,
        expected_delivery: raw.expected_delivery || raw.expectedDeliveryDate,
    } as PurchaseOrder;
};

export const normalizePurchaseOrders = (raw: any[]): PurchaseOrder[] =>
    Array.isArray(raw) ? raw.map(normalizePurchaseOrder) : [];
