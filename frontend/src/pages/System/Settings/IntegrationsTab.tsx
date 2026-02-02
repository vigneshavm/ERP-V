import React, { useState } from 'react';
import { Shield, Zap, CheckCircle, Smartphone, AlertTriangle, Link as LinkIcon, Globe, MessageSquare, ExternalLink } from 'lucide-react';

import { WhatsAppService } from "../../../services/WhatsAppService";

const IntegrationsTab: React.FC = () => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [integrations, setIntegrations] = useState({
        whatsapp: { enabled: true, status: 'connected', quality: 'High', phone: '+91 98765 43210' },
        email: { enabled: true, status: 'active', smtp: 'smtp.bizzai.com' },
        sms: { enabled: false, status: 'disconnected' },
        payment: { enabled: true, status: 'live', provider: 'Razorpay' }
    });

    // Configuration State (from v2)
    const [config, setConfig] = useState({
        accessToken: '',
        phoneId: '',
        accountId: ''
    });

    const [testStatus, setTestStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

    const handleTestConnection = async () => {
        setIsVerifying(true);
        const result = await WhatsAppService.verifyConnection({
            whatsappAccessToken: config.accessToken,
            whatsappPhoneNumberId: config.phoneId,
            whatsappBusinessAccountId: config.accountId
        });
        setTestStatus(result.success ? 'SUCCESS' : 'ERROR');
        setIsVerifying(false);
    };

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
                            {/* Configuration Form */}
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-4 mb-6">
                                    <Smartphone className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">WhatsApp Cloud API (Sandbox)</p>
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                                            Setup credentials from <span className="font-bold underline">Meta for Developers</span>.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Access Token</label>
                                    <input
                                        type="password"
                                        value={config.accessToken}
                                        onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                        placeholder="EAAG..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number ID</label>
                                    <input
                                        type="text"
                                        value={config.phoneId}
                                        onChange={e => setConfig({ ...config, phoneId: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                        placeholder="1098..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Business Account ID</label>
                                    <input
                                        type="text"
                                        value={config.accountId}
                                        onChange={e => setConfig({ ...config, accountId: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                        placeholder="1155..."
                                    />
                                </div>

                                <button
                                    onClick={handleTestConnection}
                                    disabled={isVerifying}
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        'VERIFYING...'
                                    ) : testStatus === 'SUCCESS' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-emerald-300" /> CONNECTION VERIFIED
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4" /> TEST CONNECTION
                                        </>
                                    )}
                                </button>

                                {testStatus === 'ERROR' && (
                                    <p className="text-xs text-red-500 font-bold flex items-center justify-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Connection failed. Check your token.
                                    </p>
                                )}
                            </div>

                            {/* Sandbox Checklist */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-xs uppercase tracking-wider">Sandbox Checklist</h4>
                                <ul className="space-y-3">
                                    {[
                                        "Create Meta App (Business Type)",
                                        "Add 'WhatsApp' Product",
                                        "Copy Temporary Access Token",
                                        "Add Phone Number to Sandbox",
                                        "Verify OTP"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black shrink-0">{i + 1}</div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
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

const MailIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const IntegrationCard = ({ icon, title, provider, status, color }: { icon: React.ReactNode, title: string, provider: string, status: string, color: string }) => (
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
