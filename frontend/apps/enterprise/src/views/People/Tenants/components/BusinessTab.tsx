import React from 'react';
import { ModuleType, Sector } from "@repo/shared";

interface BusinessTabProps {
    formData: any;
    updateField: (field: string, value: any) => void;
    // or passing setFormData
    setNewTenant: React.Dispatch<React.SetStateAction<any>>;
    newTenant: any;
}

export const BusinessTab: React.FC<{ newTenant: any, setNewTenant: any }> = ({ newTenant, setNewTenant }) => {
    return (
        <div className="space-y-5 animate-in slide-in-from-left-4 duration-300">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <input
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newTenant.name}
                        onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                        placeholder="e.g. Acme Corp"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain</label>
                    <div className="flex">
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.subdomain}
                            onChange={e => {
                                const val = e.target.value;
                                setNewTenant((prev: any) => {
                                    let domain = prev.domain;
                                    if (val && !domain) {
                                        const exts = ['.com', '.io', '.net', '.biz', '.org', '.co'];
                                        domain = val + exts[Math.floor(Math.random() * exts.length)];
                                    }
                                    return { ...prev, subdomain: val, domain };
                                });
                            }}
                            placeholder="acme"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Public Domain</label>
                    <input
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newTenant.domain}
                        onChange={e => setNewTenant({ ...newTenant, domain: e.target.value })}
                        placeholder="e.g. acme.com"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Business / Trade Type</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.businessType}
                            onChange={e => setNewTenant({ ...newTenant, businessType: e.target.value })}
                            placeholder="e.g. Supermarket"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nature of Business</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={newTenant.natureOfBusiness}
                            onChange={e => setNewTenant({ ...newTenant, natureOfBusiness: e.target.value })}
                        >
                            <option value="">Select Type</option>
                            <option value="Retail">Retail</option>
                            <option value="Wholesale">Wholesale</option>
                            <option value="Services">Services</option>
                            <option value="Manufacturing">Manufacturing</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={newTenant.sector}
                            onChange={e => setNewTenant({ ...newTenant, sector: e.target.value as Sector })}
                        >
                            {(Object.values(Sector) as string[]).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trade Description</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.tradeDescription}
                            onChange={e => setNewTenant({ ...newTenant, tradeDescription: e.target.value })}
                            placeholder="Optional description"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

