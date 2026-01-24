import { demoDB } from '../data/demo';
import { supabase } from '../lib/supabase';

export type DataMode = 'DEMO' | 'DB';

export const DATA_MODE: DataMode = 'DEMO'; // Toggle this to 'DB' for real data

export interface DataSourceOptions {
    filters?: Record<string, any>;
    select?: string;
}

/**
 * Unified Data Access Layer
 * Automatically switches between Demo Mock Data and Real Supabase Database
 */
export async function getTable<T = any>(tableName: string, options: DataSourceOptions = {}): Promise<T[]> {
    if (DATA_MODE === 'DEMO') {
        return getDemoData(tableName, options);
    }

    return getDbData(tableName, options);
}

/**
 * Internal logic for fetching and filtering demo data
 */
async function getDemoData(tableName: string, options: DataSourceOptions): Promise<any[]> {
    // Map standard Supabase table names to demoDB keys if they differ
    const tableMap: Record<string, string> = {
        'tenants': 'tenants',
        'branches': 'branches',
        'tenant_users': 'employees',
        'inventory': 'inventory',
        'products': 'inventory',
        'sales_invoices': 'salesInvoices',
        'sales_items': 'salesItems',
        'sales': 'salesInvoices',
        'purchase_orders': 'purchases',
        'expenses': 'expenses',
        'payments': 'payments',
        'customers': 'customers',
        'suppliers': 'suppliers',
        'transactions': 'transactions',
        'daily_finance': 'daily_finance'
    };

    // Table to required module mapping (Canonical Keys)
    const TABLE_TO_MODULE: Record<string, string> = {
        'inventory': 'INVENTORY',
        'products': 'INVENTORY',
        'sales_invoices': 'POS',
        'sales_items': 'POS',
        'sales': 'POS',
        'purchase_orders': 'PURCHASE',
        'expenses': 'EXPENSES',
        'payments': 'FINANCE',
        'customers': 'CUSTOMERS',
        'suppliers': 'SUPPLIERS',
        'daily_finance': 'FINANCE'
    };

    const dbKey = tableMap[tableName] || tableName;
    const requiredModule = TABLE_TO_MODULE[tableName];

    // Check Entitlements if tenant_id is provided in filters
    const filterTenantId = options.filters?.tenant_id || options.filters?.tenantId;
    if (filterTenantId && requiredModule && tableName !== 'tenants') {
        const tenant = demoDB.tenants.find(t => t.id === filterTenantId);
        // If tenant exists and doesn't have the module, return empty list
        if (tenant && !tenant.modules?.includes(requiredModule)) {
            console.warn(`[Entitlement] Blocked access to table ${tableName} for tenant ${filterTenantId}. Required module: ${requiredModule}`);
            return [];
        }
    }

    let baseData = demoDB[dbKey] || [];

    // Load dynamic data from localStorage (registrations)
    try {
        const { registrationUtil } = await import('../utils/registrationUtil');
        const dynamicData = registrationUtil.loadDynamicData() as any;
        const extraData = dynamicData[dbKey] || [];
        baseData = [...baseData, ...extraData];
    } catch (e) {
        console.warn("Failed to load dynamic data", e);
    }

    let data = [...baseData];

    // Apply filters if provided (e.g., .eq('tenant_id', id))
    if (options.filters) {
        data = data.filter(item => {
            return Object.entries(options.filters || {}).every(([key, value]) => {
                return item[key] === value;
            });
        });
    }

    // Simulate network latency for realism
    await new Promise(resolve => setTimeout(resolve, 300));

    return data;
}

/**
 * Internal logic for fetching from real Supabase DB
 */
async function getDbData(tableName: string, options: DataSourceOptions): Promise<any[]> {
    if (!supabase) return [];

    let query = supabase.from(tableName).select(options.select || '*');

    if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}
