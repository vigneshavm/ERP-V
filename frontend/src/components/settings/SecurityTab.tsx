import React, { useMemo, useState } from 'react';
import { Shield, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { isSecuredIdeally, securePassword } from '../../utils/auth';
import { supabase } from '../../lib/supabase';
import { Role } from '../../types/tenant';
import { AppView } from '../../types/common';

interface SecurityTabProps {
    roles: Role[];
    permissions: { [key: string]: AppView[] };
    handlePermissionToggle: (roleCode: string, view: AppView) => void;
}

const PERMISSION_VIEWS: { id: AppView, label: string }[] = [
    { id: 'DASHBOARD', label: 'Dashboard' },
    { id: 'PROFIT_PULSE', label: 'Profit Pulse AI' },
    { id: 'POS', label: 'Point of Sale' },
    { id: 'INVENTORY', label: 'Inventory' },
    { id: 'PURCHASE', label: 'Purchases' },
    { id: 'FINANCE', label: 'Finance & P&L' },
    { id: 'SALES', label: 'Sales History' },
    { id: 'DAILY', label: 'Daily Tracker' },
    { id: 'LABOR', label: 'Labor Mgmt' },
    { id: 'STOREFRONT', label: 'Storefront' },
    { id: 'SETTINGS', label: 'Settings' },
    { id: 'VENDORS', label: 'Suppliers' },
    { id: 'VENDOR_FORM', label: 'Add/Edit Supplier' },
    { id: 'VENDOR_DETAILS', label: 'Supplier Details' },
];

const SecurityTab: React.FC<SecurityTabProps> = ({ roles, permissions, handlePermissionToggle }) => {
    const { employees } = useSelector((state: RootState) => state.labor);
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState({ total: 0, done: 0 });

    const insecureUsers = useMemo(() => {
        return employees.filter(e => e.pin && !isSecuredIdeally(e.pin));
    }, [employees]);

    const handleMigrateAll = async () => {
        if (!confirm(`Are you sure you want to secure ${insecureUsers.length} passwords? This operation cannot be undone.`)) return;
        setIsMigrating(true);
        setProgress({ total: insecureUsers.length, done: 0 });
        let successCount = 0;
        for (const user of insecureUsers) {
            try {
                const secured = await securePassword(user.pin);
                const { error } = await supabase.from('tenant_users').update({ pin_hash: secured, password_hash: secured }).eq('id', user.id);
                if (!error) successCount++;
            } catch (err) { console.error(err); }
            setProgress(prev => ({ ...prev, done: prev.done + 1 }));
        }
        alert(`Migration Complete.\nSecured: ${successCount}\nSkipped: ${insecureUsers.length - successCount}`);
        setIsMigrating(false);
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-500" /> Password Security
                </h3>
                {insecureUsers.length === 0 ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 shrink-0" />
                        <div>
                            <p className="font-bold text-sm">System Secure</p>
                            <p className="text-xs opacity-80">All user passwords are hashed and secured.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-100 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <Shield className="w-6 h-6 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm">Security Action Required</p>
                                <p className="text-xs mt-1 mb-3 opacity-90">Found {insecureUsers.length} users with legacy insecure passwords.</p>
                                <button onClick={handleMigrateAll} disabled={isMigrating} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                                    {isMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    {isMigrating ? `Securing ${progress.done}/${progress.total}...` : 'Secure All Passwords Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-500" /> Role Permissions
                </h3>
                <div className="space-y-6">
                    {roles.filter(r => r.code !== 'owner').map(role => (
                        <div key={role.id} className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{role.description || role.code}</h4>
                            <div className="flex flex-wrap gap-2">
                                {PERMISSION_VIEWS.map(view => {
                                    const isAllowed = (permissions[role.code] || []).includes(view.id);
                                    return (
                                        <button
                                            key={view.id}
                                            onClick={() => handlePermissionToggle(role.code, view.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isAllowed ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}
                                        >
                                            {view.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SecurityTab;
