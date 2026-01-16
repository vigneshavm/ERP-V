import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Settings, CheckCircle, AlertTriangle,
    MessageSquare, Mail, Smartphone, Share2, ShoppingBag,
    Layers, Cpu, Lock, Save, RefreshCw,
    Users
} from 'lucide-react';
import { GlobalGrowthConfig, GrowthProvider, GrowthChannelType, TenantGrowthConfig } from '../../../types/tenant';
import { GrowthIntelligenceService } from '../../../services/GrowthIntelligenceService';
import { WhatsAppService } from '../../../services/whatsappService';
import { EmailService } from '../../../services/emailService';
import { SMSService } from '../../../services/smsService';
import { SocialService } from '../../../services/socialService';
import { StoreService } from '../../../services/storeService';

const SuperAdminGrowthConsole: React.FC = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<GlobalGrowthConfig | null>(null);
    const [providers, setProviders] = useState<GrowthProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'architecture' | 'tenants'>('architecture');
    const [tenants, setTenants] = useState<any[]>([]);

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

    const handleConfigureTenant = (tenant: any) => {
        navigate(`/growth/tenant-architect/${tenant.id}`);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded">Tenant Management</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Growth Fleet Console
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Manage entitlements, connections, and compliance for all tenant instances.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tenant Registry</h2>
                        <p className="text-sm text-slate-500 mt-1">Select a tenant to configure architecture and routes</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
                        {tenants.length} Active Tenants
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Growth Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Enabled Channels</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage Health</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {tenant.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">{tenant.name}</p>
                                                <p className="text-xs text-slate-500">ID: {tenant.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${tenant.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : tenant.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                            {tenant.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {tenant.enabledChannels.map((c: any) => (
                                                <span key={c} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-medium uppercase border border-slate-200 dark:border-slate-700">
                                                    {c}
                                                </span>
                                            ))}
                                            {tenant.enabledChannels.length === 0 && <span className="text-xs text-slate-400 italic">None Enabled</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${tenant.health > 80 ? 'bg-emerald-500' : tenant.health > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${tenant.health}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">{tenant.health}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleConfigureTenant(tenant)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                            title="Configure Tenant"
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

            {/* Tenant Architect Modal */}

        </div>
    );
};

export default SuperAdminGrowthConsole;
