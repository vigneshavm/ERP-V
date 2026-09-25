import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { RootState } from "../../../redux/store";
import { ConfigProvider } from "../../../contexts/ConfigProvider";
import { Tenant } from "../../../types/tenant/index";
import { LazyModules } from "../../../services/ModuleRegistry";
import { setSidebarOpen } from "../../../redux/slices/uiSlice";

// Extracted Components & Hooks
import MobileNav from './MobileNav';
import ModuleRenderer from './ModuleRenderer';
import RouteDefinitions from './RouteDefinitions';
import PageErrorBoundary from './PageErrorBoundary';
import GlobalModals from './GlobalModals';
import { useTabSync } from '../../../hooks/useTabSync';

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
    const { activeTab, sidebarOpen } = useSelector((state: RootState) => state.ui);

    // Sync active tab with URL
    useTabSync();

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const userTenantId = user?.tenantId;
    const effectiveTenant = useMemo(() => {
        if (userTenantId) {
            return tenants.find(t => t.id === userTenantId) || currentTenant;
        }
        return currentTenant;
    }, [userTenantId, tenants, currentTenant]);

    const location = useLocation();

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
                <main className="flex-1 overflow-hidden w-full bg-app relative p-4 lg:p-8">
                    <div className="h-full w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar text-main">
                        <PageErrorBoundary resetKey={location.pathname}>
                            <RouteDefinitions renderContent={renderContent} />
                        </PageErrorBoundary>
                    </div>
                </main>

                {/* Overlay for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => dispatch(setSidebarOpen(false))}
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
