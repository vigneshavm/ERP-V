import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { SettingsState } from "../types/settings";

/**
 * Hook to resolve the final application settings for the current user session.
 * Merges:
 * 1. Global settings (from Settings slice)
 * 2. Branch-specific overrides (if any)
 */
export const useAppSettings = () => {
    const globalSettings = useSelector((state: RootState) => state.settings);
    const { user, currentBranch } = useSelector((state: RootState) => state.auth);
    const tenantsList = useSelector((state: RootState) => state.tenant.tenants);

    const mergedSettings = useMemo(() => {
        if (!user || !user.branchId || currentBranch === 'All') {
            return globalSettings;
        }

        // Find the active tenant (usually the one the user belongs to)
        // Since the app supports multi-tenancy, we look for the tenant with the current branch
        const activeTenant = tenantsList.find(t =>
            t.locations?.some(loc => loc.branches.some(b => b.id === currentBranch))
        );

        if (!activeTenant || !activeTenant.locations) return globalSettings;

        // Find the specific branch in the active tenant
        let branchSettings: Partial<SettingsState> | undefined;
        for (const loc of activeTenant.locations) {
            const branch = loc.branches.find(b => b.id === currentBranch);
            if (branch && branch.settings) {
                branchSettings = branch.settings;
                break;
            }
        }

        if (!branchSettings) return globalSettings;

        // Merge branch overrides into global settings
        return {
            ...globalSettings,
            ...branchSettings,
            // Deep merge for nested objects if necessary (e.g., expiryRules, enabledModules)
            enabledModules: {
                ...globalSettings.enabledModules,
                ...(branchSettings.enabledModules || {})
            },
            rolePermissions: {
                ...globalSettings.rolePermissions,
                ...(branchSettings.rolePermissions || {})
            },
            expiryRules: branchSettings.expiryRules ? {
                ...globalSettings.expiryRules,
                ...branchSettings.expiryRules
            } : globalSettings.expiryRules
        } as SettingsState;
    }, [globalSettings, user, currentBranch, tenantsList]);

    return mergedSettings;
};
