import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import StockLog from '../dist/modules/inventory/models/StockLog.js';

// REGRESSION: InventoryService writes StockLog.type = 'SALES' | 'ADJUST' | 'RETURN' | 'PURCHASE' | 'INIT'
// (see modules/inventory/services/InventoryService.ts: reduceStock, bulkAdjustStock, updateItem,
// importItems, updateBatchCost). The schema's enum must accept every value the service layer
// actually writes, or the create() call throws a Mongoose ValidationError and the surrounding
// Mongo transaction (e.g. PosController.createInvoice) aborts.
//
// This does NOT need a live database - Mongoose validates enum membership synchronously against
// the schema, so `.validateSync()` on an unsaved document exercises the exact same validation
// path `.create()` would hit, without mongodb-memory-server.

describe('StockLog schema: type enum matches what InventoryService actually writes', () => {
    const base = {
        itemId: new mongoose.Types.ObjectId(),
        tenantId: new mongoose.Types.ObjectId(),
        delta: -5,
        finalQty: 10,
        performedBy: new mongoose.Types.ObjectId().toString(),
    };

    // Every value InventoryService.ts actually passes as `type` to StockLog.create(...)
    const valuesWrittenByInventoryService = [
        { type: 'INIT', writtenBy: 'addItem() / importItems() initial stock' },
        { type: 'PURCHASE', writtenBy: 'addStock() (purchase receipt)' },
        { type: 'ADJUST', writtenBy: 'bulkAdjustStock() / updateItem() / updateBatchCost()' },
        { type: 'SALES', writtenBy: "reduceStock() — the B2C checkout path (PosController.createInvoice)" },
        { type: 'RETURN', writtenBy: "reduceStock(reason='PURCHASE_RETURN')" },
    ];

    test.each(valuesWrittenByInventoryService)(
        'accepts type=$type (written by $writtenBy)',
        ({ type }) => {
            const doc = new StockLog({ ...base, type });
            const err = doc.validateSync();
            expect(err).toBeUndefined();
        }
    );

    test('still rejects a value nothing in the codebase writes (enum is not just disabled)', () => {
        const doc = new StockLog({ ...base, type: 'NOT_A_REAL_TYPE' });
        const err = doc.validateSync();
        expect(err).toBeDefined();
        expect(err.errors.type).toBeDefined();
    });
});
