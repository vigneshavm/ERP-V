import api from './api';

export interface BankStatementTransaction {
    _id: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    reference?: string;
    balance?: number;
    status: 'pending' | 'reconciled';
}

export const bankStatementService = {
    uploadStatement: async (file: File) => {
        const formData = new FormData();
        formData.append('statement', file);

        const response = await api.post('/finance/bank-statement/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // Increase timeout because PDF processing by GenAI might take a while
            timeout: 60000
        });
        return response.data;
    },

    getTransactions: async (status?: string) => {
        const params = status ? { status } : {};
        const response = await api.get('/finance/bank-statement/transactions', { params });
        return response.data;
    }
};
