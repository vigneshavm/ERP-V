import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

};

export default App;
