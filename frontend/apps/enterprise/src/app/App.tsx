import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, Store, ArrowRight, LogOut } from 'lucide-react';

import { AuthGuard } from "@repo/ui";
import { useAppBootstrap } from '@/shared/hooks/useAppBootstrap';
import { POSCustomerDisplay } from '@/pages/Pos/ui/POSCustomerDisplay';

// Views
import LandingPage from '@/pages/AppLayout/LandingPage';
import AdminView from '@/pages/AppLayout/AdminView';
import LoadingScreen from '@/pages/AppLayout/LoadingScreen';
import TenantView from '@/pages/Views/ui/TenantView';
import ResetPassword from '@/pages/auth/ui/ResetPassword';
import ForgotPassword from '@/pages/auth/ui/ForgotPassword';
import TenantSignUp from '@/pages/People/Tenants/TenantSignUp';

import { RootState } from '@/app/store/store';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useDBDataSync } from '@/widgets/sync-manager/lib/useDBDataSync';
import { getSession, clearSession } from '@/shared/lib/utils/session';
import { APP_CONFIG } from '@/app/config';
import { logger } from '@/shared/lib/logger';
import { setUser, getProfile } from '@/entities/session/model/authSlice';
import AdminLogin from '@/features/auth-by-email/ui/AdminLogin';
import TenantManager from '@/pages/People/Tenants/TenantManager';




const MainContent: React.FC = () => {
  const navigate = useNavigate();
  const { 
    viewMode, 
    isResolving, 
    currentTenant, 
    user, 
    handlers 
  } = useAppBootstrap();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'customer_display') {
    return <POSCustomerDisplay />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={
          <TenantSignUp 
            onComplete={() => navigate('/')} 
            onBackToLogin={() => navigate('/login')} 
          />
        } />

        <Route path="/*" element={
          isResolving ? <LoadingScreen /> :
          viewMode === 'ADMIN' ? (
            <AdminView 
              setViewMode={handlers.setViewMode} 
              setCurrentTenant={handlers.setCurrentTenant} 
              setIsLoggedIn={handlers.setIsLoggedIn} 
            />
          ) :
          viewMode === 'TENANT' ? (
            <TenantView
              currentTenant={currentTenant}
              isLoggedIn={!!user}
              onLogout={() => handlers.setIsLoggedIn(false)}
              onLogin={() => handlers.setViewMode('LANDING')}
            />
          ) : (
            <LandingPage 
              setViewMode={handlers.setViewMode} 
              setCurrentTenant={handlers.setCurrentTenant} 
              setIsLoggedIn={handlers.setIsLoggedIn} 
            />
          )
        } />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthGuard>
      <MainContent />
    </AuthGuard>
  );
};

export default App;
