import React, { useMemo } from 'react';
import { Store, Globe, Phone, Mail, MapPin, Info, Users, ShieldCheck, Activity } from 'lucide-react';
import { GeneralTabProps } from './types';
import StaffManager from '../../People/Employees/LaborManager';

const GeneralTab: React.FC<GeneralTabProps> = ({
    appName, setAppName, businessType, setBusinessType,
    addressLine1, setAddressLine1, city, setCity, state, setState, pincode, setPincode,
    phone, setPhone, email, setEmail, website, setWebsite
}) => {
    // Calculate profile completeness
    const integrityScore = useMemo(() => {
        const fields = [appName, businessType, addressLine1, city, state, pincode, phone, email, website];
        const filled = fields.filter(f => !!f).length;
        return Math.round((filled / fields.length) * 100);
    }, [appName, businessType, addressLine1, city, state, pincode, phone, email, website]);

    return (
        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Profile Integrity HUD */}
            <section className="bg-slate-900 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="w-64 h-64 text-indigo-500" />
                </div>

                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover:scale-105 transition-transform shrink-0">
                    <Store className="w-12 h-12 text-white" />
                </div>

                <div className="relative z-10 flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                        <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black tracking-[0.2em] border border-indigo-500/20 uppercase">Core Identity Registry</span>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${integrityScore > 80 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {integrityScore}% COMPLETE
                        </div>
                    </div>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                        {appName || 'Acme Enterprise'}
                    </h3>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">
                        Your enterprise identity is the cryptographic seed for all official documentation. Keep it synchronized and verified.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-6 bg-slate-800/50 p-8 rounded-[2rem] border border-slate-700 shrink-0">
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="36" fill="none" stroke="#1e293b" strokeWidth="8" />
                            <circle 
                                cx="40" cy="40" r="36" fill="none" stroke="#6366f1" strokeWidth="8" 
                                strokeDasharray={226}
                                strokeDashoffset={226 - (226 * integrityScore) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Business Profile Details */}
                <section className="space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-800 dark:text-white italic uppercase tracking-tight">Organization Profile</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Global Metadata</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 h-full">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Enterprise Alias</label>
                                <input
                                    type="text"
                                    value={appName}
                                    onChange={e => setAppName(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner"
                                    placeholder="Legal Entity Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Business Sector</label>
                                <select
                                    value={businessType}
                                    onChange={e => setBusinessType(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner"
                                >
                                    <option value="Retail">Retail & General Trade</option>
                                    <option value="Wholesale">Wholesale & Distribution</option>
                                    <option value="Manufacturing">Manufacturing Domain</option>
                                    <option value="Services">Professional Services</option>
                                    <option value="Healthcare">Healthcare & Biotech</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Public Web Presence</label>
                                <div className="relative group">
                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                      type="url" 
                                      value={website} 
                                      onChange={e => setWebsite(e.target.value)} 
                                      className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner" 
                                      placeholder="www.nexus.io"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Support Protocol (Email)</label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                      type="email" 
                                      value={email} 
                                      onChange={e => setEmail(e.target.value)} 
                                      className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner" 
                                      placeholder="hq@nexus.io"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Logistics & Geo Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-800 dark:text-white italic uppercase tracking-tight">Geo-Spatial Locality</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Physical Infrastructure</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6 h-full">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Perimeter Address</label>
                            <input type="text" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner" placeholder="Primary HQ Location" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nexus City</label>
                                <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">State / Region</label>
                                <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Postal Seed (Pincode)</label>
                                <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Direct Comms (Phone)</label>
                                <div className="relative group">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all font-bold text-sm shadow-inner" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Critical Info Advisory */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-l-8 border-indigo-600 rounded-3xl flex items-start gap-8 shadow-sm">
                <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm shrink-0 mt-1">
                    <Info className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h5 className="text-[11px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-[0.3em] mb-2">Legal Compliance Verification</h5>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
                        Updating these identifiers will trigger a global recalculation across all active tax nodes. Ensure that the **Nexus City** and **GSTIN/PAN** pairing is verified against your regional regulatory clearance.
                    </p>
                </div>
            </div>

            {/* Workforce Management Overlap */}
            <section className="space-y-8">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                        <Users className="w-6 h-6 text-white dark:text-slate-900" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white italic uppercase tracking-tight">Agent Personnel</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Workforce Infrastructure</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500 opacity-20" />
                    <StaffManager />
                </div>
            </section>
        </div>
    );
};

export default GeneralTab;
