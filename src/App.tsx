import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';

import { RootState, setUser } from './store';
import { APP_CONFIG } from './config';
import { getSession, clearSession } from './utils/session';
import { useSupabaseData } from './hooks/useSupabaseData';
import { Tenant } from './types/tenant';

// Layout & Components
import LoadingScreen from './components/layout/LoadingScreen';
import { POSCustomerDisplay } from './components/pos/POSCustomerDisplay';

// Views
import LandingPage from './views/LandingPage';
import AdminView from './views/AdminView';
import TenantView from './views/TenantView';

// Standalone Pages
const ResetPassword = lazy(() => import('./components/ResetPassword'));

type ViewMode = 'LANDING' | 'ADMIN' | 'TENANT';

const App: React.FC = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    // 1. Standalone Modes (Customer Display)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'customer_display') {
        return <POSCustomerDisplay />;
    }

    // 2. Initialize Data Sync Hook
    useSupabaseData();

    // 3. View Management State
    const [viewMode, setViewMode] = useState<ViewMode>('LANDING');
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [isResolving, setIsResolving] = useState(APP_CONFIG.REQUIRE_TENANT_ID);
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!getSession());

    // 4. Auto-resolve Tenant if configured
    useEffect(() => {
        if (tenants.length > 0) {
            if (APP_CONFIG.REQUIRE_TENANT_ID && APP_CONFIG.DEPLOY_TENANT_ID && viewMode === 'LANDING') {
                const tenant = tenants.find(t => t.id === APP_CONFIG.DEPLOY_TENANT_ID);
                if (tenant) {
                    setCurrentTenant(tenant);
                    setViewMode('TENANT');
                }
            }
            setIsResolving(false);
        }
    }, [tenants, viewMode]);

    // 5. Restore Session
    useEffect(() => {
        const sessionUser = getSession();
        if (sessionUser && !user) {
            try {
                dispatch(setUser(sessionUser));
            } catch (e) {
                console.error("Failed to restore session", e);
                clearSession();
                setIsLoggedIn(false);
            }
        }
    }, [dispatch, user]);

    if (isResolving) return <LoadingScreen />;

    // 6. Root Router / Switch
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={
                    (() => {
                        switch (viewMode) {
                            case 'LANDING':
                                return (
                                    <LandingPage
                                        onSelectAdmin={() => setViewMode('ADMIN')}
                                        onSelectTenant={(tenant) => {
                                            setCurrentTenant(tenant);
                                            setViewMode('TENANT');
                                            setIsLoggedIn(false); // Force login for new tenant
                                        }}
                                    />
                                );
                            case 'ADMIN':
                                return (
                                    <AdminView
                                        onLogout={() => setViewMode('LANDING')}
                                        onLoginAsTenant={(tenant) => {
                                            setCurrentTenant(tenant);
                                            setViewMode('TENANT');
                                            setIsLoggedIn(false);
                                        }}
                                    />
                                );
                            case 'TENANT':
                                return (
                                    <TenantView
                                        currentTenant={currentTenant}
                                        isLoggedIn={isLoggedIn}
                                        onLogin={() => setIsLoggedIn(true)}
                                        onLogout={() => {
                                            clearSession();
                                            localStorage.removeItem('erp_current_tenant');
                                            setIsLoggedIn(false);
                                        }}
                                    />
                                );
                            default:
                                return <LandingPage onSelectAdmin={() => setViewMode('ADMIN')} onSelectTenant={() => { }} />;
                        }
                    })()
                } />
            </Routes>
        </Suspense>
    );
};

export default App;
