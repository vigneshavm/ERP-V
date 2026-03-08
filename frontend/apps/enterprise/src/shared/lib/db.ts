import Dexie, { Table } from 'dexie';

export interface SyncMetadata {
    key: string;
    lastSynced: string;
}

export class GrowERPDatabase extends Dexie {
    offlineSales!: Table<any, number>;
    products!: Table<any, string>;
    customers!: Table<any, string>;
    syncMetadata!: Table<SyncMetadata, string>;
    dailyFinanceQueue!: Table<any, number>;

    constructor() {
        super('GrowERPDatabase');
        this.version(1).stores({
            offlineSales: '++localId, synced, id, branchId',
            products: 'id, name, sku, tenantId',
            customers: 'id, name, phone, tenantId',
            syncMetadata: 'key',
            dailyFinanceQueue: '++localId, recordId, operation, synced, timestamp'
        });
    }
}

export const db = new GrowERPDatabase();
