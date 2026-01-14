import React, { useState, useMemo, useEffect } from 'react';
import {
    Building2,
    Users,
    TrendingUp,
    Activity,
    Search,
    Filter,
    Plus,
    Settings,
    Globe,
    Zap,
    Shield,
    ChevronRight,
    LayoutDashboard,
    LogIn,
    Pencil,
    Power,
    MoreHorizontal,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Database,
    Server,
    Crown,
    Star,
    Layers,
    MessageSquare,
    Mail,
    Smartphone,
    Share2,
    ShoppingBag,
    Cpu,
    Lock,
    Save,
    RefreshCw,
    CheckCircle,
    X,
    Loader2,
    Layout,
    Navigation2,
    ShieldCheck,
    Settings2,
    ArrowRightCircle,
    Compass,
    ArrowRight,
    Paintbrush
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setActiveTab, toggleTenantStatus } from '../store';
import { Tenant } from '../types/tenant';
import { APP_CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { useTenantForm } from '../hooks/useTenantForm';
import { BusinessTab } from './tenant-manager/BusinessTab';
import { CompanyTab } from './tenant-manager/CompanyTab';
import { TaxTab } from './tenant-manager/TaxTab';
import { BankingTab } from './tenant-manager/BankingTab';
import { SystemTab } from './tenant-manager/SystemTab';
import { GeographyTab } from './tenant-manager/GeographyTab';
import { UserTab } from './tenant-manager/UserTab';
import { BrandingTab } from './tenant-manager/BrandingTab';
import { IntegrationsTab } from './tenant-manager/IntegrationsTab';

interface TenantManagementProps {
    onLoginAs?: (tenant: Tenant) => void;
}

type TabType = 'fleet' | 'control';

const TenantManager: React.FC<TenantManagementProps> = ({ onLoginAs }) => {
    const dispatch = useDispatch();
    const { tenants } = useSelector((state: RootState) => state.tenant);

    // Tab state
    const [activeTab, setActiveTabLocal] = useState<TabType>('fleet');

    // Fleet tab state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    // Tenant Form (reusing TenantManager functionality)
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const tenantForm = useTenantForm();

    // High-Density Scale State (100-N Tenants)
    const [sortConfig, setSortConfig] = useState<{ key: keyof Tenant | 'region.currency'; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);
    const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
    const [advancedFilters, setAdvancedFilters] = useState<{ sector: string; region: string }>({ sector: 'ALL', region: 'ALL' });

    // Extract unique values for filters
    const sectors = useMemo(() => {
        const unique = new Set(tenants.map(t => t.sector));
        return ['ALL', ...Array.from(unique)];
    }, [tenants]);

    const regions = useMemo(() => {
        const unique = new Set(tenants.map(t => t.region?.currency || 'UNKNOWN'));
        return ['ALL', ...Array.from(unique)];
    }, [tenants]);

    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.domain && t.domain.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && t.isActive) ||
                (statusFilter === 'SUSPENDED' && !t.isActive);

            const matchesSector = advancedFilters.sector === 'ALL' || t.sector === advancedFilters.sector;
            const matchesRegion = advancedFilters.region === 'ALL' || (t.region?.currency || 'UNKNOWN') === advancedFilters.region;

            return matchesSearch && matchesStatus && matchesSector && matchesRegion;
        });
    }, [tenants, searchQuery, statusFilter, advancedFilters]);

    const sortedTenants = useMemo(() => {
        if (!sortConfig) return filteredTenants;

        return [...filteredTenants].sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof Tenant];
            let bValue: any = b[sortConfig.key as keyof Tenant];

            if (sortConfig.key === 'region.currency') {
                aValue = a.region?.currency || '';
                bValue = b.region?.currency || '';
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredTenants, sortConfig]);

    const paginatedTenants = useMemo(() => {
        const firstIndex = (currentPage - 1) * itemsPerPage;
        const lastIndex = firstIndex + itemsPerPage;
        return sortedTenants.slice(firstIndex, lastIndex);
    }, [sortedTenants, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedTenants.length / itemsPerPage);

    const handleSort = (key: keyof Tenant | 'region.currency') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleTenantSelection = (id: string) => {
        setSelectedTenants(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedTenants.length === paginatedTenants.length) {
            setSelectedTenants([]);
        } else {
            setSelectedTenants(paginatedTenants.map(t => t.id));
        }
    };
    const metrics = useMemo(() => {
        const active = tenants.filter(t => t.isActive).length;
        const total = tenants.length;
        const growModules = tenants.filter(t => t.modules.includes('GROW')).length;
        return {
            total,
            active,
            suspended: total - active,
            growthEnabled: growModules,
            healthScore: total > 0 ? Math.round((active / total) * 100) : 100
        };
    }, [tenants]);

    const handleToggleStatus = async (tenant: Tenant) => {
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
    };

    // State for full-page view toggle
    const [isDeployView, setIsDeployView] = useState(false);

    const handleOpenEditPanel = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        tenantForm.handleStartEdit(tenant);
        setIsDeployView(true);
    };

    const handleOpenProvisionPanel = () => {
        setSelectedTenant(null);
        tenantForm.handleCancelEdit(); // Reset form to initial state
        setIsDeployView(true);
    };

    const handlePanelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await tenantForm.handleSubmit();
        if (success) {
            setIsDeployView(false);
            setSelectedTenant(null);
        }
    };

    const getSectorIcon = (sector: string) => {
        switch (sector?.toUpperCase()) {
            case 'TEXTILE': return '🧵';
            case 'PHARMACY': return '💊';
            case 'GROCERY': return '🛒';
            case 'ELECTRONICS': return '📱';
            case 'FMCG': return '📦';
            default: return '🏢';
        }
    };

    if (isDeployView) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-12 animate-in fade-in zoom-in-95 duration-500">
                {/* Advanced Deployment Layout Header */}
                <div className="max-w-[1600px] mx-auto mb-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <div className="flex items-center gap-8 relative z-10">
                        <button
                            onClick={() => {
                                setIsDeployView(false);
                                setSelectedTenant(null);
                            }}
                            className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm group/back"
                        >
                            <ArrowRightCircle className="w-8 h-8 rotate-180 group-hover/back:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-indigo-600/10 text-indigo-600 text-[10px] font-black uppercase tracking-tighter rounded-full border border-indigo-600/20">Protocol: Environment_Deployment</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Live Connection Active</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                {tenantForm.editingTenant ? 'Edit' : 'Provision'} <span className="text-indigo-600">Infrastructure</span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                        <button
                            type="button"
                            onClick={() => setIsDeployView(false)}
                            className="px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                        >
                            Abort Operations
                        </button>
                        <button
                            form="tenant-full-form"
                            type="submit"
                            disabled={!tenantForm.newTenant.name || !tenantForm.newTenant.subdomain || tenantForm.isSaving}
                            className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3 overflow-hidden relative group/commit"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/commit:animate-[shimmer_3s_infinite]"></div>
                            {tenantForm.isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            Commit Changes
                        </button>
                    </div>
                </div>

                {/* Primary Content Area: Tabbed Neural Form */}
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-12">
                    {/* Sidebar: Tactical Segmented Navigation */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/20 dark:border-slate-800 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/30"></div>
                            <div className="flex flex-col gap-2 relative z-10">
                                {[
                                    { id: 'business', label: 'Business', icon: Building2 },
                                    { id: 'contact', label: 'Company', icon: Mail },
                                    { id: 'tax', label: 'Taxation', icon: Database },
                                    { id: 'banking', label: 'Banking', icon: Sparkles },
                                    { id: 'system', label: 'Modules', icon: Cpu },
                                    { id: 'geography', label: 'Locations', icon: Globe },
                                    { id: 'user', label: 'Admin User', icon: Users },
                                    { id: 'branding', label: 'Branding', icon: Paintbrush },
                                    { id: 'integrations', label: 'API Links', icon: Zap }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => tenantForm.setActiveTab(tab.id as any)}
                                        className={`w-full px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-4 group/tab relative overflow-hidden ${tenantForm.activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 ring-4 ring-indigo-600/10' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <tab.icon className={`w-4 h-4 transition-all ${tenantForm.activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        <span className="relative z-10">{tab.label}</span>
                                        {tenantForm.activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto animate-in slide-in-from-left-2" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Hub Sidebar Widget */}
                        <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl"></div>
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Node Health</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Latency</span>
                                    <span className="text-xs font-black italic">12ms - Optimal</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[92%] shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Deployment Viewport */}
                    <div className="xl:col-span-3">
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[3.5rem] border border-white/20 dark:border-slate-800 shadow-2xl p-12 lg:p-20 relative overflow-hidden min-h-[800px]">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000"></div>

                            <form id="tenant-full-form" onSubmit={handlePanelSubmit} className="relative z-10 h-full flex flex-col">
                                <div className="flex-1 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                    {tenantForm.activeTab === 'business' && <BusinessTab newTenant={tenantForm.newTenant} setNewTenant={tenantForm.setNewTenant} />}
                                    {tenantForm.activeTab === 'contact' && <CompanyTab newTenant={tenantForm.newTenant} setNewTenant={tenantForm.setNewTenant} />}
                                    {tenantForm.activeTab === 'tax' && <TaxTab newTenant={tenantForm.newTenant} setNewTenant={tenantForm.setNewTenant} />}
                                    {tenantForm.activeTab === 'banking' && <BankingTab newTenant={tenantForm.newTenant} setNewTenant={tenantForm.setNewTenant} />}
                                    {tenantForm.activeTab === 'system' && (
                                        <SystemTab
                                            newTenant={tenantForm.newTenant}
                                            setNewTenant={tenantForm.setNewTenant}
                                            handleModuleToggle={tenantForm.handleModuleToggle}
                                        />
                                    )}
                                    {tenantForm.activeTab === 'geography' && (
                                        <GeographyTab
                                            newTenant={tenantForm.newTenant}
                                            setNewTenant={tenantForm.setNewTenant}
                                            tempCity={tenantForm.tempCity}
                                            setTempCity={tenantForm.setTempCity}
                                            addCity={tenantForm.addCity}
                                            removeCity={tenantForm.removeCity}
                                            tempBranch={tenantForm.tempBranch}
                                            setTempBranch={tenantForm.setTempBranch}
                                            addBranch={tenantForm.addBranch}
                                            removeBranch={tenantForm.removeBranch}
                                        />
                                    )}
                                    {tenantForm.activeTab === 'user' && <UserTab newTenant={tenantForm.newTenant} setNewTenant={tenantForm.setNewTenant} />}
                                    {tenantForm.activeTab === 'branding' && (
                                        <BrandingTab
                                            newTenant={tenantForm.newTenant}
                                            setNewTenant={tenantForm.setNewTenant}
                                            logoInput={tenantForm.logoInput}
                                            setLogoInput={tenantForm.setLogoInput}
                                        />
                                    )}
                                    {tenantForm.activeTab === 'integrations' && <IntegrationsTab newTenant={tenantForm.newTenant} setNewTenant={tenantForm.setNewTenant} />}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1800px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Premium Header 2.0: Glassmorphism & Animated Depth */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[3.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/20 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -mr-64 -mt-64 blur-[100px] animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full -ml-40 -mb-40 blur-[80px]" />

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-20 animate-pulse"></div>
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-white/20">
                                <Building2 className="w-8 h-8" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-indigo-600 text-[10px] font-black text-white uppercase tracking-tighter rounded-md">Super Admin</span>
                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">V2.0 Command</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">
                                Fleet <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Intelligence</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-2 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                Monitoring and provisioning infrastructure in real-time
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden lg:block"></div>
                        <button
                            onClick={() => dispatch(setActiveTab('DASHBOARD'))}
                            className="p-4 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50 group/btn"
                        >
                            <LayoutDashboard className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={handleOpenProvisionPanel}
                            className="relative flex items-center gap-3 px-8 py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 active:translate-y-0 transition-all overflow-hidden group/provision"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/provision:animate-[shimmer_2s_infinite]"></div>
                            <Plus className="w-5 h-5" /> Provision Tenant
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium Tab Navigation */}
            <div className="flex bg-white/50 dark:bg-slate-900/30 backdrop-blur-md p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 w-fit mx-auto shadow-xl">
                {[
                    { id: 'fleet', label: 'Tenant Fleet', icon: Building2 },
                    { id: 'control', label: 'Core Systems', icon: Settings }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTabLocal(tab.id as TabType)}
                        className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 group relative overflow-hidden ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        {activeTab === tab.id && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                        )}
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-bounce' : 'group-hover:scale-125 transition-transform'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: Tenant Fleet */}
            {activeTab === 'fleet' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    {/* KPI Pulse Cards 2.0 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {[
                            { label: 'Total Fleet', value: metrics.total, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', glow: 'group-hover:shadow-indigo-500/20', trend: 'Global Stack' },
                            { label: 'Active Ready', value: metrics.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', glow: 'group-hover:shadow-emerald-500/20', trend: 'Operational' },
                            { label: 'Attention', value: metrics.suspended, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', glow: 'group-hover:shadow-rose-500/20', trend: 'Restricted' },
                            { label: 'Market Flow', value: metrics.growthEnabled, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', glow: 'group-hover:shadow-violet-500/20', trend: 'Integrated' },
                            { label: 'Fleet Health', value: `${metrics.healthScore}%`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', glow: 'group-hover:shadow-blue-500/20', trend: 'Optimization' }
                        ].map((kpi, idx) => (
                            <div key={idx} className={`bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative group overflow-hidden hover:-translate-y-2 transition-all duration-500 ${kpi.glow}`}>
                                <div className={`absolute -top-10 -right-10 w-32 h-32 ${kpi.bg} dark:opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                                <div className={`w-14 h-14 ${kpi.bg} dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:rotate-6 transition-transform`}>
                                    <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 relative z-10">{kpi.label}</p>
                                <div className="flex items-end gap-2 relative z-10">
                                    <h3 className="text-3xl font-black tracking-tighter">{kpi.value}</h3>
                                    <div className={`mb-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md ${kpi.value > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <div className={`w-1 h-1 rounded-full ${kpi.value > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                        <span className="text-[8px] font-black uppercase">Live</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 relative z-10">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        {kpi.trend}
                                        <ChevronRight className="w-3 h-3 text-slate-300" />
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Advanced Tactical Search & Filter Matrix */}
                    <div className="space-y-6">
                        <div className="flex flex-col xl:flex-row gap-6 p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex-1 relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Name, Domain, or Region telemetry..."
                                    className="w-full pl-16 pr-6 py-5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {/* Sector Filter */}
                                <div className="relative group/select">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={advancedFilters.sector}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, sector: e.target.value }))}
                                        className="appearance-none pl-12 pr-10 py-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-[11px] uppercase tracking-widest outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                    >
                                        {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                {/* Region Filter */}
                                <div className="relative group/select">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={advancedFilters.region}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, region: e.target.value }))}
                                        className="appearance-none pl-12 pr-10 py-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-[11px] uppercase tracking-widest outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                    >
                                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>

                                <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden xl:block"></div>

                                <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                    {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${statusFilter === status ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bulk Action Proto Bar */}
                        {selectedTenants.length > 0 && (
                            <div className="flex items-center justify-between p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl animate-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black">{selectedTenants.length}</div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-[0.1em]">Batch Protocol Active</h4>
                                        <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest italic">Ready for mass configuration update</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mass Suspend</button>
                                    <button className="px-6 py-3 bg-white text-indigo-600 hover:scale-105 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Engage Mass Update</button>
                                    <button onClick={() => setSelectedTenants([])} className="p-3 bg-white/10 hover:bg-rose-500 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Industrial Command Table (100-N Tenants) */}
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative group">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="p-8 w-10">
                                            <button onClick={toggleAllSelection} className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${selectedTenants.length === paginatedTenants.length ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700'}`}>
                                                {selectedTenants.length === paginatedTenants.length && <CheckCircle className="w-4 h-4 text-white" />}
                                            </button>
                                        </th>
                                        {[
                                            { id: 'name', label: 'Business Entity' },
                                            { id: 'sector', label: 'Industry Tier' },
                                            { id: 'region.currency', label: 'Region Hub' },
                                            { id: 'isActive', label: 'System Status' },
                                            { id: 'modules', label: 'Module Ecosystem' }
                                        ].map(col => (
                                            <th key={col.id} className="p-8 cursor-pointer group/th" onClick={() => handleSort(col.id as any)}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/th:text-indigo-500 transition-colors">{col.label}</span>
                                                    <RefreshCw className={`w-3 h-3 text-slate-300 group-hover/th:text-indigo-400 transition-all ${sortConfig?.key === col.id ? 'rotate-180 text-indigo-600' : ''}`} />
                                                </div>
                                            </th>
                                        ))}
                                        <th className="p-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTenants.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-32 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-6">
                                                    <Building2 className="w-20 h-20 opacity-10 animate-pulse" />
                                                    <h4 className="text-xl font-black uppercase tracking-widest italic">No Nodes in Search Perimeter</h4>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTenants.map(tenant => (
                                            <tr key={tenant.id} className="group/row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 border-b border-slate-50 dark:border-slate-800/30">
                                                <td className="p-8">
                                                    <button onClick={() => toggleTenantSelection(tenant.id)} className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${selectedTenants.includes(tenant.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700 group-hover/row:border-indigo-400'}`}>
                                                        {selectedTenants.includes(tenant.id) && <CheckCircle className="w-4 h-4 text-white" />}
                                                    </button>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl group-hover/row:scale-110 group-hover/row:rotate-3 transition-all">
                                                            {getSectorIcon(tenant.sector)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter group-hover/row:text-indigo-600 transition-colors">{tenant.name}</h4>
                                                                {tenant.isPremium && <Crown className="w-3.5 h-3.5 text-amber-500" title="Premium Enterprise" />}
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{tenant.subdomain}.ERP.NEXT</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{tenant.sector}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Core Vertical</span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                            <Globe className="w-3.5 h-3.5 text-slate-500" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{tenant.region?.currency || 'USD'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <button
                                                        onClick={() => handleToggleStatus(tenant)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tenant.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${tenant.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                                        {tenant.isActive ? 'Broadcasting' : 'Restricted'}
                                                    </button>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex -space-x-2">
                                                        {tenant.modules.slice(0, 3).map((mod, i) => (
                                                            <div key={mod} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-900 flex items-center justify-center text-[9px] font-black text-indigo-600 shadow-sm" title={mod}>
                                                                {mod.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {tenant.modules.length > 3 && (
                                                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 border-2 border-slate-50 dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                                +{tenant.modules.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => onLoginAs?.(tenant)}
                                                            className="p-3 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 transition-all hover:scale-110 active:scale-95"
                                                            title="Emulate Tenant"
                                                        >
                                                            <LogIn className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditPanel(tenant)}
                                                            className="p-3 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 transition-all hover:scale-110 active:scale-95"
                                                            title="Adjust Infrastructure"
                                                        >
                                                            <Settings2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Matrix */}
                        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet Telemetry: Showing {paginatedTenants.length} of {sortedTenants.length} Nodes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-3 bg-white dark:bg-slate-700 text-slate-500 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 disabled:opacity-30 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-3 bg-white dark:bg-slate-700 text-slate-500 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 disabled:opacity-30 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Core Systems (Legacy Control Placeholder) */}
            {activeTab === 'control' && (
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[3rem] border border-slate-200 dark:border-slate-800 p-20 shadow-2xl animate-in slide-in-from-right-4 duration-500 text-center">
                    <div className="max-w-md mx-auto space-y-8">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-400">
                            <Settings2 className="w-12 h-12 animate-spin-slow" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Core <span className="text-indigo-600">Infrastructure</span></h3>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed">Platform-wide system configuration, security protocols, and global redundancy settings are managed via the dedicated Architecture layer.</p>
                        </div>
                        <button onClick={() => setActiveTabLocal('fleet')} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all">Back to Fleet Intelligence</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantManager;
