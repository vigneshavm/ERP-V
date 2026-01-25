import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { AppView, ModuleType } from '../../types/common';
import UpgradeUpsell from './UpgradeUpsell';

interface EntitlementGuardProps {
    view?: AppView;
    module?: ModuleType;
    moduleName?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * EntitlementGuard
 * 
 * Protects a feature or route based on tenant entitlements.
 * Use 'module' for strictly plan-based checks, or 'view' for combined role+plan checks.
 */
const EntitlementGuard: React.FC<EntitlementGuardProps> = ({
    view,
    module,
    moduleName,
    children,
    fallback
}) => {
    const { checkAccess, checkModuleAccess } = usePermissions();

    let hasAccess = false;
    if (view) {
        hasAccess = checkAccess(view);
    } else if (module) {
        hasAccess = checkModuleAccess(module);
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <UpgradeUpsell
            moduleName={moduleName || (module ? module.replace(/_/g, ' ') : (view ? view.replace(/_/g, ' ') : 'this feature'))}
        />
    );
};

export default EntitlementGuard;
