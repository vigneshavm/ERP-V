import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, Store, ArrowRight, LogOut } from 'lucide-react';

import { AuthGuard } from "@repo/ui";
import { useAppBootstrap } from '@/shared/hooks/useAppBootstrap';
import { POSCustomerDisplay } from '@/views/Pos/ui/POSCustomerDisplay';

// Views
import LandingPage from '@/views/AppLayout/LandingPage';
import AdminView from '@/views/AppLayout/AdminView';
import LoadingScreen from '@/views/AppLayout/LoadingScreen';
import TenantView from '@/views/Views/ui/TenantView';
import ResetPassword from '@/views/auth/ui/ResetPassword';
import ForgotPassword from '@/views/auth/ui/ForgotPassword';
import TenantSignUp from '@/views/People/Tenants/TenantSignUp';

import { RootState } from '@/app/store/store';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useDBDataSync } from '@/widgets/sync-manager/lib/useDBDataSync';
import { getSession, clearSession } from '@/shared/lib/utils/session';
import { APP_CONFIG } from '@/app/config';
import { logger } from '@/shared/lib/logger';
import { setUser, getProfile } from '@/entities/session/model/authSlice';
import AdminLogin from '@/features/auth-by-email/ui/AdminLogin';
import TenantManager from '@/views/People/Tenants/TenantManager';




const App: React.FC = () => {
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
    return (
      <AuthGuard>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        <POSCustomerDisplay />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
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
    </AuthGuard>
  );
};

export default App;
