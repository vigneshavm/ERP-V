import { logger } from '@/shared/lib/logger';
import React, { useState } from 'react';
import { AuthGuard } from "@repo/ui";
import { Shield, Store, LogOut, ArrowRight } from 'lucide-react';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';

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

import AdminView from '@/views/AppLayout/AdminView';
import LandingPage from '@/views/AppLayout/LandingPage';
import LoadingScreen from '@/views/AppLayout/LoadingScreen';
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
  const {  user, role  } = useAuthStore();
  const { tenants } = useSelector((state: RootState) => state.tenant);
  const { activeTab, setActiveTab } = useUiStore();

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
        logger.error("Failed to restore session", e);
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



  return (
    <>
      {isResolving ? <LoadingScreen /> :
        viewMode === 'ADMIN' ? <AdminView setViewMode={setViewMode} setCurrentTenant={setCurrentTenant} setIsLoggedIn={setIsLoggedIn} /> :
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
            <LandingPage setViewMode={setViewMode} setCurrentTenant={setCurrentTenant} setIsLoggedIn={setIsLoggedIn} />
      }
    </>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
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
        <Route path="/signup" element={<TenantSignUp onComplete={() => navigate('/')} onBackToLogin={() => navigate('/login')} />} />

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
