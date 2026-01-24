import React from 'react';
import { Store, Globe, Phone, Mail, MapPin, Info } from 'lucide-react';

const GeneralTab = ({
    appName, setAppName, businessType, setBusinessType,
    addressLine1, setAddressLine1, city, setCity, state, setState, pincode, setPincode,
    phone, setPhone, email, setEmail, website, setWebsite
}) => {
    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Business Identity Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Business Identity</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Core details about your organization</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Official App / Business Name</label>
                        <input
                            type="text"
                            value={appName}
                            onChange={e => setAppName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all font-medium shadow-sm"
                            placeholder="e.g. Acme Enterprise"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Business Sector</label>
                        <select
                            value={businessType}
                            onChange={e => setBusinessType(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all font-medium shadow-sm"
                        >
                            <option value="Retail">Retail & General Trade</option>
                            <option value="Wholesale">Wholesale & Distribution</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Services">Professional Services</option>
                            <option value="Healthcare">Healthcare & Pharmacy</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Address & Presence Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Registered Address</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Primary location for official records</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Street / Building Address</label>
                            <input type="text" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">City</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">State</label>
                                <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Pincode</label>
                                <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Information Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Contact Information</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Official communication channels</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm group hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20">
                            <Phone className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Primary Phone</label>
                            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200" placeholder="+91 00000 00000" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm group hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20">
                            <Mail className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Email Support</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200" placeholder="support@acme.com" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm group hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20">
                            <Globe className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Public Website</label>
                            <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200" placeholder="www.acme.com" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Information Alert */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                    These details will appear on your tax invoices, purchase orders, and official reports. Ensure that the GSTIN/PAN (if applicable) and Address match your registered documents.
                </p>
            </div>
        </div>
    );
};

export default GeneralTab;
