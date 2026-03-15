import { logger } from '@/shared/lib/logger';
import api from './api';

/**
 * Generic data fetching utility for table-based queries.
 * Handles filtering and selection for various entities.
 */
export const getTable = async <T = any>(
    tableName: string, 
    options: { filters?: Record<string, any>; select?: string } = {}
): Promise<T[] | null> => {
    try {
        const { filters = {}, select = '*' } = options;
        const response = await api.get(`/api/data/${tableName}`, {
            params: {
                filters: JSON.stringify(filters),
                select
            }
        });
        return response.data;
    } catch (error) {
        logger.error(`Error fetching table ${tableName}:`, error);
        return null;
    }
};
