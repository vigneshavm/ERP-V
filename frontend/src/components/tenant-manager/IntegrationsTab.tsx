import React from 'react';
import { Globe } from 'lucide-react';

export const IntegrationsTab: React.FC<{ newTenant: any, setNewTenant: any }> = ({ newTenant, setNewTenant }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    Third-Party Integrations
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                    Configure external service connections for this tenant. Keys are stored securely.
                </p>

                <div className="space-y-4 max-w-lg">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Payment Gateway API Key</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.integrations.paymentGatewayKey}
                            onChange={e => setNewTenant({ ...newTenant, integrations: { ...newTenant.integrations, paymentGatewayKey: e.target.value } })}
                            placeholder="Enter API Key"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">SMS Provider Key</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.integrations.smsProviderKey}
                            onChange={e => setNewTenant({ ...newTenant, integrations: { ...newTenant.integrations, smsProviderKey: e.target.value } })}
                            placeholder="Enter Provider Key"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Email Provider Key</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.integrations.emailProviderKey}
                            onChange={e => setNewTenant({ ...newTenant, integrations: { ...newTenant.integrations, emailProviderKey: e.target.value } })}
                            placeholder="Enter Provider Key"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Webhook URL</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.integrations.webhookUrl}
                            onChange={e => setNewTenant({ ...newTenant, integrations: { ...newTenant.integrations, webhookUrl: e.target.value } })}
                            placeholder="https://api.external.com/webhook"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
