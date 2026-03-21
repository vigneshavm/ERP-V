import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { ArrowRight, Shield, Store, UserPlus, ChevronDown, Search, Palette } from 'lucide-react';
import { Tenant } from "@/entities/session/model/core";
import { useTheme } from '@/app/providers/ThemeContext';

interface LandingPageProps {
    onSelectAdmin: () => void;
    onSelectTenant: (tenant: Tenant | null) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectAdmin, onSelectTenant }) => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const [showTenantList, setShowTenantList] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    const filteredTenants = (tenants as any[]).filter((tenant: any) =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tenant.businessType && tenant.businessType.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const themes: { id: any, label: string, color: string }[] = [
        { id: 'dark', label: 'Matrix', color: 'bg-indigo-600' },
        { id: 'cyber', label: 'Cyber', color: 'bg-green-500' },
        { id: 'gold', label: 'Premium Gold', color: 'bg-amber-500' },
        { id: 'light', label: 'Corporate Light', color: 'bg-slate-400' },
    ];

    return (
        <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4 transition-colors duration-500 overflow-x-hidden">
            {/* Theme Diagnostics Toggle */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="w-12 h-12 glass-panel flex items-center justify-center rounded-full text-primary hover:scale-110 transition-transform active:scale-95"
                >
                    <Palette className="w-5 h-5" />
                </button>
            </div>

            {/* Diagnostics Panel */}
            {showDiagnostics && (
                <div className="fixed top-20 right-6 z-50 glass-panel p-4 rounded-2xl w-56 animate-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Aesthetic Sync</h3>
                    <div className="flex flex-col gap-2">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`w-full px-4 py-2 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3 ${theme === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-primary/10 text-main'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${t.color}`} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-4xl w-full text-center mb-12 animate-fade-in">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 animate-aura">
                    <span className="font-bold text-3xl text-main">E</span>
                </div>
                <h1 className="text-4xl font-black text-main mb-4 tracking-tight matrix-text-glow">Enterprise Manager</h1>
                <p className="text-xl text-secondary max-w-2xl mx-auto">
                    The all-in-one ERP & POS platform for modern retail chains.
                    Manage inventory, sales, finance, and workforce from a single dashboard.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full">
                {/* Super Admin */}
                <button
                    onClick={onSelectAdmin}
                    className="group relative glass-panel p-6 rounded-2xl border-light hover:border-primary transition-all duration-300 text-left"
                >
                    <div className="absolute top-4 right-4 text-secondary group-hover:text-primary transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-all">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-main mb-2">Super Admin</h2>
                    <p className="text-sm text-secondary group-hover:text-main transition-colors">Manage tenants & subscriptions</p>
                </button>

                {/* Sign Up */}
                <button
                    onClick={() => navigate('/signup')}
                    className="group relative bg-primary p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left text-white hover:scale-[1.02] overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                    <div className="absolute top-4 right-4 text-muted group-hover:text-main transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Sign Up</h2>
                    <p className="text-sm text-main/80">Start your free trial today</p>
                    <div className="mt-3 text-[10px] bg-white/20 px-2 py-1 rounded-full inline-block font-bold">
                        🎉 NO CREDIT CARD REQUIRED
                    </div>
                </button>

                {/* Tenant Login */}
                <div className="relative group">
                    <button
                        onClick={() => setShowTenantList(!showTenantList)}
                        className={`w-full group relative glass-panel p-6 rounded-2xl border-light transition-all duration-300 text-left ${showTenantList ? 'border-primary' : 'hover:border-primary'}`}
                    >
                        <div className="absolute top-4 right-4 text-secondary group-hover:text-primary transition-colors">
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showTenantList ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                            <Store className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-main mb-2">Tenant Login</h2>
                        <p className="text-sm text-secondary">Access your store dashboard</p>
                    </button>

                    {showTenantList && (
                        <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl shadow-2xl z-50 max-h-80 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            {/* Search Header */}
                            <div className="p-3 border-b border-default bg-primary/5">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                    <input
                                        type="text"
                                        placeholder="Find your store..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-app border border-default rounded-lg text-sm focus:outline-none focus:border-primary transition-all text-main"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto custom-scrollbar max-h-60 p-2">
                                {filteredTenants.length > 0 ? (
                                    filteredTenants.map((tenant: any) => (
                                        <button
                                            key={tenant.id}
                                            onClick={() => onSelectTenant(tenant)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary/10 rounded-xl transition-colors group/item mb-1 last:mb-0"
                                        >
                                            <div className="text-left">
                                                <div className="font-bold text-main">{tenant.name}</div>
                                                <div className="text-xs text-secondary uppercase tracking-widest">{tenant.businessType || 'Retail'}</div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-secondary group-hover/item:text-primary transition-colors" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-secondary">
                                        <p className="text-sm font-medium">No stores found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-12 text-sm text-secondary">© 2024 Enterprise Manager Platform. All rights reserved.</p>
        </div>
    );
};

export default LandingPage;

