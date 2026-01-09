import React from 'react';
import { ArrowRight, Shield, Store } from 'lucide-react';
import { Tenant } from '../types/tenant';

interface LandingPageProps {
    onSelectAdmin: () => void;
    onSelectTenant: (tenant: Tenant | null) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectAdmin, onSelectTenant }) => (
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
                onClick={onSelectAdmin}
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
                    onSelectTenant({
                        id: 'demo',
                        name: 'Demo Retail Co',
                        subdomain: 'demo',
                        modules: ['POS', 'INVENTORY', 'FINANCE', 'HR'],
                        isActive: true,
                        region: { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY' }
                    });
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

export default LandingPage;
