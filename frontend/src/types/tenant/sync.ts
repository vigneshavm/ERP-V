export type SyncStatus = 'UP_TO_DATE' | 'PENDING' | 'CONFLICT' | 'SYNCING' | 'ERROR';

export type DeviceStatus = 'ACTIVE' | 'OFFLINE' | 'SUSPENDED' | 'INACTIVE';

export interface DeviceRegistryEntry {
    id: string;
    name: string;
    branchId: string;
    userId: string;
    platform: string;
    osVersion: string;
    appVersion: string;
    lastSyncAt: string;
    lastOnlineAt: string;
    ipAddress: string;
    status: DeviceStatus;
    isOnline: boolean;
    syncHealth: number;
    errorRate: number;
    pendingOps: number;
}

export interface SyncLedgerEntry {
    id: string;
    deviceId: string;
    branchId: string;
    eventType: string;
    entityId: string;
    entityType: string;
    timestamp: string;
    status: 'SYNCED' | 'PENDING' | 'CONFLICT' | 'FAILED';
    payload: any;
    hash: string;
}

export interface SyncConflict {
    id: string;
    entityId: string;
    entityType: string;
    deviceId: string;
    timestamp: string;
    localData: any;
    remoteData: any;
    status: 'OPEN' | 'RESOLVED';
}

export interface ConflictEntry {
    id: string;
    ledgerEntryId: string;
    entity: string;
    entityId: string;
    field: string;
    localValue: string;
    remoteValue: string;
    occurredAt: string;
}

export type BackupStatus = 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'SCHEDULED';
export type BackupDestination = 'LOCAL' | 'GOOGLE_DRIVE';

export interface BackupEntry {
    id: string;
    date: string;
    time: string;
    size: number;
    destination: BackupDestination;
    status: BackupStatus;
    modules: string[];
    log?: string;
}

export interface BackupSettings {
    autoBackupEnabled: boolean;
    scheduleTime: string;
    retentionDays: number;
    destination: BackupDestination;
    modulesToBackup: Record<string, boolean>;
}

export interface StorageStats {
    used: number;
    total: number;
    warningThreshold: number;
}

export interface BackupConfig {
    tenantId: string;
    settings: BackupSettings;
    history: BackupEntry[];
    lastBackup: BackupEntry;
    storage: StorageStats;
}

export interface SyncSettings {
    autoSync: boolean;
    syncInterval: 5 | 10 | 30;
    syncOnWifiOnly: boolean;
    backgroundSync: boolean;
    syncDomains: {
        inventory: boolean;
        sales: boolean;
        customers: boolean;
        finance: boolean;
        [key: string]: boolean;
    };
}

export interface SyncIntelligenceConfig {
    isEnabled: boolean;
    retentionDays: number;
    autoResolveRules: Array<{ field: string; strategy: 'USE_LATEST' | 'USE_REMOTE' | 'USE_LOCAL' }>;
    anomalyDetectionEnabled: boolean;
    backupFrequency: 'HOURLY' | 'DAILY' | 'WEEKLY';
}

export type SyncConfig = {
    tenantId: string;
    devices: DeviceRegistryEntry[];
    settings: SyncSettings;
    lastSyncAt: string;
    syncStatus: SyncStatus;
    conflicts: ConflictEntry[];
};
