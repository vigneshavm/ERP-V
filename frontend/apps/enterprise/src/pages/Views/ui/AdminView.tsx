import React, { lazy, Suspense, useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { Tenant } from "@/types/tenant";

// Lazy load heavy components
// const TenantManager = ({ onLoginAs }: { onLoginAs: any }) => <div className="p-4 bg-white rounded-lg">Tenant Manager Module Not Found</div>; // Missing file
const TenantManager = ({ onLoginAs }: { onLoginAs: any }) => <div className="p-4 bg-white rounded-lg">Tenant Manager Module Not Found</div>;
const SuperAdminGrowthConsole = lazy(() => import("../System/Architecture/SuperAdminGrowthConsole"));

interface AdminViewProps {
    onLogout: () => void;
    onLoginAsTenant: (tenant: Tenant) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout, onLoginAsTenant }) => {
    const [activeTab, setActiveTab] = useState<'fleet' | 'growth'>('fleet');

    return (
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
                    {/* Tab Navigation */}
                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit mb-8 shadow-sm">
                        <button
                            onClick={() => setActiveTab('fleet')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'fleet' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Tenant Fleet
                        </button>
                        <button
                            onClick={() => setActiveTab('growth')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'growth' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Growth Architecture
                        </button>
                    </div>

                    <Suspense fallback={
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    }>
                        {activeTab === 'fleet' ? (
                            <TenantManager onLoginAs={onLoginAsTenant} />
                        ) : (
                            <SuperAdminGrowthConsole />
                        )}
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default AdminView;
