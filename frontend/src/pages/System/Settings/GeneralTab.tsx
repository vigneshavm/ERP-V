import React from 'react';
import { Store, Globe, Phone, Mail, MapPin, Info, Users } from 'lucide-react';
import { GeneralTabProps } from './types';

const GeneralTab: React.FC<GeneralTabProps> = ({
    appName, setAppName, businessType, setBusinessType,
    addressLine1, setAddressLine1, city, setCity, state, setState, pincode, setPincode,
    phone, setPhone, email, setEmail, website, setWebsite
}) => {
    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Business Identity Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-none">Business Identity</h3>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Core details about your organization</p>
                    </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Official App / Business Name</label>
                            <input
                                type="text"
                                value={appName}
                                onChange={e => setAppName(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm"
                                placeholder="e.g. Acme Enterprise"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Business Sector</label>
                            <select
                                value={businessType}
                                onChange={e => setBusinessType(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm"
                            >
                                <option value="Retail">Retail & General Trade</option>
                                <option value="Wholesale">Wholesale & Distribution</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Services">Professional Services</option>
                                <option value="Healthcare">Healthcare & Pharmacy</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Address & Presence Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-success" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-none">Registered Address</h3>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Primary location for official records</p>
                    </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Street / Building Address</label>
                            <input type="text" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">City</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">State</label>
                                <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Pincode</label>
                                <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Information Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-none">Contact Information</h3>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Official communication channels</p>
                    </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Primary Phone</label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" placeholder="+91 00000 00000" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Email Support</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" placeholder="support@acme.com" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Public Website</label>
                            <div className="relative">
                                <Globe className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" placeholder="www.acme.com" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Information Alert */}
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-primary/80 font-bold leading-relaxed">
                    These details will appear on your tax invoices, purchase orders, and official reports. Ensure that the GSTIN/PAN (if applicable) and Address match your registered documents.
                </p>
            </div>
        </div>
    );
};

export default GeneralTab;
