import React from 'react';
import { Settings, Check } from 'lucide-react';
import { ModuleType } from "@repo/shared";

const AVAILABLE_MODULES: ModuleType[] = ['POS', 'INVENTORY', 'HR', 'FINANCE', 'REPORTS', 'GROW'];

export const SystemTab: React.FC<{ newTenant: any, setNewTenant: any, handleModuleToggle: (mod: ModuleType) => void }> = ({ newTenant, setNewTenant, handleModuleToggle }) => {
    // Defensive fallback for systemConfig
    const systemConfig = newTenant.systemConfig ?? {
        isPosEnabled: true, isInventoryEnabled: true, isLoyaltyEnabled: false,
        isMultiBranch: false, isEcommerceEnabled: false, pricingMode: 'EXCLUSIVE'
    };

    return (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-[var(--erp-bg-sunken)] p-4 rounded-lg border border-default space-y-4">
                <h3 className="text-sm font-bold text-main mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted" />
                    System Configuration
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-secondary">Module Toggles</label>
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-default">
                            {/* Additional specialized toggles */}
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-secondary">POS (Point of Sale)</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={systemConfig.isPosEnabled} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isPosEnabled: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-secondary">Inventory Management</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={systemConfig.isInventoryEnabled} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isInventoryEnabled: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-secondary">Loyalty Program</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={systemConfig.isLoyaltyEnabled} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isLoyaltyEnabled: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-secondary">Multi-Branch Support</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={systemConfig.isMultiBranch} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isMultiBranch: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-secondary">E-Commerce Integration</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={systemConfig.isEcommerceEnabled} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isEcommerceEnabled: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-secondary">Pricing Configuration</label>
                        <div className="bg-white p-3 rounded-lg border border-default space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name="pricingMode"
                                    id="exclusive"
                                    checked={systemConfig.pricingMode === 'EXCLUSIVE'}
                                    onChange={() => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, pricingMode: 'EXCLUSIVE' } })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="exclusive" className="text-sm text-secondary">
                                    <span className="font-semibold block">Exclusive of Tax</span>
                                    <span className="text-xs text-muted">Prices are displayed excluding tax. Tax is added at checkout.</span>
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name="pricingMode"
                                    id="inclusive"
                                    checked={systemConfig.pricingMode === 'INCLUSIVE'}
                                    onChange={() => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, pricingMode: 'INCLUSIVE' } })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="inclusive" className="text-sm text-secondary">
                                    <span className="font-semibold block">Inclusive of Tax</span>
                                    <span className="text-xs text-muted">Prices displayed include tax. Tax is reverse calculated.</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary mb-2">Primary Modules</label>
                <div className="space-y-2">
                    {AVAILABLE_MODULES.map(mod => (
                        <label key={mod} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-[var(--erp-bg-sunken)] rounded-lg border border-transparent hover:border-default transition-all">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newTenant.modules.includes(mod) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                {newTenant.modules.includes(mod) && <Check className="w-3 h-3 text-main" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={newTenant.modules.includes(mod)}
                                onChange={() => handleModuleToggle(mod)}
                            />
                            <span className="text-sm text-secondary font-medium">{mod}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

