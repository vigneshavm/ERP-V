import React from 'react';
import { UserCog } from 'lucide-react';

export const UserTab: React.FC<{ newTenant: any, setNewTenant: any }> = ({ newTenant, setNewTenant }) => {
    // Defensive fallback for adminUser
    const adminUser = newTenant.adminUser ?? { name: '', mobile: '', password: '' };

    return (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-slate-400" />
                    Super Admin Provisioning
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                    Create the initial Super User for this tenant. This user will have full administrative access.
                </p>

                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={adminUser.name}
                            onChange={e => setNewTenant({ ...newTenant, adminUser: { ...newTenant.adminUser, name: e.target.value } })}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number (Login ID)</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={adminUser.mobile}
                            onChange={e => setNewTenant({ ...newTenant, adminUser: { ...newTenant.adminUser, mobile: e.target.value } })}
                            placeholder="e.g. 9876543210"
                            maxLength={10}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Initial Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={adminUser.password}
                            onChange={e => setNewTenant({ ...newTenant, adminUser: { ...newTenant.adminUser, password: e.target.value } })}
                            placeholder="Create a strong password"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            Min 6 characters. Will be securely hashed/encrypted before storage.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed outline-none"
                            value="SUPER_USER"
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
