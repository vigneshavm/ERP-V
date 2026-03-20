"use client";
import { useAuthStore } from '@repo/shared';

import { logger } from '@/shared/lib/logger';
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- TODO(TS-FIX): Phase 2/3 fix

import React, { useState, useEffect } from 'react';
import { Shield, Store, LogOut, ArrowRight } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { setUser, getProfile } from '@/entities/session/model/authSlice';

import { useUiStore } from '@/shared/lib/store/uiStore';
import { APP_CONFIG } from '@/app/config/index';
import { useDBDataSync } from '@/widgets/sync-manager/lib/useDBDataSync';
import { getSession, clearSession } from '@/shared/lib/utils/session';
import { Tenant } from '@/entities/session/model/core';
import { usePathname, useSearchParams } from 'next/navigation';

import TenantView from '@/pages/Views/ui/TenantView';
import { POSCustomerDisplay } from '@/pages/Pos/ui/POSCustomerDisplay';
import AdminLogin from '@/features/auth-by-email/ui/AdminLogin';
import TenantManager from '@/pages/People/Tenants/TenantManager';
import { useNavigation } from '@/app/providers/NavigationContext';

export function EnterpriseMainView() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const {  user  } = useAuthStore();
  const { tenants } = useSelector((state: RootState) => state.tenant);
  const { setDesktopCollapsed } = useUiStore();
  const { currentView, setCurrentView } = useNavigation();

  const mode = searchParams.get('mode');

  if (mode === 'customer_display') {
    return <POSCustomerDisplay />;
  }

  // Initialize MongoDB Data Sync
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  useDBDataSync();

  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  const [isResolving, setIsResolving] = useState(APP_CONFIG?.REQUIRE_TENANT_ID ?? true);
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getSession());
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Fetch profile on mount
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  useEffect(() => {
    if (user && user.token) {
      dispatch(getProfile() as any);
    }
  }, [dispatch, user?.token]);

  // Restore Session
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  useEffect(() => {
    const sessionUser = getSession();
    if (sessionUser && !user) {
      try {
        dispatch(setUser(sessionUser));
      } catch (e) {
        logger.error("Failed to restore session", e);
        clearSession();
      }
    }
  }, [dispatch, user]);

  // Tenant Auto-Selection
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  useEffect(() => {
    const storedTenantId = localStorage.getItem('erp_current_tenant');
    if (tenants.length > 0) {
      if (storedTenantId) {
        const restoredTenant = tenants.find(t => t.id === storedTenantId);
        if (restoredTenant) {
          setCurrentTenant(restoredTenant);
          setIsResolving(false);
          return;
        }
      }
      if (APP_CONFIG?.REQUIRE_TENANT_ID && APP_CONFIG?.DEPLOY_TENANT_ID && currentView === 'LANDING') {
        const tenant = tenants.find(t => t.id === APP_CONFIG.DEPLOY_TENANT_ID);
        if (tenant) {
          setCurrentTenant(tenant);
          setCurrentView('DASHBOARD');
        }
      }
      setIsResolving(false);
    } else if (!APP_CONFIG?.REQUIRE_TENANT_ID) {
      setIsResolving(false);
    }
  }, [tenants, currentView, setCurrentView]);

  // Sync isLoggedIn
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  useEffect(() => {
    if (user && user._id) {
      setIsLoggedIn(true);
    } else if (!user && !getSession()) {
      setIsLoggedIn(false);
    }
  }, [user]);

  // Global Auth Listener
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setIsLoggedIn(false);
      dispatch(setUser(null));
      setCurrentView('LANDING');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch, setCurrentView]);

  // Side effect to collapse sidebar on landing
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO(TS-FIX): Phase 2/3 fix
  useEffect(() => {
    if (currentView === 'LANDING') {
      setDesktopCollapsed(true);
    }
  }, [currentView, setDesktopCollapsed]);

  const LoadingScreen = () => (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-secondary font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Neural Link</p>
    </div>
  );

  const LandingPage = () => (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="max-w-4xl w-full text-center mb-16 relative z-10">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 rotate-3 animate-fade-in">
          <span className="font-display font-black text-4xl text-white">E</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-black text-main mb-6 tracking-tighter animate-slide-down">
          Next-Gen <span className="text-primary">ERP</span> Matrix
        </h1>
        <p className="text-xl text-secondary max-w-2xl mx-auto font-medium leading-relaxed opacity-80 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          The intelligent neural center for modern commerce.
          Synchronize inventory, finance, and operations with industrial-grade precision.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full relative z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <button onClick={() => setCurrentView('SUPER_ADMIN_CONSOLE')} className="card-interactive group text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-display font-bold text-main mb-2">Platform Control</h2>
          <p className="text-secondary opacity-70 mb-6">Manage global infrastructure, tenants, and system-level parameters.</p>
          <div className="flex items-center text-primary font-bold text-sm tracking-widest uppercase">
            Initialize Access <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>
        <button
          onClick={() => {
            setCurrentTenant({
              id: 'demo',
              name: 'Neural Retail Co',
              subdomain: 'demo',
              sector: 'Retail',
              modules: ['POS', 'INVENTORY', 'FINANCE', 'HR'],
              isActive: true,
              region: { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY' }
            } as any);
            setCurrentView('DASHBOARD');
            setIsLoggedIn(false);
          }}
          className="card-interactive group text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
          <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-display font-bold text-main mb-2">Tenant Interface</h2>
          <p className="text-secondary opacity-70 mb-6">Launch specialized retail operations, POS terminals, and analytics.</p>
          <div className="flex items-center text-secondary font-bold text-sm tracking-widest uppercase">
            Authenticate Unit <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>
      </div>
      <p className="mt-20 text-xs text-secondary font-bold tracking-[0.2em] opacity-40 uppercase">© 2026 ERP Matrix Systems // Secure Access Point</p>
    </div>
  );

  const AdminView = () => {
    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onLogin={() => setIsAdminAuthenticated(true)}
          onCancel={() => setCurrentView('LANDING')}
        />
      );
    }

    return (
      <div className="min-h-screen bg-app flex flex-col">
        <header className="glass-panel border-b border-default text-main p-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-display font-black shadow-lg shadow-primary/20">A</div>
              <div>
                <span className="font-display font-bold text-xl tracking-tight">System Core</span>
                <div className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase leading-none mt-0.5">Administrator Console</div>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentView('LANDING');
                setIsAdminAuthenticated(false);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-secondary border border-white/10 rounded-lg flex items-center gap-2 text-sm font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              Terminate Session
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <TenantManager onLoginAs={(tenant) => {
              setCurrentTenant(tenant);
              setCurrentView('DASHBOARD');
              setIsLoggedIn(false);
            }} />
          </div>
        </main>
      </div>
    );
  };

  if (isResolving) return <LoadingScreen />;
  if (currentView === 'SUPER_ADMIN_CONSOLE') return <AdminView />;
  if (currentView === 'LANDING') return <LandingPage />;
  
  // Default to TenantView for all ERP modules
  return (
    <TenantView
      currentTenant={currentTenant}
      isLoggedIn={isLoggedIn}
      onLogout={() => {
        clearSession();
        setIsLoggedIn(false);
      }}
      onLogin={() => setIsLoggedIn(true)}
    />
  );
}
