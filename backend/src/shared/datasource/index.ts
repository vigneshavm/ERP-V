/**
 * Data Source Abstraction Layer - Public API
 * 
 * Use this module to access data sources in a database-agnostic way.
 * Controllers should inject StockReportDataSourceService, not concrete adapters.
 */

export type { IDataSourceAdapter, ICompositeDataSourceAdapter, IStockReportDataSource, ISalesReportDataSource, IPartyReportDataSource, IFinanceReportDataSource, QueryOptions, DataSourceResult } from './IDataSourceAdapter.js';
export { CompositeDataSourceAdapter } from './CompositeDataSourceAdapter.js';
export { MongoStockReportAdapter } from './MongoStockReportAdapter.js';
export { SQLStockReportAdapter } from './SQLStockReportAdapter.js';
export { DataSourceFactory } from './DataSourceFactory.js';
export { StockReportDataSourceService } from './StockReportDataSourceService.js';
