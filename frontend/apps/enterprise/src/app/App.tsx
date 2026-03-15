import { logger } from '@/shared/lib/logger';
import React, { useState } from 'react';
import { AuthGuard } from "@repo/ui";
import { Shield, Store, LogOut, ArrowRight } from 'lucide-react';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { setUser, getProfile } from '@/entities/session/model/authSlice';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { APP_CONFIG } from './config';

import Login from '@/views/auth/ui/Login';
import AdminLogin from '@/features/auth-by-email/ui/AdminLogin';
import ResetPassword from '@/views/auth/ui/ResetPassword';
import ForgotPassword from '@/views/auth/ui/ForgotPassword';
import Register from '@/views/auth/ui/Register';
import TenantManager from '@/views/People/Tenants/TenantManager';
import TenantSignUp from '@/views/People/Tenants/TenantSignUp';
import { POSCustomerDisplay } from '@/views/Pos/ui/POSCustomerDisplay';

// Config
import { ConfigProvider } from '@/app/providers/ConfigProvider';
import { useDBDataSync } from '@/widgets/sync-manager/lib/useDBDataSync';
import { getSession, clearSession } from '@/shared/lib/utils/session';

import { Tenant } from '@/entities/session/model/core';
import { Routes, Route } from 'react-router-dom';

// NEW: Imported TenantView
import TenantView from '@/views/Views/ui/TenantView';

type ViewMode = 'LANDING' | 'ADMIN' | 'TENANT';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface AuthenticatedAppProps {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  isResolving: boolean;
  setIsResolving: (isResolving: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({
  currentTenant,
  setCurrentTenant,
  isLoggedIn,
  setIsLoggedIn,
  isResolving,
  setIsResolving,
  viewMode,
  setViewMode
}) => {
  const dispatch = useDispatch();
  const { user, role } = useSelector((state: RootState) => state.auth);
  const { tenants } = useSelector((state: RootState) => state.tenant);
  const { activeTab, setActiveTab } = useUiStore();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useDBDataSync();

  // Fetch profile on mount if user exists but role might be stale/missing
  React.useEffect(() => {
    if (user && user.token) {
      dispatch(getProfile() as any);
    }
  }, [dispatch, user?.token]);

  // --- Single Tenant Auto-Selection & Restoration ---
  React.useEffect(() => {
    const storedTenantId = localStorage.getItem('erp_current_tenant');

    if (tenants.length > 0) {
      if (storedTenantId) {
        const restoredTenant = tenants.find(t => t.id === storedTenantId);
        if (restoredTenant) {
          setCurrentTenant(restoredTenant);
          setViewMode('TENANT');
          setIsResolving(false);
          return;
        }
      }

      if (APP_CONFIG?.REQUIRE_TENANT_ID && APP_CONFIG?.DEPLOY_TENANT_ID && viewMode === 'LANDING') {
        const tenant = tenants.find(t => t.id === APP_CONFIG.DEPLOY_TENANT_ID);
        if (tenant) {
          setCurrentTenant(tenant);
          setViewMode('TENANT');
        }
      }
      setIsResolving(false);
    } else {
      if (!APP_CONFIG?.REQUIRE_TENANT_ID) {
        setIsResolving(false);
      }
    }
  }, [tenants, viewMode, setCurrentTenant, setIsResolving, setViewMode]);

  // --- Restore Session on Mount ---
  React.useEffect(() => {
    const sessionUser = getSession();
    if (sessionUser && !user) {
      try {
        dispatch(setUser(sessionUser));
      } catch (e) {
        logger.error("Failed to restore session", e as any);
        clearSession();
      }
    }
  }, [dispatch, user]);

  // --- Sync isLoggedIn with Redux user state ---
  React.useEffect(() => {
    if (user && user._id) {
      setIsLoggedIn(true);
    } else if (!user && !getSession()) {
      setIsLoggedIn(false);
    }
  }, [user, setIsLoggedIn]);

  // --- Role-based Default Page ---
  React.useEffect(() => {
    if (isLoggedIn && role) {
      if (role === 'Staff') {
        if (activeTab === 'DASHBOARD') {
          setActiveTab('DASHBOARD');
        }
      }
    }
  }, [isLoggedIn, role, activeTab, setActiveTab]);

  // --- Global Auth Listener (Handle 401 from API) ---
  React.useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setIsLoggedIn(false);
      dispatch(setUser(null));
      setViewMode('LANDING');
      logger.info("🔒 Force logout triggered by API 401");
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch, setIsLoggedIn, setViewMode]);

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
      {/* Background Decoration */}
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
        <button
          onClick={() => setViewMode('ADMIN')}
          className="card-interactive group text-left relative overflow-hidden"
        >
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
            setViewMode('TENANT');
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
          onCancel={() => setViewMode('LANDING')}
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
                setViewMode('LANDING');
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
              setViewMode('TENANT');
              setIsLoggedIn(false);
            }} />
          </div>
        </main>
      </div>
    );
  };

  return (
    <>
      {isResolving ? <LoadingScreen /> :
        viewMode === 'ADMIN' ? <AdminView /> :
          viewMode === 'TENANT' ? (
            <TenantView
              currentTenant={currentTenant}
              isLoggedIn={isLoggedIn}
              onLogout={() => {
                clearSession();
                setIsLoggedIn(false);
              }}
              onLogin={() => setIsLoggedIn(true)}
            />
          ) :
            <LandingPage />
      }
    </>
  );
};

const App: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return getSession() ? 'TENANT' : 'LANDING';
  });
  const [isResolving, setIsResolving] = useState(APP_CONFIG?.REQUIRE_TENANT_ID ?? true);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getSession());

  if (mode === 'customer_display') {
    return (
      <AuthGuard>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        <POSCustomerDisplay />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<TenantSignUp onComplete={() => window.location.href = '/'} onBackToLogin={() => window.location.href = '/login'} />} />
        <Route path="/*" element={
          <AuthenticatedApp
            currentTenant={currentTenant}
            setCurrentTenant={setCurrentTenant}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            isResolving={isResolving}
            setIsResolving={setIsResolving}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        } />
      </Routes>
    </AuthGuard>
  );
};

export default App;
