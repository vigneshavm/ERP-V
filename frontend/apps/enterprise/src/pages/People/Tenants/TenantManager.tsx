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
import { RootState } from "@/app/store/store";
import { toggleTenantStatus } from "@/entities/session/model/tenantSlice";
import { useNavigation } from '@/app/providers/NavigationContext';
import { Tenant } from "@/entities/session/model/core";
import { APP_CONFIG } from "@/app/config";
import { useTenantForm } from "@/features/tenant-onboarding";
import { BusinessTab } from "./components/BusinessTab";
import { CompanyTab } from "./components/CompanyTab";
import { TaxTab } from "./components/TaxTab";
import { BankingTab } from "./components/BankingTab";
import { SystemTab } from "./components/SystemTab";
import { GeographyTab } from "./components/GeographyTab";
import { UserTab } from "./components/UserTab";
import { BrandingTab } from "./components/BrandingTab";
import { IntegrationsTab } from "./components/IntegrationsTab";

interface TenantManagementProps {
    onLoginAs?: (tenant: Tenant) => void;
}

type TabType = 'fleet' | 'control';

const TenantManager: React.FC<TenantManagementProps> = ({ onLoginAs }) => {
    const dispatch = useDispatch();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { navigate } = useNavigation();
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

    // System Configuration State
    const [sysConfig, setSysConfig] = useState({
        allowProvisioning: true,
        maintenanceMode: false,
        defaultRegion: 'US-EAST',
        enforceMFA: true,
        sessionTimeout: 30,
        passwordComplexity: 'HIGH'
    });
    const [announcement, setAnnouncement] = useState('');

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
                (t.subdomain?.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
        const growModules = tenants.filter(t => (t as any).modules?.includes('GROW')).length;
        return {
            total,
            active,
            suspended: total - active,
            growthEnabled: growModules,
            healthScore: total > 0 ? Math.round((active / total) * 100) : 100
        };
    }, [tenants]);

    const handleToggleStatus = async (tenant: Tenant) => {
        // const newStatus = !tenant.isActive;
        // TODO: Integrate with Backend API
        dispatch(toggleTenantStatus(tenant.id));
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
                {/* Deployment Header */}
                <div className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => {
                                setIsDeployView(false);
                                setSelectedTenant(null);
                            }}
                            className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                        >
                            <ArrowRightCircle className="w-6 h-6 rotate-180" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tenantForm.editingTenant ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                    {tenantForm.editingTenant ? 'Edit Mode' : 'Creation Mode'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {tenantForm.editingTenant ? 'Configure Tenant' : 'Provision New Tenant'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="hidden lg:flex flex-col items-end justify-center mr-4 border-r border-slate-100 dark:border-slate-800 pr-6">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setup Quality</span>
                                <span className="text-[10px] font-black text-indigo-600 uppercase">84%</span>
                            </div>
                            <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '84%' }} />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDeployView(false)}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            form="tenant-full-form"
                            type="submit"
                            disabled={!tenantForm.newTenant.name || !tenantForm.newTenant.subdomain || tenantForm.isSaving}
                            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {tenantForm.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {tenantForm.editingTenant ? 'Save Changes' : 'Create Tenant'}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <div className="xl:col-span-1 space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex flex-col gap-1">
                                {[
                                    { id: 'business', label: 'Business Profile', icon: Building2 },
                                    { id: 'contact', label: 'Contact Details', icon: Mail },
                                    { id: 'tax', label: 'Tax Configuration', icon: Database },
                                    { id: 'banking', label: 'Banking', icon: Sparkles },
                                    { id: 'system', label: 'Modules & Features', icon: Cpu },
                                    { id: 'geography', label: 'Locations', icon: Globe },
                                    { id: 'user', label: 'Admin Access', icon: Users },
                                    { id: 'branding', label: 'Branding', icon: Paintbrush },
                                    { id: 'integrations', label: 'Integrations', icon: Zap }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => tenantForm.setFormTab(tab.id as any)}
                                        className={`w-full px-4 py-3 rounded-xl text-xs font-bold text-left transition-all flex items-center gap-3 ${tenantForm.activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <tab.icon className={`w-4 h-4 ${tenantForm.activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span>{tab.label}</span>
                                        {tenantForm.activeTab === tab.id && <ChevronRight className="w-3 h-3 ml-auto text-indigo-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Form Viewport */}
                    <div className="xl:col-span-3">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 min-h-[600px]">

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
            {/* Standard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded">Super Admin</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Tenant Operation Center
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Manage and monitor your fleet of ERP instances.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('DASHBOARD')}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                        title="Return to Dashboard"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                    </button>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden lg:block"></div>
                    <button
                        onClick={handleOpenProvisionPanel}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Provision Tenant
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                {[
                    { id: 'fleet', label: 'Tenant Fleet', icon: Building2 },
                    { id: 'control', label: 'Core Systems', icon: Settings }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTabLocal(tab.id as TabType)}
                        className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : ''}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: Tenant Fleet */}
            {activeTab === 'fleet' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'Total Tenants', value: metrics.total, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Total Fleet' },
                            { label: 'Active', value: metrics.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Operational' },
                            { label: 'Suspended', value: metrics.suspended, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Restricted' },
                            { label: 'Growth Enabled', value: metrics.growthEnabled, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', trend: 'Integrated' },
                            { label: 'System Health', value: `${metrics.healthScore}%`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Score' }
                        ].map((kpi, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                {kpi.label === 'System Health' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: kpi.value }} />
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${kpi.bg} dark:bg-slate-800`}>
                                        <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${(typeof kpi.value === 'number' && kpi.value > 0) || (typeof kpi.value === 'string' && kpi.value !== '0%') ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                                        {kpi.trend}
                                    </span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">{kpi.label}</p>
                                    </div>
                                    {kpi.label === 'System Health' && (
                                        <div className="flex items-end gap-1 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
                                            {[30, 45, 60, 55, 70, 65, 80, 75, 95, 100].map((h, i) => (
                                                <div key={i} className="w-1 bg-blue-500/30 rounded-t-sm" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Actions */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative flex-1 w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tenants..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex overflow-x-auto gap-3 w-full md:w-auto pb-2 md:pb-0">
                            <select
                                value={advancedFilters.sector}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, sector: e.target.value }))}
                                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]"
                            >
                                {sectors.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Sectors' : s}</option>)}
                            </select>

                            <select
                                value={advancedFilters.region}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, region: e.target.value }))}
                                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]"
                            >
                                {regions.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Regions' : r}</option>)}
                            </select>

                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statusFilter === status ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>



                    {/* Tenant Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-6 py-4 w-10">
                                            <button onClick={toggleAllSelection} className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${selectedTenants.length === paginatedTenants.length ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                {selectedTenants.length === paginatedTenants.length && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                            </button>
                                        </th>
                                        {[
                                            { id: 'name', label: 'Business Entity' },
                                            { id: 'sector', label: 'Sector' },
                                            { id: 'region.currency', label: 'Region' },
                                            { id: 'isActive', label: 'Status' },
                                            { id: 'modules', label: 'Modules' }
                                        ].map(col => (
                                            <th key={col.id} className="px-6 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort(col.id as any)}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{col.label}</span>
                                                    <RefreshCw className={`w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-all ${sortConfig?.key === col.id ? 'text-indigo-600' : 'opacity-0 group-hover:opacity-100'}`} />
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedTenants.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-20 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                                                        <Search className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Tenants Found</h4>
                                                    <p className="text-sm text-slate-500">Try adjusting your search criteria or filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTenants.map(tenant => (
                                            <tr key={tenant.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <button onClick={() => toggleTenantSelection(tenant.id)} className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${selectedTenants.includes(tenant.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700 group-hover:border-indigo-400'}`}>
                                                        {selectedTenants.includes(tenant.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xl shadow-sm">
                                                            {getSectorIcon(tenant.sector)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{tenant.name}</h4>
                                                                {(tenant as any).isPremium && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{tenant.subdomain}.erp.next</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        {tenant.sector}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                                                        {tenant.region?.currency || 'USD'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(tenant)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${tenant.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${tenant.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                        {tenant.isActive ? 'Active' : 'Suspended'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-1.5">
                                                        {tenant.modules?.slice(0, 4).map((mod, i) => (
                                                            <div key={mod} className="w-6 h-6 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 shadow-sm" title={mod}>
                                                                {mod.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {tenant.modules && tenant.modules.length > 4 && (
                                                            <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                                +{tenant.modules.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => onLoginAs?.(tenant)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Login as System Admin"
                                                        >
                                                            <LogIn className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditPanel(tenant)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Configuration"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>


                        {/* Pagination */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Showing <span className="font-bold text-slate-700 dark:text-slate-300">{paginatedTenants.length}</span> of <span className="font-bold text-slate-700 dark:text-slate-300">{sortedTenants.length}</span> tenants
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Core Systems */}
            {activeTab === 'control' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    {/* Platform Health */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">System Status</p>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operational</h3>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Active Nodes</p>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tenants.length} / 500</h3>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">API Latency</p>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">24ms</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Global Settings */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Globe className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Global Settings</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">New Provisioning</p>
                                        <p className="text-xs text-slate-500">Allow creation of new tenants</p>
                                    </div>
                                    <button
                                        onClick={() => setSysConfig(prev => ({ ...prev, allowProvisioning: !prev.allowProvisioning }))}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${sysConfig.allowProvisioning ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${sysConfig.allowProvisioning ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">Maintenance Mode</p>
                                        <p className="text-xs text-slate-500">Restrict access for all non-admins</p>
                                    </div>
                                    <button
                                        onClick={() => setSysConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${sysConfig.maintenanceMode ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${sysConfig.maintenanceMode ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Default Region</label>
                                    <select
                                        value={sysConfig.defaultRegion}
                                        onChange={(e) => setSysConfig(prev => ({ ...prev, defaultRegion: e.target.value }))}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="US-EAST">US East (N. Virginia)</option>
                                        <option value="EU-WEST">EU West (London)</option>
                                        <option value="AP-SOUTH">AP South (Mumbai)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Security Policy */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Policy</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">Enforce MFA</p>
                                        <p className="text-xs text-slate-500">Require 2FA for all admin accounts</p>
                                    </div>
                                    <button
                                        onClick={() => setSysConfig(prev => ({ ...prev, enforceMFA: !prev.enforceMFA }))}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${sysConfig.enforceMFA ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${sysConfig.enforceMFA ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Session Timeout (Minutes)</label>
                                    <input
                                        type="number"
                                        value={sysConfig.sessionTimeout}
                                        onChange={(e) => setSysConfig(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Password Complexity</label>
                                    <select
                                        value={sysConfig.passwordComplexity}
                                        onChange={(e) => setSysConfig(prev => ({ ...prev, passwordComplexity: e.target.value }))}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="LOW">Low (Min 6 chars)</option>
                                        <option value="MEDIUM">Medium (Min 8 chars, Alphanumeric)</option>
                                        <option value="HIGH">High (Min 12 chars, Special chars)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Broadcast System */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">System Broadcast</h3>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <textarea
                                value={announcement}
                                onChange={(e) => setAnnouncement(e.target.value)}
                                placeholder="Type a message to broadcast to all active tenant dashboards..."
                                className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
                            />
                            <div className="flex flex-col gap-2">
                                <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
                                    Send Broadcast
                                </button>
                                <button
                                    onClick={() => setAnnouncement('')}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default TenantManager;
