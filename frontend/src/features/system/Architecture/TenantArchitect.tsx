import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap,
    MessageSquare, Mail, Smartphone, Share2, ShoppingBag, Cpu, Activity, RefreshCw, Key, CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import { GlobalGrowthConfig, GrowthProvider, GrowthChannelType, TenantGrowthConfig } from "@/types/tenant";
import { GrowthIntelligenceService } from "@/services/GrowthIntelligenceService";

const TenantArchitect: React.FC = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
    const [tenantConfig, setTenantConfig] = useState<TenantGrowthConfig | null>(null);
    const [config, setConfig] = useState<GlobalGrowthConfig | null>(null);
    const [providers, setProviders] = useState<GrowthProvider[]>([]);

    // Editor State
    const [activeSection, setActiveSection] = useState<string>('OVERVIEW');
    const [connectionString, setConnectionString] = useState('');

    useEffect(() => {
        if (tenantId) {
            loadData(tenantId);
        }
    }, [tenantId]);

    const loadData = async (id: string) => {
        setIsLoading(true);
        try {
            const [globalConfig, allProviders, tenantSummary] = await Promise.all([
                GrowthIntelligenceService.getGlobalConfig(),
                GrowthIntelligenceService.getProviders(),
                GrowthIntelligenceService.getTenantsGrowthSummary()
            ]);

            setConfig(globalConfig);
            setProviders(allProviders);

            const tenant = tenantSummary.find((t: any) => t.id === id);
            if (tenant) {
                setSelectedTenant(tenant);
                const tConfig = await GrowthIntelligenceService.getTenantConfig(tenant.id);
                setTenantConfig(tConfig);
            } else {
                // Handle tenant not found
                navigate('/grow/super-admin');
            }
        } catch (error) {
            console.error("Failed to load tenant data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateEntitlements = async (updatedChannels: GrowthChannelType[]) => {
        if (!selectedTenant) return;
        setIsSaving(true);
        await GrowthIntelligenceService.updateTenantGrowthEntitlements(selectedTenant.id, updatedChannels);
        setSelectedTenant({ ...selectedTenant, enabledChannels: updatedChannels });
        setIsSaving(false);
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

    const channels: { id: GrowthChannelType; label: string; icon: any; color: string }[] = [
        { id: 'WHATSAPP' as GrowthChannelType, label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
        { id: 'EMAIL' as GrowthChannelType, label: 'Email', icon: Mail, color: 'text-blue-500' },
        { id: 'SMS' as GrowthChannelType, label: 'SMS', icon: Smartphone, color: 'text-primary' },
        { id: 'SOCIAL' as GrowthChannelType, label: 'Social Media', icon: Share2, color: 'text-pink-500' },
        { id: 'ONLINE_STORE' as GrowthChannelType, label: 'Online Store', icon: ShoppingBag, color: 'text-orange-500' }
    ];

    const renderOverview = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-slate-900 rounded-sm p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-primary">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tenant Health Overview</h2>
                        <p className="text-sm text-slate-500">Summary of entitlements and system usage.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Active Channels</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedTenant.enabledChannels.length} <span className="text-sm text-slate-400 font-medium ml-1">/ {channels.length}</span></p>
                    </div>
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-sm border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-xs font-bold uppercase text-emerald-600 dark:text-success tracking-wider mb-2">Health Score</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-success">{selectedTenant.health}%</p>
                    </div>
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-sm border border-indigo-100 dark:border-indigo-900/20">
                        <p className="text-xs font-bold uppercase text-primary dark:text-primary tracking-wider mb-2">Plan Tier</p>
                        <p className="text-3xl font-bold text-indigo-700 dark:text-primary">Enterprise</p>
                    </div>
                </div>
            </div>

            {/* Protocol Injector (Global) */}
            <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Protocol Injector</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Rapid deployment via tactical engage strings</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Paste engagement protocol string..."
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                        value={connectionString}
                        onChange={(e) => setConnectionString(e.target.value)}
                    />
                    <button
                        onClick={handleInjectProtocol}
                        disabled={!connectionString || isSaving}
                        className="px-6 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                        Inject
                    </button>
                </div>
            </div>
        </div>
    );

    const renderChannelConfig = (channelId: GrowthChannelType) => {
        const channel = channels.find(c => c.id === channelId);
        if (!channel) return null;

        const isEnabled = selectedTenant.enabledChannels.includes(channelId);
        const activeConnection = tenantConfig?.connections.find((c: any) => c.channel === channelId);

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {/* Header Card */}
                <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-sm flex items-center justify-center ${isEnabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <channel.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{channel.label} Architecture</h2>
                            <p className="text-sm text-slate-500">
                                {isEnabled ? 'Active and routing traffic' : 'Channel is currently disabled'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                const newChannels = isEnabled
                                    ? selectedTenant.enabledChannels.filter((c: any) => c !== channelId)
                                    : [...selectedTenant.enabledChannels, channelId];
                                handleUpdateEntitlements(newChannels);
                            }}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {isEnabled && (
                    <>
                        {/* Provider Selection */}
                        <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Route Provider</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {providers.filter(p => p.channel === channelId).map(provider => {
                                    const isSelected = activeConnection?.providerId === provider.id;
                                    return (
                                        <div
                                            key={provider.id}
                                            onClick={() => handleUpdateConnection({ ...activeConnection, providerId: provider.id, channel: channelId, isEnabled: true })}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${isSelected ? 'border-indigo-600 bg-indigo-50/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-slate-900 dark:text-white text-sm">{provider.name}</span>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">{provider.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Configuration & Vault */}
                        {activeConnection?.providerId && (
                            <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Key className="w-5 h-5 text-primary" />
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Credential Vault</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {channelId === 'WHATSAPP' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phone Number ID</label>
                                                <input type="text" value="104928374615293" readOnly className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Access Token</label>
                                                <input type="password" value="******************" readOnly className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                        </>
                                    )}
                                    {channelId === 'EMAIL' && (
                                        <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-sm text-slate-500 border border-slate-200 dark:border-slate-700 border-dashed">
                                            Managed via Domain DNS Records
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quotas */}
                        <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Usage Quotas</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Monthly Throughput Limit</span>
                                    <span className="font-bold text-primary">50,000</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 w-3/4 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };
    if (isLoading || !selectedTenant || !tenantConfig || !config) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-8 font-sans">
            <div className="max-w-[1800px] mx-auto h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors py-2 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Back to Console</span>
                    </button>

                    <div className="bg-white dark:bg-slate-900 rounded-sm p-2 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Architecture</h3>
                        </div>
                        <button
                            onClick={() => setActiveSection('OVERVIEW')}
                            className={`w-full px-4 py-3 rounded-xl text-left font-bold text-sm transition-all flex items-center gap-3 ${activeSection === 'OVERVIEW' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-primary' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Activity className="w-4 h-4" /> Overview
                        </button>

                        <div className="p-4 mt-2">
                            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Channels</h3>
                            <div className="space-y-1">
                                {channels.map(channel => {
                                    const isEnabled = selectedTenant.enabledChannels.includes(channel.id);
                                    return (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveSection(channel.id)}
                                            className={`w-full px-4 py-3 rounded-xl text-left font-medium text-sm transition-all flex items-center justify-between group ${activeSection === channel.id ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <channel.icon className={`w-4 h-4 ${activeSection === channel.id ? 'text-primary' : 'text-slate-400'}`} />
                                                {channel.label}
                                            </div>
                                            {isEnabled && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
                    {activeSection === 'OVERVIEW' ? renderOverview() : renderChannelConfig(activeSection as GrowthChannelType)}
                </div>
            </div>
        </div>
    );
};

export default TenantArchitect;
