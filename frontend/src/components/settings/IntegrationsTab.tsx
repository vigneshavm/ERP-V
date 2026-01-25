import React, { useState } from 'react';
import { Shield, Zap, CheckCircle, Smartphone, AlertTriangle } from 'lucide-react';
import { WhatsAppService } from '../../services/whatsappService';

const IntegrationsTab: React.FC = () => {
    // In a real app, these should be synced with Redux/DB
    const [config, setConfig] = useState({
        accessToken: '',
        phoneId: '',
        accountId: ''
    });

    const [testStatus, setTestStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

    const handleTestConnection = async () => {
        const result = await WhatsAppService.verifyConnection({
            whatsappAccessToken: config.accessToken,
            whatsappPhoneNumberId: config.phoneId,
            whatsappBusinessAccountId: config.accountId
        });
        setTestStatus(result.success ? 'SUCCESS' : 'ERROR');
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-4">
                <Smartphone className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">WhatsApp Cloud API (Sandbox Mode)</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Get these credentials from <a href="https://developers.facebook.com" target="_blank" className="underline font-bold">Meta for Developers</a> {'>'} App {'>'} WhatsApp {'>'} API Setup.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Temporary Access Token</label>
                        <input
                            type="password"
                            value={config.accessToken}
                            onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="EAAG..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number ID</label>
                        <input
                            type="text"
                            value={config.phoneId}
                            onChange={e => setConfig({ ...config, phoneId: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="1098..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">WhatsApp Business Account ID</label>
                        <input
                            type="text"
                            value={config.accountId}
                            onChange={e => setConfig({ ...config, accountId: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="1155..."
                        />
                    </div>

                    <button
                        onClick={handleTestConnection}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                    >
                        {testStatus === 'SUCCESS' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Zap className="w-4 h-4" />}
                        {testStatus === 'SUCCESS' ? 'Connection Verified' : 'Test Connection'}
                    </button>

                    {testStatus === 'ERROR' && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Connection failed. Check your token.
                        </p>
                    )}
                </div>

                {/* Integration Guide / Helper */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Sandbox Checklist</h4>
                    <ul className="space-y-3">
                        {[
                            "Create Meta App (Business Type)",
                            "Add 'WhatsApp' Product",
                            "Copy Temporary Access Token (Expires in 24h)",
                            "Add YOUR phone number to Sandbox list in Meta Dashboard",
                            "Verify OTP on your phone"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-xs text-slate-500">
                                <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsTab;
