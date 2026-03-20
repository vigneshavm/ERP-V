import { useAuthStore } from '@repo/shared';
import { AppView, ModuleType } from '@repo/shared';

export const usePermissions = () => {
    const { user, role } = useAuthStore();

    const isSuperAdmin = role === 'Owner' || role === 'Admin' || role === 'SuperAdmin';

    const checkAccess = (viewId: AppView | string): boolean => {
        if (!user) return false;
        if (isSuperAdmin) return true;
        // TODO: replace with server-driven permissions map keyed by role
        return true;
    };

    const checkModuleAccess = (module: ModuleType | string | undefined): boolean => {
        if (!user) return false;
        if (isSuperAdmin) return true;
        if (!module) return true;
        // TODO: replace with server-driven module permission map
        return true;
    };

    return { checkAccess, checkModuleAccess, isSuperAdmin };
};

