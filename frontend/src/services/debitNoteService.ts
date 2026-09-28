import api from './api';

/** Must match backend DebitNote.reason. */
export type DebitNoteReason = 'RETURN' | 'PRICE_DIFF' | 'QUALITY' | 'SHORTAGE' | 'OTHER';
/** Must match backend DebitNote.status. Only APPROVED notes reduce what you owe the supplier. */
export type DebitNoteStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DebitNoteItem {
    itemId?: string;
    name: string;
    qty: number;
    amount: number;
    taxRate?: number;
    taxAmount?: number;
}

export interface DebitNote {
    _id?: string;
    noteId: string;
    date: string;
    vendorId: string;
    vendorName: string;
    originalBillId?: string;
    originalBillNumber?: string;
    originalGrnId?: string;
    originalGrnNumber?: string;
    reason: DebitNoteReason;
    items: DebitNoteItem[];
    subTotal: number;
    taxAmount: number;
    totalAmount: number;
    status: DebitNoteStatus;
    branchId: string;
    notes?: string;
    attachments?: string[];
    communicationTracking?: {
        date: string;
        type: 'EMAIL' | 'CALL' | 'MESSAGE';
        notes: string;
    }[];
}

export const debitNoteService = {
    getDebitNotes: async (): Promise<DebitNote[]> => {
        const response = await api.get('/api/purchases/debit-notes');
        return response.data.data;
    },

    getDebitNoteById: async (id: string): Promise<DebitNote> => {
        const response = await api.get(`/api/purchases/debit-notes/${id}`);
        return response.data.data;
    },

    createDebitNote: async (data: Partial<DebitNote>): Promise<DebitNote> => {
        const response = await api.post('/api/purchases/debit-notes', data);
        return response.data.data;
    },

    updateStatus: async (id: string, status: string): Promise<DebitNote> => {
        const response = await api.put(`/api/purchases/debit-notes/${id}/status`, { status });
        return response.data.data;
    },

    deleteDebitNote: async (id: string): Promise<void> => {
        await api.delete(`/api/purchases/debit-notes/${id}`);
    }
};
