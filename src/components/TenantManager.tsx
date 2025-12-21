import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addTenant, toggleTenantStatus } from '../store/tenantSlice';
import { Tenant, ModuleType } from '../types';
import { Check, Plus, Globe, LogIn, Settings, Building2 } from 'lucide-react';






const AVAILABLE_MODULES: ModuleType[] = ['POS', 'INVENTORY', 'HR', 'FINANCE', 'ANALYTICS'];

const CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
];

const DATE_FORMATS = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK/EU)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

interface TenantManagerProps {
    onLoginAs?: (tenant: Tenant) => void;
}

const TenantManager: React.FC<TenantManagerProps> = ({ onLoginAs }) => {
    const dispatch = useDispatch();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const [newTenant, setNewTenant] = useState({
        name: '',
        subdomain: '',
        modules: [] as ModuleType[],
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY'
    });

    const handleModuleToggle = (mod: ModuleType) => {
        if (newTenant.modules.includes(mod)) {
            setNewTenant({ ...newTenant, modules: newTenant.modules.filter(m => m !== mod) });
        } else {
            setNewTenant({ ...newTenant, modules: [...newTenant.modules, mod] });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTenant.name || !newTenant.subdomain) return;

        const currencyObj = CURRENCIES.find(c => c.code === newTenant.currency) || CURRENCIES[0];

        const tenant: Tenant = {
            id: `TEN-${Date.now()}`,
            name: newTenant.name,
            subdomain: newTenant.subdomain,
            modules: newTenant.modules,
            isActive: true,
            region: {
                currency: newTenant.currency,
                currencySymbol: currencyObj.symbol,
                dateFormat: newTenant.dateFormat
            }
        };

        dispatch(addTenant(tenant));
        setNewTenant({ name: '', subdomain: '', modules: [], currency: 'USD', dateFormat: 'MM/DD/YYYY' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Tenant Management</h1>
                    <p className="text-slate-500 mt-1">Provision and manage client access.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Creation Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        Onboard New Client
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newTenant.name}
                                    onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain</label>
                                <div className="flex">
                                    <input
                                        className="w-full px-3 py-2 border border-slate-200 rounded-l-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newTenant.subdomain}
                                        onChange={e => setNewTenant({ ...newTenant, subdomain: e.target.value })}
                                        placeholder="acme"
                                    />
                                    <span className="bg-slate-100 border border-l-0 border-slate-200 px-3 py-2 text-slate-500 rounded-r-lg text-sm flex items-center">
                                        .app.com
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-slate-400" />
                                Regional Settings
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newTenant.currency}
                                        onChange={e => setNewTenant({ ...newTenant, currency: e.target.value })}
                                    >
                                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Date Format</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newTenant.dateFormat}
                                        onChange={e => setNewTenant({ ...newTenant, dateFormat: e.target.value })}
                                    >
                                        {DATE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Enable Modules</label>
                            <div className="space-y-2">
                                {AVAILABLE_MODULES.map(mod => (
                                    <label key={mod} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newTenant.modules.includes(mod) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                            {newTenant.modules.includes(mod) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={newTenant.modules.includes(mod)}
                                            onChange={() => handleModuleToggle(mod)}
                                        />
                                        <span className="text-sm text-slate-700 font-medium">{mod}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!newTenant.name || !newTenant.subdomain}
                            className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Provision Tenant
                        </button>
                    </form>
                </div>

                {/* Tenant List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Active Tenants
                    </h2>
                    <div className="grid gap-4">
                        {tenants.map(tenant => (
                            <div key={tenant.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-slate-800 text-lg">{tenant.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tenant.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {tenant.isActive ? 'Active' : 'Suspended'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <Globe className="w-4 h-4" />
                                        <span>{tenant.subdomain}.app.com</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">{tenant.region.currency} ({tenant.region.currencySymbol})</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {tenant.modules.map(mod => (
                                            <span key={mod} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium border border-slate-200">
                                                {mod}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                    <button
                                        onClick={() => dispatch(toggleTenantStatus(tenant.id))}
                                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tenant.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                    >
                                        {tenant.isActive ? 'Suspend' : 'Activate'}
                                    </button>
                                    {tenant.isActive && onLoginAs && (
                                        <button
                                            onClick={() => onLoginAs(tenant)}
                                            className="flex-1 md:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2"
                                        >
                                            <LogIn className="w-4 h-4" />
                                            Access
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantManager;
