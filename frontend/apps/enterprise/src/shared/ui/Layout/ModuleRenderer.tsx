import { useAuthStore } from '@repo/shared';
import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { Ban } from 'lucide-react';
import { RootState } from '@/app/store/store';
import { usePermissions } from '@/hooks/usePermissions';
import { AppView } from '@repo/shared';
import { LazyModules } from '@/app/registry/ModuleRegistry';
import EntitlementGuard from './EntitlementGuard';
import {
    DashboardSkeleton,
    GridSkeleton,
    TableSkeleton,
    FormSkeleton
} from '@/shared/ui/Feedback/Skeleton';
import ErrorBoundary from '@/shared/ui/ErrorBoundary';
import RouteErrorFallback from '@/shared/ui/RouteErrorFallback';

interface ModuleRendererProps {
    activeTab: string;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ activeTab }) => {
    const {  user, role  } = useAuthStore();
    const { checkAccess } = usePermissions();

    // Developer/Owner bypass - full access
    const isBypassUser = user?.email === 'avmvignesh0207@gmail.com';

    if (!isBypassUser && activeTab !== 'BANK_STATEMENT' && !checkAccess(activeTab as AppView)) {
        return (
            <EntitlementGuard
                view={activeTab as AppView}
                moduleName={activeTab.split('_')[0].charAt(0) + activeTab.split('_')[0].slice(1).toLowerCase()}
            >
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 animate-in fade-in">
                    <Ban className="w-16 h-16 mb-4 text-error/80 opacity-80" />
                    <h2 className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">Role Access Denied</h2>
                    <p className="mt-2 text-sm">Your role ({role}) does not have permission to view this specific view.</p>
                </div>
            </EntitlementGuard>
        );
    }

    const getLoader = () => {
        if (activeTab.includes('DASHBOARD')) return <DashboardSkeleton />;
        if (activeTab.includes('INVENTORY') || activeTab.includes('STOREFRONT')) return <GridSkeleton />;
        if (activeTab.includes('REGISTER') || activeTab.includes('HISTORY') || activeTab.includes('LEDGER') || activeTab.includes('LIST')) return <TableSkeleton />;
        if (activeTab.includes('ENTRY') || activeTab.includes('FORM') || activeTab.includes('CREATOR')) return <FormSkeleton />;
        return <DashboardSkeleton />; // Fallback Default
    };

    return (
        <ErrorBoundary 
            fallback={({ error, resetError }) => (
                <RouteErrorFallback error={error} resetError={resetError} />
            )}
        >
            <Suspense fallback={<div className="p-4 animate-in fade-in duration-500">{getLoader()}</div>}>
                {(() => {
                    switch (activeTab) {
                        // === DASHBOARD ===
                        case 'PROFIT_PULSE':
                        case 'DASHBOARD_SNAPSHOT':
                        case 'DASHBOARD': return <LazyModules.Dashboard />;
                        case 'DASHBOARD_OVERVIEW': return <LazyModules.Dashboard />;
                        case 'DASHBOARD_SUMMARY': return <LazyModules.DailyFinanceTracker />; // Today's Summary

                        // ... (rest of the switch remains the same)
                        default: return <LazyModules.Dashboard />;
                    }
                })()}
            </Suspense>
        </ErrorBoundary>
    );
};

export default ModuleRenderer;

