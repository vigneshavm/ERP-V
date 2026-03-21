import React from 'react';
import { Globe } from 'lucide-react';

export const IntegrationsTab: React.FC<{ newTenant: any, setNewTenant: any }> = ({ newTenant, setNewTenant }) => {
    // Defensive fallback for integrations
    const integrations = newTenant.integrations ?? {
        paymentGatewayKey: '', smsProviderKey: '', emailProviderKey: '', webhookUrl: ''
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-[var(--erp-bg-sunken)] p-4 rounded-lg border border-default">
                <h3 className="text-sm font-bold text-main mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted" />
                    Third-Party Integrations
                </h3>
                <p className="text-xs text-muted mb-4">
                    Configure external service connections for this tenant. Keys are stored securely.
                </p>

                <div className="space-y-4 max-w-lg">
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Payment Gateway API Key</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={integrations.paymentGatewayKey}
                            onChange={e => setNewTenant({ ...newTenant, integrations: { ...newTenant.integrations, paymentGatewayKey: e.target.value } })}
                            placeholder="Enter API Key"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">SMS Provider Key</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={integrations.smsProviderKey}
                            onChange={e => setNewTenant({ ...newTenant, integrations: { ...newTenant.integrations, smsProviderKey: e.target.value } })}
                            placeholder="Enter Provider Key"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Email Provider Key</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={integrations.emailProviderKey}
                            onChange={e => setNewTenant({ ...newTenant, integrations: { ...newTenant.integrations, emailProviderKey: e.target.value } })}
                            placeholder="Enter Provider Key"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Webhook URL</label>
                        <input
                            className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={integrations.webhookUrl}
                            onChange={e => setNewTenant({ ...newTenant, integrations: { ...newTenant.integrations, webhookUrl: e.target.value } })}
                            placeholder="https://api.external.com/webhook"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
