import api from './api';

export interface DebitNoteItem {
    name: string;
    qty: number;
    amount: number;
}

export interface DebitNote {
    _id?: string;
    noteId: string;
    date: string;
    vendorId: string;
    vendorName: string;
    poReference?: string;
    reason: 'RETURN' | 'PRICE_DIFF' | 'QUALITY' | 'SHORTAGE' | 'OTHER';
    items: DebitNoteItem[];
    totalAmount: number;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    branchId: string;
    notes?: string;
}

export const debitNoteService = {
    getDebitNotes: async (): Promise<DebitNote[]> => {
        const response = await api.get('/api/purchase/debit-notes');
        return response.data.data;
    },

    getDebitNoteById: async (id: string): Promise<DebitNote> => {
        const response = await api.get(`/api/purchase/debit-notes/${id}`);
        return response.data.data;
    },

    createDebitNote: async (data: Partial<DebitNote>): Promise<DebitNote> => {
        const response = await api.post('/api/purchase/debit-notes', data);
        return response.data.data;
    },

    updateStatus: async (id: string, status: string): Promise<DebitNote> => {
        const response = await api.put(`/api/purchase/debit-notes/${id}/status`, { status });
        return response.data.data;
    },

    deleteDebitNote: async (id: string): Promise<void> => {
        await api.delete(`/api/purchase/debit-notes/${id}`);
    }
};
