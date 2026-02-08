import React, { useState } from 'react';
import { Shield, Store, LogOut, ArrowRight } from 'lucide-react';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './redux/store';
import { setUser } from './redux/slices/authSlice';
import { setActiveTab } from './redux/slices/uiSlice';
import { APP_CONFIG } from './config';

import Login from './pages/Auth/Login';
import AdminLogin from './components/AdminLogin';
import ResetPassword from './pages/Auth/ResetPassword';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Register from './pages/Auth/Register';
import TenantManager from './pages/People/Tenants/TenantManager';
import { POSCustomerDisplay } from './pages/Pos/POSCustomerDisplay';

// Config
import { ConfigProvider } from './contexts/ConfigProvider';
import { useDBDataSync } from './hooks/useDBDataSync';
import { getSession, clearSession } from './utils/session';

import { Tenant } from './types/tenant';
import { Routes, Route } from 'react-router-dom';

// NEW: Imported TenantView
import TenantView from './pages/Views/TenantView';

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
  const { activeTab } = useSelector((state: RootState) => state.ui);

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
        dispatch(setActiveTab('POS'));
      } else {
        // Only reset to Dashboard if not already on a specific tab (preserves current view on refresh)
        if (activeTab === 'DASHBOARD') {
          dispatch(setActiveTab('DASHBOARD'));
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-slate-500 font-medium animate-pulse">Initializing Terminal...</p>
    </div>
  );

  const LandingPage = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center mb-12">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/20">
          <span className="font-bold text-3xl text-white">E</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Enterprise Manager</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          The all-in-one ERP & POS platform for modern retail chains.
          Manage inventory, sales, finance, and workforce from a single dashboard.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl w-full">
        <button
          onClick={() => setViewMode('ADMIN')}
          className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-blue-600 hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="absolute top-6 right-6 text-slate-300 group-hover:text-blue-600 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Super Admin</h2>
          <p className="text-slate-500">Provision new tenants, manage subscriptions, and oversee platform health.</p>
        </button>

        <button
          onClick={() => {
            // Setup demo tenant
            setCurrentTenant({
              id: 'demo',
              name: 'Demo Retail Co',
              subdomain: 'demo',
              sector: 'Retail',
              modules: ['POS', 'INVENTORY', 'FINANCE', 'HR'],
              isActive: true, // Assuming isActive needed
              region: { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY' }
            } as any);
            setViewMode('TENANT');
            setIsLoggedIn(false); // Force login
          }}
          className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-emerald-600 hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="absolute top-6 right-6 text-slate-300 group-hover:text-emerald-600 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tenant Login</h2>
          <p className="text-slate-500">Access your store's POS, Inventory, and Financial dashboards.</p>
        </button>
      </div>

      <p className="mt-12 text-sm text-slate-400">© 2024 Enterprise Manager Platform. All rights reserved.</p>
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
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
              <span className="font-bold text-lg">Super Admin Portal</span>
            </div>
            <button
              onClick={() => {
                setViewMode('LANDING');
                setIsAdminAuthenticated(false);
              }}
              className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
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
        <Route path="/signup" element={<Register />} />
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
