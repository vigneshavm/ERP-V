import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import AdminLogin from '@/features/auth-by-email/ui/AdminLogin';
import TenantManager from '@/pages/People/Tenants/TenantManager';
import { Tenant } from '@/entities/session/model/core';

interface AdminViewProps {
  setViewMode: (mode: 'LANDING' | 'ADMIN' | 'TENANT') => void;
  setCurrentTenant: (tenant: Tenant) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ setViewMode, setCurrentTenant, setIsLoggedIn }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

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

export default AdminView;
