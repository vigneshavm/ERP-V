import React, { useState } from 'react';
import { 
    Shield, Zap, AlertTriangle, 
    Globe, MessageSquare, ExternalLink,
    Activity, ShieldCheck, Mail, Loader2
} from 'lucide-react';

import { WhatsAppService } from "@/shared/api/whatsappService";

const IntegrationsTab: React.FC = () => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [integrations] = useState({
        whatsapp: { enabled: true, status: 'connected', quality: 'High', phone: '+91 98765 43210' },
        email: { enabled: true, status: 'active', smtp: 'smtp.bizzai.com' },
        sms: { enabled: false, status: 'disconnected' },
        payment: { enabled: true, status: 'live', provider: 'Razorpay' }
    });

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
        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Ecosystem Connectivity HUD */}
            <div className="grid md:grid-cols-4 gap-6">
                {Object.entries(integrations).map(([key, data]) => (
                    <div key={key} className="group p-6 rounded-[2rem] bg-white dark:bg-slate-950 border border-default dark:border-default shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{key} ARCHWAY</span>
                            <div className={`w-2.5 h-2.5 rounded-full ${data.enabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`} />
                        </div>
                        <p className={`text-xl font-black italic uppercase tracking-tighter ${data.enabled ? 'text-main' : 'text-muted'}`}>
                            {data.status}
                        </p>
                    </div>
                ))}
            </div>

            {/* WhatsApp Business API Section */}
            <section>
                <div className="bg-[var(--erp-bg)] rounded-[3rem] p-10 border border-default shadow-2xl relative overflow-hidden group mb-8">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                        <MessageSquare className="w-64 h-64 text-green-500" />
                    </div>
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                      <div className="flex items-center gap-8">
                          <div className="w-20 h-20 rounded-[2rem] bg-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30 group-hover:rotate-6 transition-transform">
                              <MessageSquare className="w-10 h-10 text-main" />
                          </div>
                          <div>
                              <h3 className="text-3xl font-black text-main italic uppercase tracking-tight mb-2">Message <span className="text-green-400">Broadcasting</span></h3>
                              <p className="text-muted font-medium text-lg max-w-xl">Meta Cloud API integration for automated transactional intelligence.</p>
                          </div>
                      </div>
                      <div className="px-6 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[10px] font-black tracking-widest flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          UPSTREAM SYNCED
                      </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Configuration Vault */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                        <div className="bg-white dark:bg-slate-950 border border-default dark:border-default rounded-[2.5rem] p-8 shadow-sm">
                            <h4 className="text-xs font-black text-muted uppercase tracking-[0.2em] mb-8 px-2">Credential Vault</h4>
                            
                            <div className="space-y-6">
                                <div className="space-y-2 px-2">
                                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest">Bearer Access Token</label>
                                    <input
                                        type="password"
                                        value={config.accessToken}
                                        onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                                        className="w-full px-6 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border border-default dark:border-default rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 font-bold transition-all shadow-inner"
                                        placeholder="META_ARCH_TOKEN_0x..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 px-2">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-muted uppercase tracking-widest">Phone Node ID</label>
                                        <input
                                            type="text"
                                            value={config.phoneId}
                                            onChange={e => setConfig({ ...config, phoneId: e.target.value })}
                                            className="w-full px-4 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border border-default dark:border-default rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 font-bold transition-all shadow-inner"
                                            placeholder="NODE_248"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-muted uppercase tracking-widest">Domain ID</label>
                                        <input
                                            type="text"
                                            value={config.accountId}
                                            onChange={e => setConfig({ ...config, accountId: e.target.value })}
                                            className="w-full px-4 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border border-default dark:border-default rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 font-bold transition-all shadow-inner"
                                            placeholder="DOMAIN_911"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleTestConnection}
                                    disabled={isVerifying}
                                    className="flex items-center justify-center gap-3 w-full py-5 bg-[var(--erp-bg)] hover:bg-[var(--erp-card)] text-main rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : testStatus === 'SUCCESS' ? (
                                        <>
                                            <ShieldCheck className="w-5 h-5 text-emerald-400" /> SYNC VERIFIED
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" /> TEST CONNECTIVITY
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Security Advisory */}
                        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex items-start gap-4">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-1" />
                            <p className="text-[11px] font-bold text-red-800 dark:text-red-400/80 leading-relaxed uppercase italic">
                                Credentials are encrypted using <span className="underline decoration-red-500/30">AES-256 Protocol</span>. Do not expose tokens in public logs.
                            </p>
                        </div>
                    </div>

                    {/* Operational Traffic Console */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                        <div className="bg-slate-950 p-1 rounded-[2.5rem] border border-slate-900 shadow-2xl">
                            <div className="bg-[var(--erp-bg)] rounded-[2.25rem] overflow-hidden">
                                <div className="p-8 border-b border-default flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <h5 className="text-[10px] font-black text-muted uppercase tracking-widest">Hook Traffic Console</h5>
                                    </div>
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="p-8 h-[360px] overflow-y-auto font-mono text-[11px] space-y-4">
                                    <div className="flex gap-4">
                                        <span className="text-secondary">[13:42:01]</span>
                                        <span className="text-emerald-400 font-bold">INFO:</span>
                                        <span className="text-muted">Meta Webhook Handshake successfully negotiated.</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-secondary">[13:42:04]</span>
                                        <span className="text-indigo-400 font-bold">EVENT:</span>
                                        <span className="text-muted">Auto-Invoicing Node triggered for Invoice #829.</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-secondary">[13:42:08]</span>
                                        <span className="text-amber-400 font-bold">WARN:</span>
                                        <span className="text-muted">Rate limit proximity detected (82% usage).</span>
                                    </div>
                                    <div className="flex gap-4 opacity-50">
                                        <span className="text-secondary">[13:42:15]</span>
                                        <span className="text-muted font-bold">DEBUG:</span>
                                        <span className="text-muted">DNS localized to IN-WEST-1 (14ms).</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-secondary">[13:45:22]</span>
                                        <span className="text-emerald-400 font-bold">INFO:</span>
                                        <span className="text-muted">Batch reconcile for Payment ID: 0x242... SUCCESS.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integration Meta-Controllers */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-8 bg-white dark:bg-slate-950 border border-default dark:border-default rounded-[2rem] flex items-center justify-between group cursor-pointer hover:border-indigo-500 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-black text-main uppercase italic">Payment Archway</h5>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Stripe / Razorpay 0x2</p>
                                    </div>
                                </div>
                                <ExternalLink className="w-5 h-5 text-muted group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <div className="p-8 bg-white dark:bg-slate-950 border border-default dark:border-default rounded-[2rem] flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-black text-main uppercase italic">Transactional Mail</h5>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">SendGrid Protocol</p>
                                    </div>
                                </div>
                                <ExternalLink className="w-5 h-5 text-muted group-hover:text-emerald-600 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default IntegrationsTab;
