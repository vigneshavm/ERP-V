# Data Source Abstraction Layer - Migration Guide

## Overview

This guide explains how to migrate controllers and services from direct SQL/Mongo access to the new data source abstraction layer.

**Key Benefits:**
- Controllers are decoupled from database implementation details
- SQL/Mongo fallback logic is centralized (not repeated in every endpoint)
- Easy to switch between data sources via configuration
- Testable: Can inject mock adapters for unit tests
- Auditable: Know which adapter was used for each query

## Current Problem (Before)

### InventoryController Pattern (Before Migration)

```typescript
// ❌ Controller is aware of data source selection logic
import { isSqlItemSource } } from '../../../integrations/textilesoft/sqlItemSource.js';
import { withMongoFallback } from '../../../integrations/textilesoft/sqlItemSource.js';
import { sqlStockStatusReport } from '../../../integrations/textilesoft/sqlStockReports.js';

export class InventoryController {
    private runStockReport(label, sql, mongo) {
        return async (req: AuthenticatedRequest, res: Response) => {
            const tenantId = req.user.tenantId.toString();
            // ❌ SQL/Mongo decision logic in controller
            const report = isSqlItemSource() 
                ? await withMongoFallback(label, () => sql(tenantId, q), () => mongo(tenantId, q)) 
                : await mongo(tenantId, q);
            res.status(200).json(report);
        };
    }

    public getStockStatusReport = this.runStockReport('stock status report', 
        sqlStockStatusReport, 
        (t, q) => this.stockAgingService.getStockStatusReport(t, q)
    );
}
```

**Problems:**
1. SQL/Mongo logic is mixed with HTTP handling
2. Same pattern repeated for each report endpoint (N+1 complexity)
3. Hard to test in isolation
4. Hard to understand what's happening at a glance
5. Difficult to audit which data source was actually used

## Solution (After)

### New Architecture

```
HTTP Request
    ↓
Controller (HTTP handling only)
    ↓
StockReportDataSourceService (orchestration, no DB knowledge)
    ↓
IStockReportDataSource (interface)
    ↓
┌─────────────────────────────┐
│                             │
MongoStockReportAdapter   SQLStockReportAdapter
│                             │
└─────────────────────────────┘
```

### Step 1: Inject the Service

Update `InventoryController` to depend on `StockReportDataSourceService`:

```typescript
// ✅ After: Clean injection
import { StockReportDataSourceService } from '../../../shared/datasource/index.js';

@singleton()
@injectable()
export class InventoryController {
    constructor(
        @inject(StockReportDataSourceService) private stockReportService: StockReportDataSourceService,
        @inject(StockAgingService) private stockAgingService: StockAgingService
    ) { }

    // ... rest of controller
}
```

### Step 2: Simplify Endpoint Methods

Replace `runStockReport` pattern with direct service calls:

```typescript
// ❌ Before (old pattern)
public getStockStatusReport = this.runStockReport('stock status report', sqlStockStatusReport, 
    (t, q) => this.stockAgingService.getStockStatusReport(t, q));

// ✅ After (new pattern)
public getStockStatusReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user.tenantId.toString();
        const query = this.stockReportQuery(req);
        
        // Controller doesn't know or care about SQL/Mongo
        const report = await this.stockReportService.getStockStatus(tenantId, query);
        
        res.status(200).json(report);
    } catch (err) {
        error(`Stock Status Report Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

// Apply same pattern to all reports
public getLowStockReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user.tenantId.toString();
        const query = this.stockReportQuery(req);
        const report = await this.stockReportService.getLowStock(tenantId, query);
        res.status(200).json(report);
    } catch (err) {
        error(`Low Stock Report Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

public getDeadStockReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user.tenantId.toString();
        const query = this.stockReportQuery(req);
        const report = await this.stockReportService.getDeadStock(tenantId, query);
        res.status(200).json(report);
    } catch (err) {
        error(`Dead Stock Report Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

// ... etc for remaining report methods
```

### Step 3: Remove Old Imports

Delete these imports from the controller:

```typescript
// ❌ Remove these
import { isSqlItemSource } from '../../../integrations/textilesoft/sqlItemSource.js';
import { withMongoFallback } from '../../../integrations/textilesoft/sqlItemSource.js';
import { sqlAgingReport, sqlCityWiseStock, ... } from '../../../integrations/textilesoft/sqlStockReports.js';
```

## How It Works

### Configuration

The data source is selected via environment variable:

```bash
# In .env or deployment config:
ITEM_DATA_SOURCE=sql      # Use SQL with Mongo fallback
ITEM_DATA_SOURCE=mongo    # Use Mongo only (default)
```

### Factory Pattern

`DataSourceFactory` creates the appropriate adapter:

```typescript
// SQL mode: Create composite with fallback
if (ITEM_DATA_SOURCE === 'sql') {
    const composite = new CompositeDataSourceAdapter();
    return composite.withFallback(sqlAdapter, mongoAdapter);
}

// Mongo mode: Return Mongo adapter directly
return mongoAdapter;
```

### Fallback Chain

If SQL fails, automatically tries Mongo:

```typescript
// CompositeDataSourceAdapter.execute()
try {
    // Try primary (SQL)
    result = await sqlAdapter.getStockStatus(tenantId, query);
    return result; // Success
} catch (err) {
    // Log the error
    logger.error(`SQL failed: ${err.message}. Trying Mongo...`);
    
    // Try fallback (Mongo)
    result = await mongoAdapter.getStockStatus(tenantId, query);
    return result; // Fallback succeeded
}
```

## Usage Examples

### Example 1: Stock Status Report (Simple)

```typescript
// Controller
public getStockStatusReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user.tenantId.toString();
        const query = this.stockReportQuery(req);
        const report = await this.stockReportService.getStockStatus(tenantId, query);
        res.status(200).json(report);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
```

### Example 2: Low Stock Report (With Filtering)

```typescript
// Controller
public getLowStockReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user.tenantId.toString();
        const query = this.stockReportQuery(req);
        
        // Validate threshold if provided
        if (query.threshold && isNaN(Number(query.threshold))) {
            return res.status(400).json({ message: 'Invalid threshold' });
        }
        
        const report = await this.stockReportService.getLowStock(tenantId, query);
        res.status(200).json(report);
    } catch (err: any) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
```

### Example 3: Testing with Mock Adapter

```typescript
// ✅ Easy to test: inject a mock adapter
class MockStockReportAdapter implements IStockReportDataSource {
    async getStockStatus() { return mockData; }
    // ... etc
}

// In test setup:
const mockAdapter = new MockStockReportAdapter();
const service = new StockReportDataSourceService();
// Would need to expose setDataSource() for this pattern
```

## Expanding the Pattern

To add a new report type:

### 1. Add method to interface

```typescript
// IStockReportDataSource
async getWarehouseWiseStock(tenantId: string, query: QueryOptions): Promise<any>;
```

### 2. Implement in both adapters

```typescript
// SQLStockReportAdapter
async getWarehouseWiseStock(tenantId: string, query: QueryOptions): Promise<any> {
    const q = this.toStockReportQuery(query);
    return sqlWarehouseWiseStock(tenantId, q);
}

// MongoStockReportAdapter
async getWarehouseWiseStock(tenantId: string, query: QueryOptions): Promise<any> {
    return this.stockAgingService.getWarehouseWiseStock(tenantId, query);
}
```

### 3. Add to orchestration service

```typescript
// StockReportDataSourceService
async getWarehouseWiseStock(tenantId: string, query: QueryOptions): Promise<any> {
    return this.dataSource.getWarehouseWiseStock(tenantId, query);
}
```

### 4. Use in controller

```typescript
// InventoryController
public getWarehouseWiseReport = async (req, res) => {
    const report = await this.stockReportService.getWarehouseWiseStock(tenantId, query);
    res.json(report);
};
```

## Migration Checklist

- [ ] Inject `StockReportDataSourceService` into controller
- [ ] Replace `runStockReport` pattern calls with direct service calls
- [ ] Remove old imports (isSqlItemSource, withMongoFallback, sql* functions)
- [ ] Remove old `runStockReport` helper method
- [ ] Test all stock report endpoints
- [ ] Verify build compiles
- [ ] Run existing tests

## Files Modified

- `backend/src/shared/datasource/IDataSourceAdapter.ts` - Interfaces
- `backend/src/shared/datasource/MongoStockReportAdapter.ts` - Mongo implementation
- `backend/src/shared/datasource/SQLStockReportAdapter.ts` - SQL implementation
- `backend/src/shared/datasource/CompositeDataSourceAdapter.ts` - Fallback logic
- `backend/src/shared/datasource/DataSourceFactory.ts` - Adapter creation
- `backend/src/shared/datasource/StockReportDataSourceService.ts` - Orchestration
- `backend/src/shared/datasource/index.ts` - Public API

## Next: InventoryController Refactoring

Once this pattern is validated:

1. Update `InventoryController` to use `StockReportDataSourceService`
2. Apply same pattern to other report controllers (SalesController, FinanceController, etc.)
3. Create similar adapters for Sales/Finance/Party reports
4. Document as best practice in CLAUDE.md

**Estimated effort**: 4-6 hours for full rollout across 4-5 report endpoints
