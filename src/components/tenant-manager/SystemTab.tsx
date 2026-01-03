import React from 'react';
import { Settings, Check } from 'lucide-react';
import { ModuleType } from '../../types/common';

const AVAILABLE_MODULES: ModuleType[] = ['POS', 'INVENTORY', 'HR', 'FINANCE', 'ANALYTICS'];

export const SystemTab: React.FC<{ newTenant: any, setNewTenant: any, handleModuleToggle: (mod: ModuleType) => void }> = ({ newTenant, setNewTenant, handleModuleToggle }) => {
    return (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    System Configuration
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Module Toggles</label>
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                            {/* Additional specialized toggles */}
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-slate-700">POS (Point of Sale)</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={newTenant.systemConfig.isPosEnabled} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isPosEnabled: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-slate-700">Inventory Management</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={newTenant.systemConfig.isInventoryEnabled} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isInventoryEnabled: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-slate-700">Loyalty Program</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={newTenant.systemConfig.isLoyaltyEnabled} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isLoyaltyEnabled: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-slate-700">Multi-Branch Support</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={newTenant.systemConfig.isMultiBranch} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isMultiBranch: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-slate-700">E-Commerce Integration</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={newTenant.systemConfig.isEcommerceEnabled} onChange={e => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, isEcommerceEnabled: e.target.checked } })} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Pricing Configuration</label>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name="pricingMode"
                                    id="exclusive"
                                    checked={newTenant.systemConfig.pricingMode === 'EXCLUSIVE'}
                                    onChange={() => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, pricingMode: 'EXCLUSIVE' } })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="exclusive" className="text-sm text-slate-700">
                                    <span className="font-semibold block">Exclusive of Tax</span>
                                    <span className="text-xs text-slate-500">Prices are displayed excluding tax. Tax is added at checkout.</span>
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name="pricingMode"
                                    id="inclusive"
                                    checked={newTenant.systemConfig.pricingMode === 'INCLUSIVE'}
                                    onChange={() => setNewTenant({ ...newTenant, systemConfig: { ...newTenant.systemConfig, pricingMode: 'INCLUSIVE' } })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="inclusive" className="text-sm text-slate-700">
                                    <span className="font-semibold block">Inclusive of Tax</span>
                                    <span className="text-xs text-slate-500">Prices displayed include tax. Tax is reverse calculated.</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Primary Modules</label>
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
    );
};
