import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../../components/shared/Layout/Sidebar';
import { RootState } from "../../redux/store";
import { ConfigProvider } from "../../contexts/ConfigProvider";
import { Tenant } from "../../types/tenant";
import { LazyModules } from "../../services/ModuleRegistry";
import { useUiStore } from "../../shared/lib/store/uiStore";

// Extracted Components & Hooks
import MobileNav from '../../components/shared/Layout/MobileNav';
import ModuleRenderer from '../../components/shared/Layout/ModuleRenderer';
import RouteDefinitions from '../../components/shared/Layout/RouteDefinitions';
import GlobalModals from '../../components/shared/Layout/GlobalModals';
import { useTabSync } from '../../hooks/useTabSync';

interface TenantViewProps {
    currentTenant: Tenant | null;
    isLoggedIn: boolean;
    onLogin: () => void;
    onLogout: () => void;
}

const TenantView: React.FC<TenantViewProps> = ({ currentTenant, isLoggedIn, onLogout }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const {
        activeTab,
        sidebarOpen,
        setSidebarOpen,
        isChangePasswordOpen,
        setIsChangePasswordOpen,
        confirmDialog,
        setConfirmDialog
    } = useUiStore();

    // Sync active tab with URL
    useTabSync();

    const effectiveTenant = useMemo(() => {
        if (user?.tenantId) {
            return tenants.find(t => t.id === user.tenantId) || currentTenant;
        }
        return currentTenant;
    }, [user?.tenantId, tenants, currentTenant]);

    if (!isLoggedIn) {
        return (
            <ConfigProvider tenant={effectiveTenant}>
                <React.Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Login...</div>}>
                    <LazyModules.Login />
                </React.Suspense>
            </ConfigProvider>
        );
    }

    const renderContent = () => (
        <ModuleRenderer activeTab={activeTab} />
    );

    return (
        <ConfigProvider tenant={effectiveTenant}>
            <div className="flex h-screen bg-app overflow-hidden text-main">
                {/* Mobile Bottom Navigation */}
                <MobileNav />

                {/* Sidebar Component */}
                <Sidebar onLogout={onLogout} />

                {/* Main Content */}
                <main className="flex-1 overflow-hidden w-full bg-app relative">
                    <div className="h-full w-full overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 custom-scrollbar text-main">
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
                <GlobalModals
                    isChangePasswordOpen={isChangePasswordOpen}
                    setIsChangePasswordOpen={setIsChangePasswordOpen}
                    confirmDialog={confirmDialog}
                    setConfirmDialog={setConfirmDialog}
                />
            </div>
        </ConfigProvider>
    );
};

export default TenantView;
