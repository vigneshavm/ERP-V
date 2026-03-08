import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { ArrowRight, Shield, Store, UserPlus, ChevronDown, Search } from 'lucide-react';
import { Tenant } from "../../types/tenant";

interface LandingPageProps {
    onSelectAdmin: () => void;
    onSelectTenant: (tenant: Tenant | null) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectAdmin, onSelectTenant }) => {
    const navigate = useNavigate();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const [showTenantList, setShowTenantList] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tenant.businessType && tenant.businessType.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
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

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full">
                {/* Super Admin */}
                <button
                    onClick={onSelectAdmin}
                    className="group relative bg-slate-900 p-6 rounded-2xl shadow-lg border-2 border-slate-800 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 text-left"
                >
                    <div className="absolute top-4 right-4 text-slate-600 group-hover:text-indigo-400 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Super Admin</h2>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Manage tenants & subscriptions</p>
                </button>

                {/* Sign Up - NEW */}
                <button
                    onClick={() => navigate('/signup')}
                    className="group relative bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left text-white hover:scale-[1.02]"
                >
                    <div className="absolute top-4 right-4 text-white/50 group-hover:text-white transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Sign Up</h2>
                    <p className="text-sm text-white/80">Start your free trial today</p>
                    <div className="mt-3 text-xs bg-white/20 px-2 py-1 rounded-full inline-block">
                        🎉 No credit card required
                    </div>
                </button>

                {/* Tenant Login */}
                <div className="relative group">
                    <button
                        onClick={() => setShowTenantList(!showTenantList)}
                        className={`w-full group relative bg-white p-6 rounded-2xl shadow-sm border-2 transition-all duration-300 text-left ${showTenantList ? 'border-emerald-600 shadow-xl' : 'border-slate-100 hover:border-emerald-600 hover:shadow-xl'}`}
                    >
                        <div className="absolute top-4 right-4 text-slate-300 group-hover:text-emerald-600 transition-colors">
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showTenantList ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                            <Store className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Tenant Login</h2>
                        <p className="text-sm text-slate-500">Access your store dashboard</p>
                    </button>

                    {showTenantList && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-80 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            {/* Search Header */}
                            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Find your store..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto custom-scrollbar max-h-60 p-2">
                                {filteredTenants.length > 0 ? (
                                    filteredTenants.map(tenant => (
                                        <button
                                            key={tenant.id}
                                            onClick={() => onSelectTenant(tenant)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50 rounded-xl transition-colors group/item mb-1 last:mb-0"
                                        >
                                            <div className="text-left">
                                                <div className="font-bold text-slate-900">{tenant.name}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider">{tenant.businessType || 'Retail'}</div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover/item:text-emerald-600 transition-colors" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <p className="text-sm text-slate-900 font-medium">No stores found</p>
                                        <p className="text-xs text-slate-500 mt-1">Check spelling or contact admin</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-12 text-sm text-slate-400">© 2024 Enterprise Manager Platform. All rights reserved.</p>
        </div>
    );
};

export default LandingPage;

