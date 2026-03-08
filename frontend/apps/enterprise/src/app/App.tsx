import React, { useState } from 'react';
import { Shield, Store, LogOut, ArrowRight } from 'lucide-react';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { setUser, getProfile } from '@/entities/session/model/authSlice';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { APP_CONFIG } from './config';

import Login from '@/pages/auth/ui/Login';
import AdminLogin from '@/features/auth-by-email/ui/AdminLogin';
import ResetPassword from '@/pages/auth/ui/ResetPassword';
import ForgotPassword from '@/pages/auth/ui/ForgotPassword';
import Register from '@/pages/auth/ui/Register';
import TenantManager from '@/pages/People/Tenants/TenantManager';
import TenantSignUp from '@/pages/People/Tenants/TenantSignUp';
import { POSCustomerDisplay } from '@/pages/Pos/ui/POSCustomerDisplay';

// Config
import { ConfigProvider } from '@/app/providers/ConfigProvider';
import { useDBDataSync } from '@/widgets/sync-manager/lib/useDBDataSync';
import { getSession, clearSession } from '@/shared/lib/utils/session';

import { Tenant } from '@/entities/session/model/core';
import { Routes, Route } from 'react-router-dom';

// NEW: Imported TenantView
import TenantView from '@/pages/Views/ui/TenantView';

type ViewMode = 'LANDING' | 'ADMIN' | 'TENANT';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { user, role } = useSelector((state: RootState) => state.auth);

  // Check for Customer Display Mode (Standalone)
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  if (mode === 'customer_display') {
    return <POSCustomerDisplay />;
  }

  // Initialize MongoDB Data Sync
  useDBDataSync();

  // Determine initial view mode based on session
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return getSession() ? 'TENANT' : 'LANDING';
  });

  const { tenants } = useSelector((state: RootState) => state.tenant);

  // Fetch profile on mount if user exists but role might be stale/missing
  React.useEffect(() => {
    if (user && user.token) {
      // Dispatch getProfile to fetch latest role and details
      dispatch(getProfile() as any);
    }
  }, [dispatch, user?.token]); // Dependency on token ensures run on login/reload

  // Initialize currentTenant from localStorage if available, or null
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(() => {
    const storedTenantId = localStorage.getItem('erp_current_tenant');
    // If we have tenants loaded in Redux (unlikely on first render, but possible if persisted), try to find it
    // Otherwise, we might need to rely on the side-effect below to set it once tenants load
    // For now, we mainly need the ID to be recognized. 
    // Ideally, we should reconstruct a partial tenant or wait for tenants to load.
    // simpler approach: if we have a stored ID, we assume we are in TENANT mode.
    return null;
  });

  const [isResolving, setIsResolving] = useState(APP_CONFIG?.REQUIRE_TENANT_ID ?? true);

  // --- Single Tenant Auto-Selection & Restoration ---
  React.useEffect(() => {
    // 1. Restore from LocalStorage if tenants are loaded
    const storedTenantId = localStorage.getItem('erp_current_tenant');

    if (tenants.length > 0) {
      // Priority 1: Restore previous session tenant
      if (storedTenantId) {
        const restoredTenant = tenants.find(t => t.id === storedTenantId);
        if (restoredTenant) {
          setCurrentTenant(restoredTenant);
          setViewMode('TENANT');
          setIsResolving(false);
          return;
        }
      }

      // Priority 2: Config-based Single Tenant (Deploy Mode)
      if (APP_CONFIG?.REQUIRE_TENANT_ID && APP_CONFIG?.DEPLOY_TENANT_ID && viewMode === 'LANDING') {
        const tenant = tenants.find(t => t.id === APP_CONFIG.DEPLOY_TENANT_ID);
        if (tenant) {
          setCurrentTenant(tenant);
          setViewMode('TENANT');
        }
      }
      setIsResolving(false);
    } else {
      // If no tenants loaded yet, but we have a session, stop resolving after a timeout or let it ride?
      // Actually, if we are logged in, we might check if we can restore tenant ID even without full tenant list?
      // For now, let's just ensure isResolving turns false so we don't get stuck.
      // But giving it a small delay or dependency check is better.
      if (!APP_CONFIG?.REQUIRE_TENANT_ID) {
        setIsResolving(false);
      }
    }
  }, [tenants, viewMode]);

  // --- Tenant specific state ---
  const { activeTab, setActiveTab } = useUiStore();

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getSession());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // --- Restore Session on Mount ---
  React.useEffect(() => {
    const sessionUser = getSession();
    if (sessionUser && !user) {
      try {
        dispatch(setUser(sessionUser));
      } catch (e) {
        console.error("Failed to restore session", e);
        clearSession();
      }
    }
  }, [dispatch, user]);

  // --- Sync isLoggedIn with Redux user state ---
  React.useEffect(() => {
    // When user is set in Redux (after successful login), update isLoggedIn
    if (user && user._id) {
      setIsLoggedIn(true);
    } else if (!user && !getSession()) {
      setIsLoggedIn(false);
    }
  }, [user]);

  // --- Role-based Default Page ---
  React.useEffect(() => {
    if (isLoggedIn && role) {
      if (role === 'Staff') {
        if (activeTab === 'DASHBOARD') {
          setActiveTab('DASHBOARD');
        }
      }
    }
  }, [isLoggedIn, role, dispatch]);

  // --- Global Auth Listener (Handle 401 from API) ---
  React.useEffect(() => {
    const handleUnauthorized = () => {
      // Immediate cleanup to unmount authenticated components
      clearSession();
      setIsLoggedIn(false);
      dispatch(setUser(null));
      setViewMode('LANDING'); // Reset view to landing
      console.log("🔒 Force logout triggered by API 401");
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch]);

  // --- Helper for logout ---
  const handleTenantLogout = () => {
    // Confirmation is handled in TenantView usually, but if it delegates to here:
    // However, we want TenantView to handle the UI confirmation using its own state.
    // We pass a callback that performs the actual session clear.

    // Wait, standard behavior in App.tsx was:
    // requestConfirm('Lock Terminal'...) -> clearSession(); setIsLoggedIn(false);

    // TenantView now has its own handleLogout that calls onLogout or defaults.
    // We can pass a simple callback that updates App state.
    // But TenantView clears session itself in the fallback. 
    // Let's rely on TenantView to manage the "Lock Terminal" dialog internally?
    // Yes, I copied the state `confirmDialog` into TenantView.tsx.
    // So onLogout passed to TenantView should just update the parent state `isLoggedIn`
    // OR handle the redirect.

    // Actually, TenantView.tsx has:
    // handleLogout -> requestConfirm -> onConfirm -> clearSession(); localStorage...; setIsLoggedIn(false);
    // Wait, `setIsLoggedIn` in TenantView.tsx refers to WHICH state?
    // I did NOT define `isLoggedIn` state in TenantView.tsx. I defined it as a PROP.
    // So `setIsLoggedIn(false)` inside TenantView.tsx will fail compilation!

    // GOOD CATCH. I need to check TenantView.tsx content I just wrote.
  };

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

  // --- Main Render ---
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<TenantSignUp onComplete={() => window.location.href = '/'} onBackToLogin={() => window.location.href = '/login'} />} />
        <Route path="/*" element={
          isResolving ? <LoadingScreen /> :
            viewMode === 'ADMIN' ? <AdminView /> :
              viewMode === 'TENANT' ? (
                <TenantView
                  currentTenant={currentTenant}
                  isLoggedIn={isLoggedIn}
                  onLogout={() => {
                    // Callback from TenantView when user confirms logout
                    clearSession();
                    setIsLoggedIn(false);
                  }}
                  onLogin={() => setIsLoggedIn(true)}
                />
              ) :
                <LandingPage />
        } />
      </Routes>
    </>
  );
};

export default App;
