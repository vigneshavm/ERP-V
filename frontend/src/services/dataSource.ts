// export const DATA_MODE: DataMode = 'DB'; // Removed

export interface DataSourceOptions {
    filters?: Record<string, any>;
    select?: string;
}

/**
 * Unified Data Access Layer
 * Fetches data from the backend REST API
 */
export async function getTable<T = any>(tableName: string, options: DataSourceOptions = {}): Promise<T[]> {
    return getDbData(tableName, options);
}

/**
 * Internal logic: maps a table name to its backend REST endpoint
 */
import api from './api';

const TABLE_TO_ENDPOINT: Record<string, string> = {
    'products': '/api/inventory',
    'vendors': '/api/suppliers',
    'tenants': '/api/tenants', // Might need specific endpoint if valid
    'customers': '/api/customers', // Correct: crmRoutes mounted at /api + /customers
    'sales_invoices': '/api/sales-invoice/invoices', // Correct: salesRoutes mounted at /api/sales-invoice + /invoices
    'sales': '/api/sales-invoice/invoices', // Reuse same endpoint for sales history
    'purchases': '/api/purchases',
    'purchase_orders': '/api/purchases', // usePurchaseSync reads this table name; was unmapped so it silently returned []
    'expenses': '/api/expenses',
    'payments': '/api/payment-in',
    'transactions': '/api/cashbank',
    'daily_finance': '/api/daily-finance',
    'cheques': '/api/cashbank/cheques'
};

async function getDbData(tableName: string, options: DataSourceOptions): Promise<any[]> {
    const endpoint = TABLE_TO_ENDPOINT[tableName];
    if (!endpoint) {
        console.warn(`No endpoint mapped for table ${tableName}`);
        return [];
    }

    try {
        const { data } = await api.get(endpoint, {
            params: options.filters
        });
        // Handle standard API response wrapper { success: true, data: [...] }
        if (data && data.success && Array.isArray(data.data)) {
            return data.data;
        }
        // Paginated list endpoints (e.g. GET /api/inventory -> { items, pagination })
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        // Handle direct array response or other formats
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.warn(`Error fetching data for ${tableName}, falling back to empty dataset:`, error);
        return [];
    }
}
