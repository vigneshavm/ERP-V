/**
 * Data Source Factory
 * 
 * Creates appropriate data source adapters based on configuration.
 * Centralizes the decision logic for which adapters to instantiate.
 */

import { container } from "tsyringe";
import { IStockReportDataSource } from "./IDataSourceAdapter.js";
import { MongoStockReportAdapter } from "./MongoStockReportAdapter.js";
import { SQLStockReportAdapter } from "./SQLStockReportAdapter.js";
import { CompositeDataSourceAdapter } from "./CompositeDataSourceAdapter.js";

const ITEM_DATA_SOURCE = process.env.ITEM_DATA_SOURCE || 'mongo';

export class DataSourceFactory {
    /**
     * Create a stock report data source adapter.
     * 
     * Based on ITEM_DATA_SOURCE env var:
     * - 'sql': Use SQL adapter with Mongo fallback
     * - 'mongo' or default: Use Mongo adapter only
     */
    static createStockReportDataSource(): IStockReportDataSource {
        const mongoAdapter = container.resolve(MongoStockReportAdapter);
        const sqlAdapter = container.resolve(SQLStockReportAdapter);

        if (ITEM_DATA_SOURCE === 'sql') {
            // Use composite with fallback: SQL primary, Mongo fallback
            const composite = new CompositeDataSourceAdapter<any>();
            return composite.withFallback(sqlAdapter, mongoAdapter) as any;
        }

        // Default: Mongo only
        return mongoAdapter;
    }

    /**
     * Get the configured data source mode
     */
    static getDataSourceMode(): 'sql' | 'mongo' {
        return ITEM_DATA_SOURCE === 'sql' ? 'sql' : 'mongo';
    }
}
