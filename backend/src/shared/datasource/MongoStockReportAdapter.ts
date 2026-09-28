/**
 * Concrete MongoDB Stock Report Adapter
 * 
 * Implements IStockReportDataSource using MongoDB queries.
 * All Mongo-specific logic is isolated here.
 */

import { IStockReportDataSource, QueryOptions } from "./IDataSourceAdapter.js";
import { injectable, inject } from "tsyringe";
import { StockAgingService } from "../../modules/inventory/services/StockAgingService.js";
import { InventoryService } from "../../modules/inventory/services/InventoryService.js";

@injectable()
export class MongoStockReportAdapter implements IStockReportDataSource {
    constructor(
        @inject(StockAgingService) private stockAgingService: StockAgingService,
        @inject(InventoryService) private inventoryService: InventoryService,
    ) { }

    async execute(_tenantId: string, _query: QueryOptions): Promise<any> {
        // Default implementation - delegates to service
        // Specific report methods below override as needed
        return null;
    }

    async getStockStatus(tenantId: string, query: QueryOptions): Promise<any> {
        return this.stockAgingService.getStockStatusReport(tenantId, query);
    }

    async getLowStock(tenantId: string, query: QueryOptions): Promise<any> {
        return this.stockAgingService.getLowStockReport(tenantId, query);
    }

    async getDeadStock(tenantId: string, query: QueryOptions): Promise<any> {
        return this.stockAgingService.getDeadStockReport(tenantId, query);
    }

    async getStockMovements(tenantId: string, query: QueryOptions): Promise<any> {
        return this.inventoryService.getStockMovements(tenantId, query as Record<string, string | undefined>);
    }

    async getStockAgeBuckets(tenantId: string, query: QueryOptions): Promise<any> {
        return this.stockAgingService.getStockAgeBuckets(tenantId, query);
    }

    async getStockFilterOptions(tenantId: string): Promise<any> {
        return this.stockAgingService.getStockFilterOptions(tenantId);
    }

    async getStockByCity(tenantId: string, _query: QueryOptions): Promise<any> {
        return this.inventoryService.getStockByCity(tenantId);
    }

    async getStockByRack(tenantId: string, _query: QueryOptions): Promise<any> {
        return this.inventoryService.getStockByRack(tenantId);
    }

    getSource(): 'mongo' | 'sql' {
        return 'mongo';
    }

    getName(): string {
        return 'MongoStockReportAdapter';
    }
}
