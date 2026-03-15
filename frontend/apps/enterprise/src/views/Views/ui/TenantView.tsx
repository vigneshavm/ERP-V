import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '@/shared/ui/Layout/Sidebar';
import { RootState } from "@/app/store/store";
import { ConfigProvider } from "@/app/providers/ConfigProvider";
import { Tenant } from "@/entities/session/model/core";
import { LazyModules } from "@/app/registry/ModuleRegistry";
import { useUiStore } from "@/shared/lib/store/uiStore";

// Extracted Components & Hooks
import MobileNav from '@/shared/ui/Layout/MobileNav';
import ModuleRenderer from '@/shared/ui/Layout/ModuleRenderer';
import RouteDefinitions from '@/shared/ui/Layout/RouteDefinitions';
import GlobalModals from '@/shared/ui/Layout/GlobalModals';
import { useTabSync } from '@/widgets/sync-manager/lib/useTabSync';
import { useNavigation } from '@/app/providers/NavigationContext';
import ErrorBoundary from '@/shared/ui/ErrorBoundary';
import RouteErrorFallback from '@/shared/ui/RouteErrorFallback';

interface TenantViewProps {
    currentTenant: Tenant | null;
    isLoggedIn: boolean;
    onLogin: () => void;
    onLogout: () => void;
}

const TenantView: React.FC<TenantViewProps> = ({ currentTenant, isLoggedIn, onLogout }) => {
    const dispatch = useDispatch();
    const {  user  } = useAuthStore();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { currentView } = useNavigation();
    const {
        sidebarOpen,
        setSidebarOpen,
        isChangePasswordOpen,
        setIsChangePasswordOpen,
        confirmDialog,
        setConfirmDialog
    } = useUiStore();

    // Sync active tab with URL
    useTabSync();

    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- TODO(TS-FIX): Phase 2/3 fix
    const effectiveTenant = useMemo(() => {
        if (user?.tenantId) {
            return tenants.find((t: any) => t.id === user.tenantId) || currentTenant;
        }
        return currentTenant;
    }, [user?.tenantId, tenants, currentTenant]);

    if (!isLoggedIn) {
        return (
            <ConfigProvider tenant={effectiveTenant}>
                <ErrorBoundary 
                    fallback={({ error, resetError }) => (
                        <RouteErrorFallback error={error} resetError={resetError} />
                    )}
                >
                    <React.Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Login...</div>}>
                        <LazyModules.Login />
                    </React.Suspense>
                </ErrorBoundary>
            </ConfigProvider>
        );
    }

    const renderContent = () => (
        <ModuleRenderer activeTab={currentView} />
    );

    return (
        <ConfigProvider tenant={effectiveTenant}>
            <div className="flex h-screen bg-app overflow-hidden text-main selection:bg-primary/30">
                {/* Mobile Bottom Navigation */}
                <MobileNav />

                {/* Sidebar Component */}
                <Sidebar onLogout={onLogout} />

                {/* Main Content */}
                <main className="flex-1 overflow-hidden w-full bg-app relative">
                    <div className="h-full w-full overflow-y-auto p-3 md:p-6 pb-24 lg:pb-6 custom-scrollbar text-main scroll-smooth">
                        <RouteDefinitions renderContent={renderContent} />
                    </div>
                </main>

                {/* Overlay for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Modals & Dialogs */}
                <GlobalModals />
            </div>
        </ConfigProvider>
    );
};

export default TenantView;
