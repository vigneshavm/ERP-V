import React from 'react';

export const CompanyTab: React.FC<{ newTenant: any, setNewTenant: any }> = ({ newTenant, setNewTenant }) => {
    return (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Address & Contact Details</label>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Address</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                            value={newTenant.companyDetails.addressLine1}
                            onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, addressLine1: e.target.value } })}
                            placeholder="Line 1: Building, Street"
                        />
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.companyDetails.addressLine2}
                            onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, addressLine2: e.target.value } })}
                            placeholder="Line 2: Area, Landmark (Optional)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.companyDetails.city}
                            onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, city: e.target.value } })}
                            placeholder="City"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State & Code</label>
                        <div className="flex gap-2">
                            <input
                                className="w-2/3 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newTenant.companyDetails.state}
                                onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, state: e.target.value } })}
                                placeholder="State"
                            />
                            <input
                                className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newTenant.companyDetails.stateCode}
                                onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, stateCode: e.target.value } })}
                                placeholder="Code"
                                maxLength={2}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-100"
                            value={newTenant.companyDetails.country}
                            readOnly
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.companyDetails.pincode}
                            onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, pincode: e.target.value } })}
                            placeholder="123456"
                            maxLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.companyDetails.email}
                            onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, email: e.target.value } })}
                            placeholder="admin@company.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.companyDetails.phone}
                            onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, phone: e.target.value } })}
                            placeholder="+91 99999 99999"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Alternate Phone</label>
                        <input
                            type="tel"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.companyDetails.alternatePhone}
                            onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, alternatePhone: e.target.value } })}
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                        <input
                            type="url"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTenant.companyDetails.website}
                            onChange={e => setNewTenant({ ...newTenant, companyDetails: { ...newTenant.companyDetails, website: e.target.value } })}
                            placeholder="https://company.com"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
