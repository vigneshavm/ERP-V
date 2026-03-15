import { SystemConfigSchema, RegistryAuditSchema, SyncStatusSchema } from "@vignesh-erp/shared-kernel";
import { z } from "zod";

export type SystemConfig = z.infer<typeof SystemConfigSchema>;
export type RegistryAudit = z.infer<typeof RegistryAuditSchema>;
export interface SyncStatus {
    mfeId: string;
    lastSync: string;
    status: 'HEALTHY' | 'DELAYED' | 'CRITICAL';
    version: string;
}

export interface SystemState {
    configs: SystemConfig[];
    audits: RegistryAudit[];
    syncStatus: SyncStatus[];
    isLoading: boolean;
    error: string | null;
}
