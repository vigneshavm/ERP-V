import React from 'react';
import { Building2, Pencil, Globe, Loader2, LogIn } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { toggleTenantStatus } from '../store/tenantSlice';
import { useTenantForm } from '../hooks/useTenantForm';
import { Tenant } from '../types/tenant';
import { BusinessTab } from './tenant-manager/BusinessTab';
import { CompanyTab } from './tenant-manager/CompanyTab';
import { TaxTab } from './tenant-manager/TaxTab';
import { BankingTab } from './tenant-manager/BankingTab';
import { SystemTab } from './tenant-manager/SystemTab';
import { GeographyTab } from './tenant-manager/GeographyTab';
import { UserTab } from './tenant-manager/UserTab';
import { BrandingTab } from './tenant-manager/BrandingTab';
import { IntegrationsTab } from './tenant-manager/IntegrationsTab';
import { useDispatch } from 'react-redux';

interface TenantManagerProps {
    onLoginAs?: (tenant: Tenant) => void;
}

const TenantManager: React.FC<TenantManagerProps> = ({ onLoginAs }) => {
    const dispatch = useDispatch();
    const {
        // State
        activeSection, setActiveSection,
        activeTab, setActiveTab,
        isSaving,
        newTenant, setNewTenant,
        logoInput, setLogoInput,
        editingTenant,
        tempCity, setTempCity,
        tempBranch, setTempBranch,
        tenants,

        // Actions
        handleModuleToggle,
        addCity, removeCity,
        addBranch, removeBranch,
        handleStartEdit,
        handleCancelEdit,
        handleSubmit
    } = useTenantForm();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tenant Management</h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Provision and manage multi-tenant environments</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveSection('provision')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${activeSection === 'provision' ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        Provision New
                    </button>
                    <button
                        onClick={() => setActiveSection('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${activeSection === 'list' ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        Active Tenants
                    </button>
                </div>
            </div>

            <div className={`space-y-6 ${activeSection === 'provision' ? 'max-w-5xl mx-auto' : ''}`}>
                {activeSection === 'provision' && (
                    <>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6 z-10">
                            <div className="flex overflow-x-auto no-scrollbar border-b border-slate-100">
                                {(['business', 'contact', 'tax', 'banking', 'system', 'geography', 'user', 'branding', 'integrations'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-4 text-sm font-medium transition-all whitespace-nowrap flex items-center justify-center gap-2 border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <span className="capitalize">{tab === 'user' ? 'Users' : tab}</span>
                                        {activeTab === tab && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden min-h-[500px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                            <div className="mb-6 pb-6 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-800 capitalize">
                                    {activeTab === 'user' ? 'Super Admin Provisioning' : `${activeTab} Configuration`}
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">Configure the {activeTab} details for the new tenant environment.</p>
                            </div>

                            {activeTab === 'business' && <BusinessTab newTenant={newTenant} setNewTenant={setNewTenant} />}
                            {activeTab === 'contact' && <CompanyTab newTenant={newTenant} setNewTenant={setNewTenant} />}
                            {activeTab === 'tax' && <TaxTab newTenant={newTenant} setNewTenant={setNewTenant} />}
                            {activeTab === 'banking' && <BankingTab newTenant={newTenant} setNewTenant={setNewTenant} />}
                            {activeTab === 'system' && <SystemTab newTenant={newTenant} setNewTenant={setNewTenant} handleModuleToggle={handleModuleToggle} />}
                            {activeTab === 'geography' && <GeographyTab
                                newTenant={newTenant} setNewTenant={setNewTenant}
                                tempCity={tempCity} setTempCity={setTempCity}
                                addCity={addCity} removeCity={removeCity}
                                tempBranch={tempBranch} setTempBranch={setTempBranch}
                                addBranch={addBranch} removeBranch={removeBranch}
                            />}
                            {activeTab === 'user' && <UserTab newTenant={newTenant} setNewTenant={setNewTenant} />}
                            {activeTab === 'branding' && <BrandingTab newTenant={newTenant} setNewTenant={setNewTenant} logoInput={logoInput} setLogoInput={setLogoInput} />}
                            {activeTab === 'integrations' && <IntegrationsTab newTenant={newTenant} setNewTenant={setNewTenant} />}

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                {editingTenant && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={!newTenant.name || !newTenant.subdomain || isSaving}
                                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingTenant ? 'Update Tenant' : 'Provision Tenant'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {activeSection === 'list' && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
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
                                            <span className="font-medium text-blue-600 underline cursor-pointer">{tenant.domain || `${tenant.subdomain}.app.com`}</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">{tenant.region.currency} ({tenant.region.currencySymbol})</span>
                                            {tenant.locations && tenant.locations.length > 0 && (
                                                <>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                                                        {tenant.locations.reduce((acc, loc) => acc + loc.branches.length, 0)} Locations
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] rounded font-bold border border-blue-100 uppercase">{tenant.sector}</span>
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] rounded font-bold border border-indigo-100 uppercase">{tenant.theme}</span>
                                            <span className="px-2 py-1 bg-slate-50 text-slate-700 text-[10px] rounded font-bold border border-slate-100 uppercase">{tenant.layout}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {tenant.modules.map(mod => (
                                                <span key={mod} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded font-medium border border-slate-200">
                                                    {mod}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                                        <button
                                            onClick={() => handleStartEdit(tenant)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Tenant"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const newStatus = !tenant.isActive;
                                                if (APP_CONFIG.USE_SUPABASE && supabase) {
                                                    try {
                                                        const { error } = await supabase
                                                            .from('tenants')
                                                            .update({ is_active: newStatus })
                                                            .eq('id', tenant.id);
                                                        if (error) throw error;
                                                        dispatch(toggleTenantStatus(tenant.id));
                                                    } catch (err: any) {
                                                        console.error('Error toggling status:', err);
                                                        alert(`Failed to update status: ${err.message}`);
                                                    }
                                                } else {
                                                    dispatch(toggleTenantStatus(tenant.id));
                                                }
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${tenant.isActive ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'}`}
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
                )}
            </div>
        </div>
    );
};

export default TenantManager;
