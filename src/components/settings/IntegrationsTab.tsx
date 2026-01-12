import React from 'react';
import { Globe, Shield, Zap, CheckCircle } from 'lucide-react';

const IntegrationsTab: React.FC = () => {
    const integrations = [
        { id: 'payment', name: 'Payment Gateway', provider: 'Razorpay / Stripe', status: 'CONNECTED', icon: Zap },
        { id: 'sms', name: 'SMS Service', provider: 'Twilio / MSG91', status: 'PENDING', icon: Globe },
        { id: 'whatsapp', name: 'WhatsApp API', provider: 'Interakt / Meta', status: 'CONNECTED', icon: Globe },
        { id: 'pos', name: 'External POS Sync', provider: 'Custom Webhook', status: 'NOT_CONFIGURED', icon: Shield },
    ];

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-start gap-4">
                <Shield className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">External Connectivity Hub</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Connect your ERP with third-party services. All API keys and secrets are encrypted at rest and never shared.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((integration) => {
                    const Icon = integration.icon;
                    return (
                        <div key={integration.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500/50 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${integration.status === 'CONNECTED' ? 'bg-green-100 text-green-600' :
                                        integration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {integration.status.replace('_', ' ')}
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{integration.name}</h4>
                            <p className="text-xs text-slate-500 mt-1">{integration.provider}</p>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Secret Key</label>
                                    <input type="password" value="************************" readOnly className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none" />
                                </div>
                                <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all">
                                    Configure Integration
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Active Webhooks
                </h4>
                <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <code className="text-[10px] font-bold text-slate-500">https://api.myapp.com/webhooks/sales-sync</code>
                        <span className="text-[10px] font-black text-green-600 uppercase">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsTab;
