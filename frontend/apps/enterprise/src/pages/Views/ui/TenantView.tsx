import { useAuthStore } from '@repo/shared';
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
import RouteDefinitions from '@/shared/ui/Layout/RouteDefinitions';
import GlobalModals from '@/shared/ui/Layout/GlobalModals';
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
    const { user } = useAuthStore();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const {
        sidebarOpen,
        setSidebarOpen,
        isChangePasswordOpen,
        setIsChangePasswordOpen,
        confirmDialog,
        setConfirmDialog
    } = useUiStore();

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

    return (
        <ConfigProvider tenant={effectiveTenant}>
            <div className="flex h-screen bg-app overflow-hidden text-main selection:bg-primary/30">
                <MobileNav />
                <Sidebar onLogout={onLogout} />
                <main className="flex-1 overflow-hidden w-full bg-app relative">
                    <div className="h-full w-full overflow-y-auto pb-24 lg:pb-6 custom-scrollbar scroll-smooth relative z-10">
                        <RouteDefinitions />
                    </div>
                </main>
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                <GlobalModals />
            </div>
        </ConfigProvider>
    );
};

export default TenantView;
