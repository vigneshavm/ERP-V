import React, { useState, useEffect } from 'react';
import {
    Shield, Globe, Zap, Settings, CheckCircle, AlertTriangle,
    MessageSquare, Mail, Smartphone, Share2, ShoppingBag,
    Layers, Cpu, Activity, Lock, Save, RefreshCw,
    Users, MoreVertical, ExternalLink, ToggleLeft, ToggleRight,
    BarChart2, X, Info, Phone, Key, Globe2, HelpCircle, XCircle, CheckCircle2
} from 'lucide-react';
import { GlobalGrowthConfig, GrowthProvider, GrowthChannelType, TenantGrowthConfig } from '../../../types/tenant';
import { GrowthIntelligenceService } from '../../../services/GrowthIntelligenceService';
import { WhatsAppService } from '../../../services/whatsappService';
import { EmailService } from '../../../services/emailService';
import { SMSService } from '../../../services/smsService';
import { SocialService } from '../../../services/socialService';
import { StoreService } from '../../../services/storeService';

const SuperAdminGrowthConsole: React.FC = () => {
    const [config, setConfig] = useState<GlobalGrowthConfig | null>(null);
    const [providers, setProviders] = useState<GrowthProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'architecture' | 'tenants'>('architecture');
    const [tenants, setTenants] = useState<any[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
    const [tenantConfig, setTenantConfig] = useState<TenantGrowthConfig | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorTab, setEditorTab] = useState<'entitlements' | 'technical'>('entitlements');
    const [activeChannel, setActiveChannel] = useState<GrowthChannelType | null>(null);
    const [connectionString, setConnectionString] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [globalConfig, allProviders, tenantSummary] = await Promise.all([
            GrowthIntelligenceService.getGlobalConfig(),
            GrowthIntelligenceService.getProviders(),
            GrowthIntelligenceService.getTenantsGrowthSummary()
        ]);
        setConfig(globalConfig);
        setProviders(allProviders);
        setTenants(tenantSummary);
        setIsLoading(false);
    };

    const handleToggleChannel = (channel: GrowthChannelType) => {
        if (!config) return;
        const newChannels = config.allowedChannels.includes(channel)
            ? config.allowedChannels.filter(c => c !== channel)
            : [...config.allowedChannels, channel];
        setConfig({ ...config, allowedChannels: newChannels });
    };

    const handleToggleProvider = (channel: GrowthChannelType, providerId: string) => {
        if (!config) return;
        const currentProviders = config.allowedProviders[channel] || [];
        const newProviders = currentProviders.includes(providerId)
            ? currentProviders.filter(id => id !== providerId)
            : [...currentProviders, providerId];

        setConfig({
            ...config,
            allowedProviders: {
                ...config.allowedProviders,
                [channel]: newProviders
            }
        });
    };

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        await GrowthIntelligenceService.updateGlobalConfig(config);
        setIsSaving(false);
    };

    const handleUpdateEntitlements = async (tenantId: string, entitlements: GrowthChannelType[]) => {
        await GrowthIntelligenceService.updateTenantGrowthEntitlements(tenantId, entitlements);
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, enabledChannels: entitlements } : t));
    };

    const handleEditorOpen = async (tenant: any) => {
        setSelectedTenant(tenant);
        setIsLoading(true);
        const config = await GrowthIntelligenceService.getTenantConfig(tenant.id);
        setTenantConfig(config);
        if (tenant.enabledChannels.length > 0) {
            setActiveChannel(tenant.enabledChannels[0]);
        }
        setIsLoading(false);
        setIsEditorOpen(true);
        setEditorTab('entitlements');
    };

    const handleUpdateConnection = async (connection: any) => {
        if (!selectedTenant) return;
        setIsSaving(true);
        await GrowthIntelligenceService.updateTenantConnection(selectedTenant.id, connection);
        // Refresh local tenantConfig state
        const updatedConfig = await GrowthIntelligenceService.getTenantConfig(selectedTenant.id);
        setTenantConfig(updatedConfig);
        setIsSaving(false);
    };

    const handleInjectProtocol = async () => {
        if (!connectionString.trim() || !tenantConfig || !selectedTenant) return;

        const result = GrowthIntelligenceService.parseInjectProtocol(connectionString);

        if (result) {
            const { channel, providerId, credentials } = result;
            const newConnection = {
                channel,
                providerId,
                isEnabled: true,
                connectedAt: new Date().toISOString(),
                credentials,
                settings: {}
            };

            setIsSaving(true);
            await GrowthIntelligenceService.updateTenantConnection(selectedTenant.id, newConnection);

            // If the channel wasn't enabled, enable it
            if (!selectedTenant.enabledChannels.includes(channel)) {
                const newEnabled = [...selectedTenant.enabledChannels, channel];
                await GrowthIntelligenceService.updateTenantGrowthEntitlements(selectedTenant.id, newEnabled);
                setSelectedTenant({ ...selectedTenant, enabledChannels: newEnabled });
            }

            const refreshedConfig = await GrowthIntelligenceService.getTenantConfig(selectedTenant.id);
            setTenantConfig(refreshedConfig);
            setConnectionString('');
            setIsSaving(false);
            alert(`Protocol Injected: ${channel} node configuration established.`);
        } else {
            alert('Invalid Protocol: Check your engage string format.');
        }
    };

    if (isLoading || !config) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const channels: { id: GrowthChannelType; label: string; icon: any; color: string }[] = [
        { id: 'WHATSAPP' as GrowthChannelType, label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
        { id: 'EMAIL' as GrowthChannelType, label: 'Email', icon: Mail, color: 'text-blue-500' },
        { id: 'SMS' as GrowthChannelType, label: 'SMS', icon: Smartphone, color: 'text-indigo-500' },
        { id: 'SOCIAL' as GrowthChannelType, label: 'Social Media', icon: Share2, color: 'text-pink-500' },
        { id: 'ONLINE_STORE' as GrowthChannelType, label: 'Online Store', icon: ShoppingBag, color: 'text-orange-500' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40">
                            <Shield className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Super Admin <span className="text-indigo-400">Growth Console</span></h1>
                                <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">System Architecture</span>
                            </div>
                            <p className="text-slate-400 font-medium max-w-2xl text-lg">Manage global channel availability, provider registries, and cross-tenant compliance protocols.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Commit Global Changes
                    </button>
                </div>
            </div>

            <div className="flex bg-white dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit mx-auto mb-8 shadow-sm">
                <button
                    onClick={() => setActiveTab('architecture')}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'architecture' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    <Layers className="w-4 h-4" /> System Architecture
                </button>
                <button
                    onClick={() => setActiveTab('tenants')}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'tenants' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    <Users className="w-4 h-4" /> Tenant Control
                </button>
            </div>

            {activeTab === 'architecture' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-left-4 duration-500">
                    {/* Global Channel Gating */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Channel <span className="text-indigo-600">Enablement</span></h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {channels.map(channel => {
                                    const Icon = channel.icon;
                                    const isEnabled = config.allowedChannels.includes(channel.id);
                                    return (
                                        <div
                                            key={channel.id}
                                            onClick={() => handleToggleChannel(channel.id)}
                                            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${isEnabled ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-60'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{channel.label}</p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{isEnabled ? 'Globally Active' : 'Restricted'}</p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'} relative`}>
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Provider Selection Architecture */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600">
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Provider <span className="text-violet-600">Registry</span></h2>
                            </div>

                            <div className="space-y-8">
                                {channels.filter(c => config.allowedChannels.includes(c.id)).map(channel => (
                                    <div key={channel.id} className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <channel.icon className={`w-5 h-5 ${channel.color}`} />
                                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest text-sm">{channel.label} Providers</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {providers.filter(p => p.channel === channel.id).map(provider => {
                                                const isSelected = (config.allowedProviders[channel.id] || []).includes(provider.id);
                                                return (
                                                    <div
                                                        key={provider.id}
                                                        onClick={() => handleToggleProvider(channel.id, provider.id)}
                                                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'border-violet-600 bg-violet-50/30 dark:bg-violet-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-violet-300'}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                            {isSelected ? <CheckCircle className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{provider.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{provider.description}</p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Compliance & Limits (Right Rail) */}
                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-8 shadow-2xl text-white">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Compliance <span className="text-indigo-400">Rules</span></h2>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                                    <div>
                                        <p className="font-bold text-sm">Force Opt-In</p>
                                        <p className="text-[10px] text-slate-400">Require customer consent</p>
                                    </div>
                                    <button className="w-12 h-6 bg-indigo-600 rounded-full p-1 relative">
                                        <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Keyword Restrictions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {config.complianceRules.disallowedKeywords.map(word => (
                                            <span key={word} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider">{word}</span>
                                        ))}
                                        <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-700 transition-colors">+ Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-[1.5rem] flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-1">DANGER ZONE</p>
                                <p className="text-[10px] text-red-500 font-medium">Global changes affect all tenants instantly. Any deactivated provider will disrupt live campaigns.</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Tenant <span className="text-indigo-600">Growth Fleet</span></h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Manage individual tenant entitlements and usage limits</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                {tenants.length} Active Tenants
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tenant</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Status</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enabled Channels</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usage Health</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {tenants.map((tenant) => (
                                    <tr key={tenant.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                                                    {tenant.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{tenant.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {tenant.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : tenant.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-wrap gap-1.5">
                                                {tenant.enabledChannels.map((c: any) => (
                                                    <span key={c} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[8px] font-black uppercase">
                                                        {c}
                                                    </span>
                                                ))}
                                                {tenant.enabledChannels.length === 0 && <span className="text-[8px] font-bold text-slate-400 italic">None Enabled</span>}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${tenant.health > 80 ? 'bg-emerald-500' : tenant.health > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${tenant.health}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500">{tenant.health}%</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={() => handleEditorOpen(tenant)}
                                                className="p-2.5 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-400 transition-all active:scale-95"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tenant Architect Modal */}
            {isEditorOpen && selectedTenant && tenantConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 overflow-hidden">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                        {/* Modal Header */}
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">Tenant <span className="text-indigo-600">Architect</span></h3>
                                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{selectedTenant.name}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global infrastructure & Technical Configuration for unique tenant isolation</p>
                            </div>
                            <button onClick={() => setIsEditorOpen(false)} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all active:scale-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 border-b border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setEditorTab('entitlements')}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${editorTab === 'entitlements' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Shield className="w-4 h-4" /> Entitlements & Quotas
                            </button>
                            <button
                                onClick={() => setEditorTab('technical')}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${editorTab === 'technical' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Cpu className="w-4 h-4" /> Technical Configuration
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            {editorTab === 'entitlements' ? (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                                    {/* Channel Gating */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-indigo-600" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Authorized Channels</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {channels.map(channel => {
                                                const isEnabled = selectedTenant.enabledChannels.includes(channel.id);
                                                const isGloballyAllowed = config.allowedChannels.includes(channel.id);

                                                return (
                                                    <div
                                                        key={channel.id}
                                                        onClick={() => {
                                                            if (!isGloballyAllowed) return;
                                                            const newChannels = isEnabled
                                                                ? selectedTenant.enabledChannels.filter((c: any) => c !== channel.id)
                                                                : [...selectedTenant.enabledChannels, channel.id];
                                                            setSelectedTenant({ ...selectedTenant, enabledChannels: newChannels });
                                                        }}
                                                        className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between group ${!isGloballyAllowed ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'} ${isEnabled ? 'border-indigo-600 bg-indigo-50/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <channel.icon className={`w-5 h-5 ${isEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
                                                            <span className="text-xs font-black uppercase tracking-tight">{channel.label}</span>
                                                        </div>
                                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'} relative`}>
                                                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Quota Section */}
                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Activity className="w-5 h-5 text-indigo-600" />
                                            <h4 className="text-sm font-black uppercase">Quota Governance</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                                    <span>Monthly SMS Quota</span>
                                                    <span className="text-indigo-600">50,000</span>
                                                </div>
                                                <input type="range" className="w-full h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                                    <span>Email Blast Limit</span>
                                                    <span className="text-indigo-600">100,000</span>
                                                </div>
                                                <input type="range" className="w-full h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                                    {/* Channel Selector for Config */}
                                    <div className="flex flex-wrap gap-2 pb-6 border-b border-slate-100 dark:border-slate-800">
                                        {channels.filter(c => selectedTenant.enabledChannels.includes(c.id)).map(channel => (
                                            <button
                                                key={channel.id}
                                                onClick={() => setActiveChannel(channel.id)}
                                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeChannel === channel.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                <channel.icon className="w-4 h-4" /> {channel.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Protocol Injector */}
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                                <Zap className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black uppercase tracking-tighter">Protocol <span className="text-indigo-600">Injector</span></h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rapid deployment via tactical engage strings</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder="Paste engagement protocol string..."
                                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-sm focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all"
                                                value={connectionString}
                                                onChange={(e) => setConnectionString(e.target.value)}
                                            />
                                            <button
                                                onClick={handleInjectProtocol}
                                                disabled={!connectionString || isSaving}
                                                className="px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                                                Inject
                                            </button>
                                        </div>
                                    </div>

                                    {activeChannel ? (
                                        <div className="space-y-10">
                                            {/* Provider Selection (Filtered by Global Allowed) */}
                                            <div className="space-y-6">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Technical Provider</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {providers.filter(p => p.channel === activeChannel && (config.allowedProviders[activeChannel] || []).includes(p.id)).map(provider => {
                                                        const activeConnection = tenantConfig.connections.find(c => c.channel === activeChannel);
                                                        const isSelected = activeConnection?.providerId === provider.id;
                                                        return (
                                                            <div
                                                                key={provider.id}
                                                                onClick={() => handleUpdateConnection({ ...activeConnection, providerId: provider.id, channel: activeChannel, isEnabled: true })}
                                                                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group ${isSelected ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-lg' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}
                                                            >
                                                                <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-100'}`}>
                                                                    <Globe className="w-6 h-6" />
                                                                </div>
                                                                <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{provider.name}</p>
                                                                {isSelected && <p className="text-[8px] font-black text-indigo-600 uppercase mt-1">Active Connection</p>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Credential Vault */}
                                            {tenantConfig.connections.find(c => c.channel === activeChannel)?.providerId && (
                                                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                                                    <div className="relative z-10 space-y-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                                                <Key className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-black uppercase tracking-tighter italic">Technical <span className="text-indigo-400">Credentials</span></h4>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Securely stored and isolated for {selectedTenant.name}</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            {activeChannel === 'WHATSAPP' && (
                                                                <>
                                                                    <div className="space-y-3">
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Number ID</label>
                                                                        <div className="relative">
                                                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                                            <input type="text" value="104928374615293" readOnly className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-6 py-4 font-bold text-sm focus:outline-none" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Access Token</label>
                                                                        <div className="relative">
                                                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                                            <input type="password" value="********" readOnly className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-6 py-4 font-mono text-sm focus:outline-none" />
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {activeChannel === 'EMAIL' && (
                                                                <>
                                                                    <div className="space-y-3">
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sender Domain</label>
                                                                        <div className="relative">
                                                                            <Globe2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                                            <input type="text" value="mail.rmkvsilks.com" readOnly className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-6 py-4 font-bold text-sm focus:outline-none" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">API Key</label>
                                                                        <div className="relative">
                                                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                                            <input type="password" value="********" readOnly className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-6 py-4 font-mono text-sm focus:outline-none" />
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                                                            <Info className="w-6 h-6 text-amber-500 flex-shrink-0" />
                                                            <p className="text-xs font-bold text-amber-200/80 leading-relaxed uppercase tracking-tighter">These credentials grant direct infrastructure access. Any changes here will instantly affect delivery for {selectedTenant.name}.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                            <Cpu className="w-16 h-16 mb-4 text-slate-400" />
                                            <p className="font-black uppercase tracking-widest text-slate-500">Select an enabled channel above to configure</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4">
                            <button onClick={() => setIsEditorOpen(false)} className="px-10 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
                            <button
                                onClick={() => {
                                    handleUpdateEntitlements(selectedTenant.id, selectedTenant.enabledChannels);
                                    setIsEditorOpen(false);
                                }}
                                className="px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
                            >
                                Deploy Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminGrowthConsole;
