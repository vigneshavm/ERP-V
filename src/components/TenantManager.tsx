import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateTenantDetails, addTenant, toggleTenantStatus } from '../store/tenantSlice';
import { ModuleType, Sector } from '../types/common';
import { Tenant } from '../types/tenant';
import { Check, Plus, Globe, LogIn, Settings, Building2, Pencil, X } from 'lucide-react';






const AVAILABLE_MODULES: ModuleType[] = ['POS', 'INVENTORY', 'HR', 'FINANCE', 'ANALYTICS'];

const CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
];


interface TenantManagerProps {
    onLoginAs?: (tenant: Tenant) => void;
}

const TenantManager: React.FC<TenantManagerProps> = ({ onLoginAs }) => {
    const dispatch = useDispatch();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const [activeSection, setActiveSection] = useState<'provision' | 'list'>('provision');
    const [activeTab, setActiveTab] = useState<'business' | 'geography'>('business');

    const [newTenant, setNewTenant] = useState<{
        name: string;
        subdomain: string;
        modules: ModuleType[];
        currency: string;
        dateFormat: string;
        sector: Sector;
        theme: 'light' | 'dark';
        layout: 'standard' | 'compact';
        domain: string;
        locations: { city: string; branches: { id: string; name: string; city: string; address: string; }[] }[];
    }>({
        name: '',
        subdomain: '',
        modules: [] as ModuleType[],
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        sector: Sector.GENERAL,
        theme: 'light',
        layout: 'standard',
        domain: '',
        locations: []
    });

    // Temporary state for adding new locations/branches
    const [tempCity, setTempCity] = useState('');
    const [tempBranch, setTempBranch] = useState({ cityIndex: -1, name: '', address: '' });



    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    const handleModuleToggle = (mod: ModuleType) => {
        if (newTenant.modules.includes(mod)) {
            setNewTenant({ ...newTenant, modules: newTenant.modules.filter(m => m !== mod) });
        } else {
            setNewTenant({ ...newTenant, modules: [...newTenant.modules, mod] });
        }
    };

    // --- Location Handlers ---
    const addCity = () => {
        if (!tempCity.trim()) return;
        if (newTenant.locations.find(l => l.city.toLowerCase() === tempCity.toLowerCase())) return; // Prevent dupes

        setNewTenant(prev => ({
            ...prev,
            locations: [...prev.locations, { city: tempCity, branches: [] }]
        }));
        setTempCity('');
    };

    const removeCity = (index: number) => {
        setNewTenant(prev => ({
            ...prev,
            locations: prev.locations.filter((_, i) => i !== index)
        }));
    };

    const addBranch = (cityIndex: number) => {
        if (!tempBranch.name || !tempBranch.address) return;

        const updatedLocations = [...newTenant.locations];
        const city = updatedLocations[cityIndex];

        updatedLocations[cityIndex] = {
            ...city,
            branches: [
                ...city.branches,
                {
                    id: `BR-${Date.now()}`, // Simple ID generation
                    name: tempBranch.name,
                    city: city.city,
                    address: tempBranch.address
                }
            ]
        };

        setNewTenant(prev => ({ ...prev, locations: updatedLocations }));
        setTempBranch({ cityIndex: -1, name: '', address: '' });
    };

    const removeBranch = (cityIndex: number, branchIndex: number) => {
        const updatedLocations = [...newTenant.locations];
        updatedLocations[cityIndex].branches = updatedLocations[cityIndex].branches.filter((_, i) => i !== branchIndex);
        setNewTenant(prev => ({ ...prev, locations: updatedLocations }));
    };


    const handleStartEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setNewTenant({
            name: tenant.name,
            subdomain: tenant.subdomain || '',
            modules: tenant.modules || [],
            currency: tenant.region?.currency || 'USD',
            dateFormat: tenant.region?.dateFormat || 'MM/DD/YYYY',
            sector: tenant.sector,
            theme: tenant.theme || 'light',
            layout: tenant.layout || 'standard',
            domain: tenant.domain || '',
            locations: tenant.locations || []
        });
        setActiveSection('provision');
        setActiveTab('business');
    };

    const handleCancelEdit = () => {
        setEditingTenant(null);
        setNewTenant({
            name: '', subdomain: '', modules: [], currency: 'USD', dateFormat: 'MM/DD/YYYY',
            sector: Sector.GENERAL, theme: 'light', layout: 'standard', domain: '', locations: []
        });
        setActiveSection('list');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTenant.name || !newTenant.subdomain) return;

        const currencyObj = CURRENCIES.find(c => c.code === newTenant.currency) || CURRENCIES[0];

        // Construct base tenant object from form data
        const tenantData: Partial<Tenant> = {
            name: newTenant.name,
            subdomain: newTenant.subdomain,
            modules: newTenant.modules,
            region: {
                currency: newTenant.currency,
                currencySymbol: currencyObj.symbol,
                dateFormat: newTenant.dateFormat
            },
            sector: newTenant.sector,
            theme: newTenant.theme,
            layout: newTenant.layout,
            domain: newTenant.domain || `${newTenant.subdomain}.app.com`,
            locations: newTenant.locations
        };

        if (editingTenant) {
            // Update Existing
            dispatch(updateTenantDetails({
                ...editingTenant,
                ...tenantData
            }));
            setEditingTenant(null);
        } else {
            // Create New
            const newTenantObj: Tenant = {
                id: `TEN-${Date.now()}`,
                isActive: true, // Default active
                ...tenantData
            } as Tenant;
            dispatch(addTenant(newTenantObj));
        }

        // Reset Form
        setNewTenant({
            name: '', subdomain: '', modules: [], currency: 'USD', dateFormat: 'MM/DD/YYYY',
            sector: Sector.GENERAL, theme: 'light', layout: 'standard', domain: '', locations: []
        });
        setActiveTab('business');
        setActiveSection('list'); // Switch to list view after action
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Tenant Management</h1>
                    <p className="text-slate-500 mt-1">Provision and manage client access.</p>
                </div>

                {/* Main Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setActiveSection('provision')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeSection === 'provision' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Plus className="w-4 h-4" />
                        Provision
                    </button>
                    <button
                        onClick={() => setActiveSection('list')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeSection === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Building2 className="w-4 h-4" />
                        Active Tenants
                    </button>
                </div>
            </div>

            <div className="w-full">
                {/* Creation Form */}
                {activeSection === 'provision' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit overflow-hidden max-w-4xl mx-auto animate-in slide-in-from-left-4 duration-300">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {editingTenant ? <Pencil className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                                {editingTenant ? 'Edit Tenant Details' : 'Onboard New Client'}
                            </h2>
                            <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                <button
                                    onClick={() => setActiveTab('business')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'business' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Business
                                </button>
                                <button
                                    onClick={() => setActiveTab('geography')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'geography' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Geography
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            {/* BUSINESS LOGIC TAB */}
                            {activeTab === 'business' && (
                                <div className="space-y-5 animate-in slide-in-from-left-4 duration-300">
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
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newTenant.subdomain}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setNewTenant(prev => {
                                                            let domain = prev.domain;
                                                            if (val && !domain) {
                                                                const exts = ['.com', '.io', '.net', '.biz', '.org', '.co'];
                                                                domain = val + exts[Math.floor(Math.random() * exts.length)];
                                                            }
                                                            return { ...prev, subdomain: val, domain };
                                                        });
                                                    }}
                                                    placeholder="acme"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Public Domain</label>
                                            <input
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newTenant.domain}
                                                onChange={e => setNewTenant({ ...newTenant, domain: e.target.value })}
                                                placeholder="e.g. acme.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-slate-400" />
                                            Preference & Appearance
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Sector</label>
                                                    <select
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newTenant.sector}
                                                        onChange={e => setNewTenant({ ...newTenant, sector: e.target.value as Sector })}
                                                    >
                                                        {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Theme</label>
                                                    <select
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newTenant.theme}
                                                        onChange={e => setNewTenant({ ...newTenant, theme: e.target.value as 'light' | 'dark' })}
                                                    >
                                                        <option value="light">Light</option>
                                                        <option value="dark">Dark</option>
                                                    </select>
                                                </div>
                                            </div>
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
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Layout</label>
                                                    <select
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newTenant.layout}
                                                        onChange={e => setNewTenant({ ...newTenant, layout: e.target.value as 'standard' | 'compact' })}
                                                    >
                                                        <option value="standard">Standard</option>
                                                        <option value="compact">Compact</option>
                                                    </select>
                                                </div>
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
                                </div>
                            )}

                            {/* GEOGRAPHY TAB */}
                            {activeTab === 'geography' && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <p className="text-xs text-blue-800">
                                            Manage your tenant's hierarchy by adding Regions (Cities) first, then assigning Branches to them.
                                        </p>
                                    </div>

                                    {/* Add Region Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Regions / Cities</label>
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                value={tempCity}
                                                onChange={e => setTempCity(e.target.value)}
                                                placeholder="Enter City Name (e.g. Chennai)"
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
                                            />
                                            <button
                                                type="button"
                                                onClick={addCity}
                                                className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {/* List of Regions */}
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                            {newTenant.locations.length === 0 && (
                                                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                                                    <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-xs text-slate-400">No regions added yet.</p>
                                                </div>
                                            )}

                                            {newTenant.locations.map((loc, cityIdx) => (
                                                <div key={cityIdx} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                                    <div className="bg-slate-50 px-3 py-2 flex justify-between items-center border-b border-slate-100">
                                                        <span className="font-bold text-slate-700 text-sm">{loc.city}</span>
                                                        <button type="button" onClick={() => removeCity(cityIdx)} className="text-slate-400 hover:text-red-500">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="p-3 bg-slate-50/50">
                                                        {/* Branches List */}
                                                        <div className="space-y-2 mb-3">
                                                            {loc.branches.map((br, brIdx) => (
                                                                <div key={br.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs">
                                                                    <div>
                                                                        <div className="font-semibold text-slate-700">{br.name}</div>
                                                                        <div className="text-slate-500 truncate max-w-[150px]">{br.address}</div>
                                                                    </div>
                                                                    <button type="button" onClick={() => removeBranch(cityIdx, brIdx)} className="text-slate-300 hover:text-red-500">
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {loc.branches.length === 0 && (
                                                                <p className="text-[10px] text-slate-400 italic pl-1">No branches in this region.</p>
                                                            )}
                                                        </div>

                                                        {/* Add Branch Field */}
                                                        {tempBranch.cityIndex === cityIdx ? (
                                                            <div className="bg-white p-2 rounded border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
                                                                <input
                                                                    autoFocus
                                                                    ref={input => input && input.focus()}
                                                                    placeholder="Branch Name (e.g. Main St)"
                                                                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs mb-2 outline-none focus:border-blue-500"
                                                                    value={tempBranch.name}
                                                                    onChange={e => setTempBranch(prev => ({ ...prev, name: e.target.value }))}
                                                                />
                                                                <input
                                                                    placeholder="Address / Area"
                                                                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs mb-2 outline-none focus:border-blue-500"
                                                                    value={tempBranch.address}
                                                                    onChange={e => setTempBranch(prev => ({ ...prev, address: e.target.value }))}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => addBranch(cityIdx)}
                                                                        className="flex-1 bg-blue-600 text-white py-1 rounded text-xs font-medium hover:bg-blue-700"
                                                                    >
                                                                        Save Branch
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setTempBranch({ cityIndex: -1, name: '', address: '' })}
                                                                        className="px-2 border border-slate-200 text-slate-600 py-1 rounded text-xs hover:bg-slate-50"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setTempBranch({ cityIndex: cityIdx, name: '', address: '' })}
                                                                className="w-full py-1.5 border border-dashed border-slate-300 text-slate-500 rounded text-xs hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                Add Branch
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
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
                                    disabled={!newTenant.name || !newTenant.subdomain}
                                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {editingTenant ? 'Update Tenant' : 'Provision Tenant'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tenant List */}
                {activeSection === 'list' && (
                    <div className="lg:col-span-2 space-y-4 animate-in slide-in-from-right-4 duration-300">
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
                                            {/* Location Count Badge */}
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
                                            onClick={() => dispatch(toggleTenantStatus(tenant.id))}
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

            {/* Edit Modal */}

        </div>
    );
};

export default TenantManager;
