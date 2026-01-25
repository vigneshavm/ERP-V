import React from 'react';
import { Store, Users, Type } from 'lucide-react';
import StaffManager from '../StaffManager';

interface GeneralTabProps {
    appName: string;
    setAppName: (name: string) => void;
    businessType: string;
    setBusinessType: (type: string) => void;
    addressLine1: string;
    setAddressLine1: (val: string) => void;
    city: string;
    setCity: (val: string) => void;
    state: string;
    setState: (val: string) => void;
    pincode: string;
    setPincode: (val: string) => void;
    phone: string;
    setPhone: (val: string) => void;
    email: string;
    setEmail: (val: string) => void;
    website: string;
    setWebsite: (val: string) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
    appName, setAppName, businessType, setBusinessType,
    addressLine1, setAddressLine1, city, setCity, state, setState, pincode, setPincode,
    phone, setPhone, email, setEmail, website, setWebsite
}) => {
    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Store className="w-5 h-5 text-indigo-500" /> General Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tenant Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={appName}
                                onChange={e => setAppName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                placeholder="e.g. Acme Retail"
                            />
                            <Type className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Business Type / Sector</label>
                        <input
                            type="text"
                            value={businessType}
                            onChange={e => setBusinessType(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            placeholder="e.g. Retail, Healthcare, Manufacturing"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" /> Company Contact & Address
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Address Line 1</label>
                        <input type="text" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="Street, Building No." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City</label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">State / Province</label>
                        <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pincode / Zip</label>
                        <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Business Phone</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Official Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Website</label>
                        <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="https://..." />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" /> Staff Management
                </h3>
                <p className="text-sm text-slate-500 mb-4">Manage your workforce, create accounts, and assign branches.</p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <StaffManager />
                </div>
            </div>
        </div>
    );
};

export default GeneralTab;
