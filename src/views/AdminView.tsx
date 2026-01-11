import React, { lazy, Suspense } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { Tenant } from '../types/tenant';

// Lazy load heavy component
const TenantManager = lazy(() => import('../components/TenantManager'));

interface AdminViewProps {
    onLogout: () => void;
    onLoginAsTenant: (tenant: Tenant) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout, onLoginAsTenant }) => (
    <div className="min-h-screen bg-slate-100 flex flex-col">
        <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
                    <span className="font-bold text-lg">Super Admin Portal</span>
                </div>
                <button
                    onClick={onLogout}
                    className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                }>
                    <TenantManager onLoginAs={onLoginAsTenant} />
                </Suspense>
            </div>
        </main>
    </div>
);

export default AdminView;
