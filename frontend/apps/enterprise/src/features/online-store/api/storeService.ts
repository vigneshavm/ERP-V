/**
 * Store Service
 * Migrated from services/storeService to FSD: features/online-store/api/storeService
 */

import api from '@/shared/api/api';

export class StoreService {
    static async getSyncStats(params: any): Promise<any> {
        try {
            const res = await api.get('/api/store/sync-stats', { params });
            return res.data;
        } catch {
            return null;
        }
    }

    static async getStoreConfig(): Promise<any> {
        const res = await api.get('/api/store/config');
        return res.data;
    }

    static async updateStoreConfig(data: any): Promise<void> {
        await api.put('/api/store/config', data);
    }
}
