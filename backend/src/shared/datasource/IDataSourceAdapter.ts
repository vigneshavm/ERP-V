/**
 * Data Source Abstraction Layer
 * 
 * Provides a unified interface for accessing data from either MongoDB or SQL sources.
 * Controllers and services should depend on DataSourceAdapter interfaces, not concrete
 * database implementations.
 * 
 * Pattern:
 * 
 * Controller → Service → DataSourceAdapter (interface)
 *                            ↓
 *                    ┌───────┴────────┐
 *                    ↓                ↓
 *              MongoAdapter      SQLAdapter
 */

export interface QueryOptions {
    page?: string | number;
    limit?: string | number;
    sort?: string;
    dir?: string;
    search?: string;
    from?: string;
    to?: string;
    [key: string]: unknown;
}

export interface DataSourceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        source: 'mongo' | 'sql';
        timestamp: string;
        asOf?: string;
    };
}

/**
 * Generic data source adapter interface.
 * All data access goes through this abstraction.
 */
export interface IDataSourceAdapter<T = any> {
    /**
     * @param tenantId - The tenant context
     * @param query - Query parameters
     * @returns Promise of typed result
     */
    execute(tenantId: string, query: QueryOptions): Promise<T>;

    /**
     * @returns 'mongo' | 'sql'
     */
    getSource(): 'mongo' | 'sql';

    /**
     * Human-readable name for logging/debugging
     */
    getName(): string;
}

/**
 * Composite adapter that tries SQL first, falls back to Mongo on error.
 */
export interface ICompositeDataSourceAdapter<T = any> extends IDataSourceAdapter<T> {
    /**
     * @param primary - Primary adapter (SQL)
     * @param fallback - Fallback adapter (Mongo)
     */
    withFallback(primary: IDataSourceAdapter<T>, fallback: IDataSourceAdapter<T>): this;

    /**
     * @returns The adapter that was actually used for the last query
     */
    getLastUsedSource(): 'mongo' | 'sql' | null;
}

/**
 * Stock Report specific adapter interface.
 * Extends the generic adapter with stock-report-specific methods.
 */
export interface IStockReportDataSource extends IDataSourceAdapter {
    getStockStatus(tenantId: string, query: QueryOptions): Promise<any>;
    getLowStock(tenantId: string, query: QueryOptions): Promise<any>;
    getDeadStock(tenantId: string, query: QueryOptions): Promise<any>;
    getStockMovements(tenantId: string, query: QueryOptions): Promise<any>;
    getStockAgeBuckets(tenantId: string, query: QueryOptions): Promise<any>;
    getStockFilterOptions(tenantId: string): Promise<any>;
    getStockByCity(tenantId: string, query: QueryOptions): Promise<any>;
    getStockByRack(tenantId: string, query: QueryOptions): Promise<any>;
}

/**
 * Sales Report specific adapter interface.
 */
export interface ISalesReportDataSource extends IDataSourceAdapter {
    getSalesRegister(tenantId: string, query: QueryOptions): Promise<any>;
    getSalesAnalysis(tenantId: string, query: QueryOptions): Promise<any>;
}

/**
 * Party (Supplier/Customer) Report specific adapter interface.
 */
export interface IPartyReportDataSource extends IDataSourceAdapter {
    getPartyLedger(tenantId: string, partyId: string, query: QueryOptions): Promise<any>;
    getPartyBalance(tenantId: string, partyId: string): Promise<any>;
}

/**
 * Finance Report specific adapter interface.
 */
export interface IFinanceReportDataSource extends IDataSourceAdapter {
    getGSTReport(tenantId: string, query: QueryOptions): Promise<any>;
    getJournalEntries(tenantId: string, query: QueryOptions): Promise<any>;
}
