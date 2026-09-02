import api from './api';
import { GRN, GRNItem } from '../types/purchase';

export interface GRNItemPayload {
    productId: string;
    productName?: string;
    receivedQty: number;
    damagedQty?: number;
    rejectedQty?: number;
    rate?: number;
    lotNumber?: string;
    rejectionReason?: string;
}

export interface CreateGRNPayload {
    purchaseId: string;
    deliveryNoteNo?: string;
    warehouseId?: string;
    notes?: string;
    items: GRNItemPayload[];
}

export interface CreateGRNResult {
    success: boolean;
    message: string;
    grn: any;
}

/**
 * Calls the real backend goods-receipt endpoint (POST /api/grn). This is what actually
 * moves inventory: GRNController.createGRN computes acceptedQty per item, calls
 * InventoryService.addStock for each accepted line, writes a StockLog entry, and updates
 * the parent Purchase's status to COMPLETED/PARTIALLY_RECEIVED.
 */
export const createGRN = async (payload: CreateGRNPayload): Promise<CreateGRNResult> => {
    const { data } = await api.post('/api/grn', payload);
    return data;
};

export const getGRNs = async (): Promise<any[]> => {
    const { data } = await api.get('/api/grn');
    return data?.data || [];
};

/**
 * Maps a raw GRN document returned by the backend (createGRN/getGRNs response, camelCase
 * fields, possibly-populated purchaseId/vendorId) onto the frontend's GRN shape used by
 * Redux (`purchaseSlice.grns`) and the GRN list page (`useGRNData`).
 */
export const mapGrnToFrontendGRN = (
    grn: any,
    fallback: { poNumber?: string; vendorName?: string; branchId?: string; createdBy?: string } = {}
): GRN => {
    const items: GRNItem[] = (grn.items || []).map((it: any, idx: number) => {
        const rejected = it.rejectedQty || 0;
        const accepted = it.acceptedQty || 0;
        return {
            id: it._id ? String(it._id) : `${grn.grnNumber || 'GRN'}-${idx}`,
            poItemId: it.productId ? String(it.productId) : '',
            productId: it.productId ? String(it.productId) : '',
            productName: it.productName,
            orderedQty: it.orderedQty ?? 0,
            receivedQty: it.receivedQty ?? 0,
            acceptedQty: accepted,
            rejectedQty: rejected,
            inspectionStatus: rejected > 0 ? (accepted > 0 ? 'Partial' : 'Rejected') : 'Accepted',
            discrepancyNotes: it.rejectionReason,
            batchNumber: it.lotNumber,
        };
    });

    const purchaseId = grn.purchaseId;
    const vendorId = grn.vendorId;

    return {
        id: grn._id ? String(grn._id) : grn.id,
        grnNumber: grn.grnNumber,
        poId: purchaseId && typeof purchaseId === 'object' ? String(purchaseId._id) : String(purchaseId || ''),
        poNumber: (purchaseId && typeof purchaseId === 'object' ? purchaseId.purchaseNumber : undefined) || fallback.poNumber || '',
        vendorId: vendorId && typeof vendorId === 'object' ? String(vendorId._id) : String(vendorId || ''),
        vendorName: (vendorId && typeof vendorId === 'object' ? (vendorId.businessName || vendorId.name) : undefined) || fallback.vendorName || '',
        receivedDate: grn.receivedDate || new Date().toISOString(),
        status: grn.status,
        notes: grn.notes,
        items,
        branch_id: fallback.branchId,
        created_at: grn.createdAt || new Date().toISOString(),
        created_by: fallback.createdBy,
    };
};
