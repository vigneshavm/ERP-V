import React, { useState } from 'react';
import { Shield, Zap, CheckCircle, Smartphone, AlertTriangle, Link as LinkIcon, Globe, MessageSquare, ExternalLink } from 'lucide-react';

const WhatsAppService = {
    verifyConnection: async () => ({ success: true })
};

const IntegrationsTab = () => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [integrations, setIntegrations] = useState({
        whatsapp: { enabled: true, status: 'connected', quality: 'High', phone: '+91 98765 43210' },
        email: { enabled: true, status: 'active', smtp: 'smtp.bizzai.com' },
        sms: { enabled: false, status: 'disconnected' },
        payment: { enabled: true, status: 'live', provider: 'Razorpay' }
    });

    return (
        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Active Integrations Summary */}
            <div className="grid md:grid-cols-4 gap-6">
                {Object.entries(integrations).map(([key, data]) => (
                    <div key={key} className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                            <div className={`w-2 h-2 rounded-full ${data.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>
                        <p className={`text-sm font-black capitalize ${data.enabled ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                            {data.status}
                        </p>
                    </div>
                ))}
            </div>

            {/* WhatsApp Business API Section */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">WhatsApp Business API</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">Official Meta cloud integration for automation</p>
                        </div>
                    </div>
                    <div className="px-4 py-1.5 bg-green-500 text-white rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 shadow-lg shadow-green-200 dark:shadow-none">
                        <CheckCircle className="w-3.5 h-3.5" /> CONNECTED
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-1 space-y-8">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Smartphone className="w-24 h-24" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Linked Terminal</p>
                                <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-2">{integrations.whatsapp.phone}</h4>
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black tracking-wide">VERIFIED CLOUD API</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    disabled={isVerifying}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] text-xs font-black tracking-widest transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50"
                                >
                                    {isVerifying ? 'STABILIZING CONNECTION...' : 'REFRESH API TOKEN'}
                                </button>
                                <button className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-500 rounded-[1.25rem] text-xs font-black tracking-widest hover:bg-red-50 transition-all">
                                    DISCONNECT SERVICE
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-8 content-start">
                            <div className="space-y-3">
                                <h5 className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                    <Zap className="w-4 h-4 text-amber-500" /> Automation Status
                                </h5>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Auto-send Invoices</p>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Payment Reminders</p>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h5 className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                    <Shield className="w-4 h-4 text-blue-500" /> Security & Logs
                                </h5>
                                <div className="p-6 bg-slate-900 text-slate-300 rounded-[1.5rem] font-mono text-[10px] space-y-2 border border-slate-800">
                                    <p className="text-emerald-400">[info] Webhook connected: ID_2943</p>
                                    <p>[info] Latency check: 12ms</p>
                                    <p className="text-amber-400">[warn] Rate limit remaining: 98%</p>
                                    <p className="opacity-50">[debug] Handshake localized (IN-SOUTH)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Other Integrations Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">External Ecosystem</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Connect your ERP with other enterprise tools</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <IntegrationCard
                        icon={<Globe className="w-5 h-5" />}
                        title="Payment Gateway"
                        provider="Razorpay / Stripe"
                        status="LIVE"
                        color="indigo"
                    />
                    <IntegrationCard
                        icon={<MailIcon className="w-5 h-5" />}
                        title="Transactional Email"
                        provider="SendGrid / AWS SES"
                        status="ACTIVE"
                        color="emerald"
                    />
                    <IntegrationCard
                        icon={<Smartphone className="w-5 h-5" />}
                        title="SMS Gateway"
                        provider="Twilio / Msg91"
                        status="OFFLINE"
                        color="slate"
                    />
                </div>
            </section>
        </div>
    );
};

const MailIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const IntegrationCard = ({ icon, title, provider, status, color }) => (
    <div className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-300 transition-all shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 flex items-center justify-center`}>
                {icon}
            </div>
            <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                <ExternalLink className="w-4 h-4" />
            </button>
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-white leading-none">{title}</h4>
        <p className="text-[10px] text-slate-400 font-bold mt-1 mb-4">{provider}</p>
        <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${status === 'LIVE' || status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {status}
        </div>
    </div>
);

export default IntegrationsTab;
