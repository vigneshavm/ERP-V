import { SystemConfigSchema, RegistryAuditSchema, SyncStatusSchema } from "@vignesh-erp/shared-kernel";
import { z } from "zod";

export type SystemConfig = z.infer<typeof SystemConfigSchema>;
export type RegistryAudit = z.infer<typeof RegistryAuditSchema>;
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

export interface SystemState {
    configs: SystemConfig[];
    audits: RegistryAudit[];
    syncStatus: SyncStatus[];
    isLoading: boolean;
    error: string | null;
}
