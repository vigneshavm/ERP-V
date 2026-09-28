/**
 * Stock Report Data Source Service
 * 
 * Orchestrates data access for stock reports.
 * Controllers depend on this service, not on data source adapters directly.
 * All SQL/Mongo fallback logic is hidden from the controller layer.
 */

import { injectable } from "tsyringe";
import { IStockReportDataSource, QueryOptions } from "./IDataSourceAdapter.js";
import { DataSourceFactory } from "./DataSourceFactory.js";
import { info } from "../../config/logger.js";

@injectable()
export class StockReportDataSourceService {
    private dataSource: IStockReportDataSource;

    constructor() {
        this.dataSource = DataSourceFactory.createStockReportDataSource();
        info(`Stock Report Data Source initialized: ${this.dataSource.getName()}`);
    }

    async getStockStatus(tenantId: string, query: QueryOptions): Promise<any> {
        return this.dataSource.getStockStatus(tenantId, query);
    }

    async getLowStock(tenantId: string, query: QueryOptions): Promise<any> {
        return this.dataSource.getLowStock(tenantId, query);
    }

    async getDeadStock(tenantId: string, query: QueryOptions): Promise<any> {
        return this.dataSource.getDeadStock(tenantId, query);
    }

    async getStockMovements(tenantId: string, query: QueryOptions): Promise<any> {
        return this.dataSource.getStockMovements(tenantId, query);
    }

    async getStockAgeBuckets(tenantId: string, query: QueryOptions): Promise<any> {
        return this.dataSource.getStockAgeBuckets(tenantId, query);
    }

    async getStockFilterOptions(tenantId: string): Promise<any> {
        return this.dataSource.getStockFilterOptions(tenantId);
    }

    async getStockByCity(tenantId: string, query: QueryOptions): Promise<any> {
        return this.dataSource.getStockByCity(tenantId, query);
    }

    async getStockByRack(tenantId: string, query: QueryOptions): Promise<any> {
        return this.dataSource.getStockByRack(tenantId, query);
    }

    /**
     * Get the configured data source (for testing/logging)
     */
    getDataSource(): IStockReportDataSource {
        return this.dataSource;
    }
}
