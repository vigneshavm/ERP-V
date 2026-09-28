/**
 * Concrete SQL Stock Report Adapter
 * 
 * Implements IStockReportDataSource using Textilesoft SQL queries.
 * All SQL-specific logic is isolated here.
 */

import { IStockReportDataSource, QueryOptions } from "./IDataSourceAdapter.js";
import { injectable } from "tsyringe";
import {
    sqlStockStatusReport,
    sqlLowStockReport,
    sqlDeadStockReport,
    sqlStockMovements,
    sqlStockAgeBuckets,
    sqlStockFilterOptions,
    sqlCityWiseStock,
    sqlRackWiseStock,
    type StockReportQuery
} from "../../integrations/textilesoft/sqlStockReports.js";

@injectable()
export class SQLStockReportAdapter implements IStockReportDataSource {
    /**
     * Convert generic QueryOptions to SQL-specific StockReportQuery format
     */
    private toStockReportQuery(query: QueryOptions): StockReportQuery {
        return {
            search: this.str(query, 'search'),
            category: this.str(query, 'category'),
            brand: this.str(query, 'brand'),
            supplier: this.str(query, 'supplier'),
            from: this.str(query, 'from'),
            to: this.str(query, 'to'),
            page: this.str(query, 'page'),
            limit: this.str(query, 'limit'),
            threshold: this.str(query, 'threshold'),
            days: this.str(query, 'days'),
            neverSold: this.str(query, 'neverSold'),
            refresh: this.str(query, 'refresh'),
            sort: this.str(query, 'sort'),
            dir: this.str(query, 'dir'),
        };
    }

    private str(query: QueryOptions, key: string): string | undefined {
        const v = query[key];
        return typeof v === 'string' ? v : undefined;
    }

    async execute(_tenantId: string, _query: QueryOptions): Promise<any> {
        // Default implementation - not used directly
        // Specific report methods below override as needed
        return null;
    }

    async getStockStatus(tenantId: string, query: QueryOptions): Promise<any> {
        const q = this.toStockReportQuery(query);
        return sqlStockStatusReport(tenantId, q);
    }

    async getLowStock(tenantId: string, query: QueryOptions): Promise<any> {
        const q = this.toStockReportQuery(query);
        return sqlLowStockReport(tenantId, q);
    }

    async getDeadStock(tenantId: string, query: QueryOptions): Promise<any> {
        const q = this.toStockReportQuery(query);
        return sqlDeadStockReport(tenantId, q);
    }

    async getStockMovements(_tenantId: string, query: QueryOptions): Promise<any> {
        const q = this.toStockReportQuery(query);
        return sqlStockMovements(q);
    }

    async getStockAgeBuckets(tenantId: string, query: QueryOptions): Promise<any> {
        const q = this.toStockReportQuery(query);
        return sqlStockAgeBuckets(tenantId, q);
    }

    async getStockFilterOptions(tenantId: string): Promise<any> {
        return sqlStockFilterOptions(tenantId);
    }

    async getStockByCity(tenantId: string, query: QueryOptions): Promise<any> {
        const q = this.toStockReportQuery(query);
        return sqlCityWiseStock(tenantId, q);
    }

    async getStockByRack(tenantId: string, query: QueryOptions): Promise<any> {
        const q = this.toStockReportQuery(query);
        return sqlRackWiseStock(tenantId, q);
    }

    getSource(): 'mongo' | 'sql' {
        return 'sql';
    }

    getName(): string {
        return 'SQLStockReportAdapter';
    }
}
