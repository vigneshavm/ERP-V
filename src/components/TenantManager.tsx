import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateTenantDetails, addTenant, toggleTenantStatus } from '../store/tenantSlice';
import { ModuleType, Sector, SystemRole } from '../types/common';
import { Tenant } from '../types/tenant';
import { Check, Plus, Globe, LogIn, Settings, Building2, Pencil, X, Loader2, Users, ArrowLeft, Trash2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config';

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

const mapDbTenantToTenant = (t: any): Tenant => ({
    id: t.id,
    name: t.name,
    subdomain: t.subdomain,
    modules: t.modules || [],
    isActive: t.is_active ?? true,
    region: t.region || { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' },
    sector: t.sector,
    theme: t.theme || 'light',
    layout: t.layout || 'standard',
    domain: t.domain,
    primaryColor: t.primary_color,
    locations: t.locations || [],
    loginLogoUrl: t.login_logo_url,
    loginBgUrl: t.login_bg_url,
    updatedAt: t.updated_at || t.updatedAt
});

const TenantManager: React.FC<TenantManagerProps> = ({ onLoginAs }) => {
    const dispatch = useDispatch();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const [activeSection, setActiveSection] = useState<'provision' | 'list' | 'staffing'>('provision');
    const [activeTab, setActiveTab] = useState<'business' | 'geography' | 'branding'>('business');
    const [selectedTenantForStaff, setSelectedTenantForStaff] = useState<Tenant | null>(null);
    const [tenantEmployees, setTenantEmployees] = useState<any[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
        loginLogoUrl: string;
        loginBgUrl: string;
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
        loginLogoUrl: '',
        loginBgUrl: '',
        locations: []
    });

    const [tempCity, setTempCity] = useState('');
    const [tempBranch, setTempBranch] = useState({ cityIndex: -1, name: '', address: '' });
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    // New Employee Form State
    const [logoInput, setLogoInput] = useState('');

    const [newEmp, setNewEmp] = useState({
        name: '',
        role: '',
        systemRole: 'Staff' as SystemRole,
        pin: '',
        dailyRate: '',
        branchId: '',
        phoneNumber: ''
    });
    const [editingEmpId, setEditingEmpId] = useState<string | null>(null);


    const handleModuleToggle = (mod: ModuleType) => {
        if (newTenant.modules.includes(mod)) {
            setNewTenant({ ...newTenant, modules: newTenant.modules.filter(m => m !== mod) });
        } else {
            setNewTenant({ ...newTenant, modules: [...newTenant.modules, mod] });
        }
    };

    const addCity = () => {
        if (!tempCity.trim()) return;
        if (newTenant.locations.find(l => l.city.toLowerCase() === tempCity.toLowerCase())) return;

        setNewTenant(prev => ({
            ...prev,
            locations: [...prev.locations, {
                city: tempCity,
                branches: [{
                    id: `temp-${Date.now()}`,
                    name: tempCity,
                    city: tempCity,
                    address: 'Main Office'
                }]
            }]
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
                    id: `temp-${Date.now()}`,
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
            loginLogoUrl: tenant.loginLogoUrl || '',
            loginBgUrl: tenant.loginBgUrl || '',
            locations: tenant.locations || []
        });
        setActiveSection('provision');
        setActiveTab('business');
        setLogoInput(tenant.loginLogoUrl || '');
    };

    const handleCancelEdit = () => {
        setEditingTenant(null);
        setNewTenant({
            name: '', subdomain: '', modules: [], currency: 'USD', dateFormat: 'MM/DD/YYYY',
            sector: Sector.GENERAL, theme: 'light', layout: 'standard', domain: '',
            loginLogoUrl: '', loginBgUrl: '', locations: []
        });
        setLogoInput('');
        setActiveSection('list');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTenant.name || !newTenant.subdomain) return;

        const currencyObj = CURRENCIES.find(c => c.code === newTenant.currency) || CURRENCIES[0];

        // Pass through locations directly (no auto-generation of fallback branches)
        const normalizedLocations = newTenant.locations;

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
            locations: normalizedLocations,
            primaryColor: '#4f46e5',
            loginLogoUrl: logoInput,
            loginBgUrl: newTenant.loginBgUrl
        };

        setIsSaving(true);

        try {
            if (APP_CONFIG.USE_SUPABASE && supabase) {
                const dbData = {
                    name: tenantData.name,
                    subdomain: tenantData.subdomain,
                    modules: tenantData.modules,
                    region: tenantData.region,
                    sector: tenantData.sector,
                    theme: tenantData.theme,
                    layout: tenantData.layout,
                    domain: tenantData.domain,
                    locations: tenantData.locations,
                    primary_color: tenantData.primaryColor,
                    login_logo_url: tenantData.loginLogoUrl,
                    login_bg_url: tenantData.loginBgUrl,
                    is_active: true
                };

                let data: any;
                let error: any;

                if (editingTenant) {
                    const res = await supabase
                        .from('tenants')
                        .update(dbData)
                        .eq('id', editingTenant.id)
                        .select()
                        .single();
                    data = res.data;
                    error = res.error;
                } else {
                    const res = await supabase
                        .from('tenants')
                        .insert([dbData])
                        .select()
                        .single();
                    data = res.data;
                    error = res.error;
                }

                if (error) throw error;
                if (data) {
                    // --- Branch Synchronization Logic ---
                    const branchesToUpsert: any[] = [];
                    // Flatten locations to get branches
                    tenantData.locations?.forEach(loc => {
                        loc.branches.forEach(b => {
                            const branchPayload: any = {
                                tenant_id: data.id,
                                name: b.name,
                                city: loc.city,
                                address: b.address,
                                updated_at: new Date().toISOString()
                            };
                            // Only include ID if it's a valid UUID (not temp)
                            if (b.id && !b.id.startsWith('temp-') && !b.id.startsWith('BR-')) {
                                branchPayload.id = b.id;
                            }
                            branchesToUpsert.push(branchPayload);
                        });
                    });

                    if (branchesToUpsert.length > 0) {
                        const { data: savedBranches, error: bError } = await supabase
                            .from('branches')
                            .upsert(branchesToUpsert, { onConflict: 'id' })
                            .select();

                        if (bError) {
                            console.error("Failed to sync branches:", bError);
                        } else if (savedBranches) {
                            // Re-construct locations JSON with REAL IDs
                            const updatedLocations = tenantData.locations?.map(loc => {
                                const locBranches = savedBranches.filter((sb: any) => sb.city === loc.city);
                                return {
                                    ...loc,
                                    branches: locBranches.map((sb: any) => ({
                                        id: sb.id,
                                        name: sb.name,
                                        city: sb.city,
                                        address: sb.address
                                    }))
                                };
                            });

                            // Update Tenant with validated locations JSON
                            const { data: finalTenant } = await supabase
                                .from('tenants')
                                .update({ locations: updatedLocations })
                                .eq('id', data.id)
                                .select()
                                .single();

                            if (finalTenant) {
                                dispatch(editingTenant ? updateTenantDetails(mapDbTenantToTenant(finalTenant)) : addTenant(mapDbTenantToTenant(finalTenant)));
                            } else {
                                dispatch(editingTenant ? updateTenantDetails(mapDbTenantToTenant(data)) : addTenant(mapDbTenantToTenant(data)));
                            }
                        } else {
                            dispatch(editingTenant ? updateTenantDetails(mapDbTenantToTenant(data)) : addTenant(mapDbTenantToTenant(data)));
                        }
                    } else {
                        dispatch(editingTenant ? updateTenantDetails(mapDbTenantToTenant(data)) : addTenant(mapDbTenantToTenant(data)));
                    }
                }
            } else {
                // Non-Supabase Handling
                if (editingTenant) {
                    dispatch(updateTenantDetails({
                        ...editingTenant,
                        ...tenantData
                    }));
                } else {
                    const newTenantObj: Tenant = {
                        id: `TEN-${Date.now()}`,
                        isActive: true,
                        updatedAt: new Date().toISOString(),
                        ...tenantData
                    } as Tenant;
                    dispatch(addTenant(newTenantObj));
                }
            }

            setEditingTenant(null);
            setNewTenant({
                name: '', subdomain: '', modules: [], currency: 'USD', dateFormat: 'MM/DD/YYYY',
                sector: Sector.GENERAL, theme: 'light', layout: 'standard', domain: '', locations: []
            });
            setActiveTab('business');
            setActiveSection('list');
            setLogoInput('');
        } catch (error: any) {
            console.error('Error saving tenant:', error);
            alert(`Failed to save tenant: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Staff Logic ---
    const fetchTenantEmployees = async (tenantId: string) => {
        setIsLoadingEmployees(true);
        try {
            if (APP_CONFIG.USE_SUPABASE && supabase) {
                const { data, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('tenant_id', tenantId);

                if (error) throw error;
                setTenantEmployees(data || []);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const handleOpenStaffing = (tenant: Tenant) => {
        setSelectedTenantForStaff(tenant);
        fetchTenantEmployees(tenant.id);
        setActiveSection('staffing');
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantForStaff || !newEmp.name || !newEmp.pin) return;

        try {
            if (APP_CONFIG.USE_SUPABASE && supabase) {
                const empData = {
                    name: newEmp.name,
                    role: newEmp.role,
                    system_role: newEmp.systemRole,
                    pin: newEmp.pin,
                    daily_rate: parseFloat(newEmp.dailyRate) || 0,
                    branch_id: newEmp.branchId,
                    tenant_id: selectedTenantForStaff.id,
                    sector: selectedTenantForStaff.sector,
                    phone_number: newEmp.phoneNumber
                };

                if (editingEmpId) {
                    const { data, error } = await supabase
                        .from('employees')
                        .update(empData)
                        .eq('id', editingEmpId)
                        .select()
                        .single();

                    if (error) throw error;
                    if (data) {
                        setTenantEmployees(prev => prev.map(e => e.id === editingEmpId ? data : e));
                        handleCancelEditEmp();
                    }
                } else {
                    const { data, error } = await supabase
                        .from('employees')
                        .insert([empData])
                        .select()
                        .single();

                    if (error) throw error;
                    if (data) {
                        setTenantEmployees(prev => [...prev, data]);
                        handleCancelEditEmp();
                    }
                }
            }
        } catch (err: any) {
            console.error('Error saving employee:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleStartEditEmp = (emp: any) => {
        setNewEmp({
            name: emp.name,
            role: emp.role || '',
            systemRole: emp.system_role as SystemRole,
            pin: emp.pin,
            dailyRate: emp.daily_rate?.toString() || '',
            branchId: emp.branch_id || '',
            phoneNumber: emp.phone_number || ''
        });
        setEditingEmpId(emp.id);
    };

    const handleCancelEditEmp = () => {
        setNewEmp({ name: '', role: '', systemRole: 'Staff', pin: '', dailyRate: '', branchId: '', phoneNumber: '' });
        setEditingEmpId(null);
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this employee?')) return;

        try {
            if (APP_CONFIG.USE_SUPABASE && supabase) {
                const { error } = await supabase
                    .from('employees')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                setTenantEmployees(prev => prev.filter(e => e.id !== id));
            }
        } catch (err: any) {
            console.error('Error deleting employee:', err);
        }
    };

    // --- End Staff Logic ---


    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {activeSection !== 'staffing' && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Tenant Management</h1>
                        <p className="text-slate-500 mt-1">Provision and manage client access.</p>
                    </div>

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
            )}

            <div className="w-full">
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
                                <button
                                    onClick={() => setActiveTab('branding')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'branding' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Branding
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

                            {activeTab === 'geography' && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <p className="text-xs text-blue-800">
                                            Manage your tenant's hierarchy by adding Regions (Cities) first, then assigning Branches to them.
                                        </p>
                                    </div>

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

                                                        {tempBranch.cityIndex === cityIdx ? (
                                                            <div className="bg-white p-2 rounded border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
                                                                <input
                                                                    autoFocus
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

                            {activeTab === 'branding' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-indigo-900">
                                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold">Login Page Customization</p>
                                            <p className="text-xs opacity-80">Provide publicly accessible image URLs for the tenant's login portal.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo URL</label>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                        value={logoInput}
                                                        onChange={e => setLogoInput(e.target.value)}
                                                        onBlur={() => setNewTenant({ ...newTenant, loginLogoUrl: logoInput })}
                                                        placeholder="https://example.com/logo.png"
                                                    />
                                                    <p className="text-[10px] text-slate-400">Recommended: Square PNG with transparency. Preview updates after you click away.</p>
                                                </div>
                                                {newTenant.loginLogoUrl && (
                                                    <div className="w-[200px] h-[200px] border-2 border-dashed border-slate-200 rounded-2xl p-2 bg-slate-50/50 flex items-center justify-center overflow-hidden shrink-0 mx-auto group relative">
                                                        <img
                                                            src={newTenant.loginLogoUrl}
                                                            alt="Logo"
                                                            className="w-[200px] h-[200px] object-contain transition-transform duration-500 group-hover:scale-110"
                                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                                        />
                                                        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold text-slate-500 uppercase border border-slate-100 shadow-sm">200 x 200</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Login Background Image URL</label>
                                            <div className="space-y-2">
                                                <input
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    value={newTenant.loginBgUrl}
                                                    onChange={e => setNewTenant({ ...newTenant, loginBgUrl: e.target.value })}
                                                    placeholder="https://images.unsplash.com/..."
                                                />
                                                {newTenant.loginBgUrl && (
                                                    <div className="aspect-video w-full rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                        <img src={newTenant.loginBgUrl} alt="Background" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">Preview</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-slate-400">High Resolution (1920x1080px or higher) landscape images work best.</p>
                                            </div>
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
                                    disabled={!newTenant.name || !newTenant.subdomain || isSaving}
                                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingTenant ? 'Update Tenant' : 'Provision Tenant'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

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
                                            onClick={() => handleOpenStaffing(tenant)}
                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Manage Staff"
                                        >
                                            <Users className="w-4 h-4" />
                                        </button>
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

                {activeSection === 'staffing' && selectedTenantForStaff && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveSection('list')}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Staffing: {selectedTenantForStaff.name}</h2>
                                    <p className="text-slate-500 text-sm">Manage users and roles for this tenant.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Add Employee Form */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                                        {editingEmpId ? <Pencil className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-blue-600" />}
                                        {editingEmpId ? 'Edit Staff Member' : 'Add New Staff'}
                                    </div>
                                    <form onSubmit={handleAddEmployee} className="p-4 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                            <input
                                                required
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                value={newEmp.name}
                                                onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number (Optional)</label>
                                            <input
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                value={newEmp.phoneNumber}
                                                onChange={e => setNewEmp({ ...newEmp, phoneNumber: e.target.value })}
                                                placeholder="e.g. 9876543210"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title / Role</label>
                                            <input
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                value={newEmp.role}
                                                onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                                                placeholder="e.g. Senior Pharmacist"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role</label>
                                                <select
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    value={newEmp.systemRole}
                                                    onChange={e => setNewEmp({ ...newEmp, systemRole: e.target.value as SystemRole })}
                                                >
                                                    <option value="Staff">Staff</option>
                                                    <option value="Manager">Manager</option>
                                                    <option value="Admin">Admin</option>
                                                    <option value="Owner">Owner</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Login PIN (4 Digits)</label>
                                                <input
                                                    required
                                                    maxLength={4}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono tracking-widest"
                                                    value={newEmp.pin}
                                                    onChange={e => setNewEmp({ ...newEmp, pin: e.target.value.replace(/\D/g, '') })}
                                                    placeholder="1234"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Branch</label>
                                            <select
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                value={newEmp.branchId}
                                                onChange={e => setNewEmp({ ...newEmp, branchId: e.target.value })}
                                            >
                                                <option value="">Select Branch</option>
                                                {(selectedTenantForStaff.locations?.flatMap(l => l.branches) || []).map(br => (
                                                    <option key={br.id} value={br.id}>{br.name} ({br.city})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Daily Rate (Optional)</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                value={newEmp.dailyRate}
                                                onChange={e => setNewEmp({ ...newEmp, dailyRate: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {editingEmpId && (
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEditEmp}
                                                    className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg font-medium hover:bg-slate-50 transition"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm border border-blue-700"
                                            >
                                                {editingEmpId ? 'Update Employee' : 'Add Employee'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Employee List */}
                            <div className="lg:col-span-2 space-y-4">
                                {isLoadingEmployees ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                                        <p className="text-slate-500 font-medium font-bold">Synchronizing Staff Members...</p>
                                    </div>
                                ) : tenantEmployees.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                                        <Users className="w-12 h-12 text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-800">No Staff Members Found</h3>
                                        <p className="text-slate-500 max-w-xs text-center mt-2">Add employees to this tenant to enable store operations and logins.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {tenantEmployees.map(emp => (
                                            <div key={emp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-800">{emp.name}</h4>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${emp.system_role === 'Owner' ? 'bg-purple-50 text-purple-700 border-purple-200' : emp.system_role === 'Admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                                {emp.system_role}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                            <span className="flex items-center gap-1"><Pencil className="w-3 h-3" /> {emp.role || 'No Title'}</span>
                                                            {emp.phone_number && (
                                                                <>
                                                                    <span className="text-slate-300">|</span>
                                                                    <span className="flex items-center gap-1 font-mono">{emp.phone_number}</span>
                                                                </>
                                                            )}
                                                            <span className="text-slate-300">|</span>
                                                            <span className="flex items-center gap-1 font-mono uppercase tracking-wider bg-slate-50 px-1 rounded border border-slate-100 text-[10px]">PIN: {emp.pin}</span>
                                                            {emp.branch_id && (
                                                                <>
                                                                    <span className="text-slate-300">|</span>
                                                                    <span className="flex items-center gap-1 text-blue-600 font-medium">{(selectedTenantForStaff.locations?.flatMap(l => l.branches) || []).find(b => b.id === emp.branch_id || b.name === emp.branch_id)?.name || selectedTenantForStaff.locations?.find(l => (l.branches || []).some(b => b.id === emp.branch_id || b.name === emp.branch_id))?.city || 'Unknown Branch'}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleStartEditEmp(emp)}
                                                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Edit Details"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEmployee(emp.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Remove Staff"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TenantManager;
