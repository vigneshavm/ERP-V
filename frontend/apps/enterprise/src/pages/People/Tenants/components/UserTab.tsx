import React from 'react';
import { UserCog } from 'lucide-react';

export const UserTab: React.FC<{ newTenant: any, setNewTenant: any }> = ({ newTenant, setNewTenant }) => {
    // Defensive fallback for adminUser
    const adminUser = newTenant.adminUser ?? { name: '', mobile: '', password: '' };

    return (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-[var(--erp-bg-sunken)] p-4 rounded-lg border border-default">
                <h3 className="text-sm font-bold text-main mb-3 flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-muted" />
                    Super Admin Provisioning
                </h3>
                <p className="text-xs text-muted mb-4">
                    Create the initial Super User for this tenant. This user will have full administrative access.
                </p>

                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Full Name</label>
                        <input
                            className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={adminUser.name}
                            onChange={e => setNewTenant({ ...newTenant, adminUser: { ...newTenant.adminUser, name: e.target.value } })}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Mobile Number (Login ID)</label>
                        <input
                            className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={adminUser.mobile}
                            onChange={e => setNewTenant({ ...newTenant, adminUser: { ...newTenant.adminUser, mobile: e.target.value } })}
                            placeholder="e.g. 9876543210"
                            maxLength={10}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Initial Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={adminUser.password}
                            onChange={e => setNewTenant({ ...newTenant, adminUser: { ...newTenant.adminUser, password: e.target.value } })}
                            placeholder="Create a strong password"
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Min 6 characters. Will be securely hashed/encrypted before storage.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Role</label>
                        <input
                            className="w-full px-3 py-2 border border-default rounded-lg text-sm bg-[var(--erp-bg-sunken)] text-muted cursor-not-allowed outline-none"
                            value="SUPER_USER"
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
