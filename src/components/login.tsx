
import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setUser } from '../store';
import { Store, Lock, ArrowRight, AlertCircle, UserCircle } from 'lucide-react';


import { Sector } from '../types/common';
import { Tenant } from '../types/tenant';
import { comparePassword, securePassword, isSecuredIdeally } from '../utils/auth';
import { supabase } from '../lib/supabase';

const SECTOR_IMAGES: Record<string, string> = {
    [Sector.GENERAL]: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
    [Sector.PHARMACY]: 'https://images.unsplash.com/photo-1576602976047-174e57a4362f?q=80&w=2070&auto=format&fit=crop',
    [Sector.ELECTRONICS]: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2076&auto=format&fit=crop',
    [Sector.GROCERY]: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2048&auto=format&fit=crop',
    [Sector.SUPERMARKET]: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2048&auto=format&fit=crop',
    [Sector.TEXTILE]: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2044&auto=format&fit=crop',
    [Sector.MOBILE_SHOP]: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2040&auto=format&fit=crop'
};

const DEFAULT_BRANDING = {
    LOGO: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?q=80&w=200&h=200&auto=format&fit=crop', // Abstract elegant logo-like
    BACKGROUND: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop' // Modern office architecture
};

interface LoginProps {
    onLogin: () => void;
    tenant: Tenant | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, tenant }) => {
    const tenantName = tenant?.name || 'Retail Store';
    const tenantId = tenant?.id;
    const allowedSector = tenant?.sector || Sector.GENERAL;

    const dispatch = useDispatch();
    const { employees } = useSelector((state: RootState) => state.labor);

    const [identity, setIdentity] = useState<string>('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [logoError, setLogoError] = useState(false);
    const [bgError, setBgError] = useState(false);

    const backgroundImage = (!bgError && tenant?.loginBgUrl) || SECTOR_IMAGES[allowedSector] || DEFAULT_BRANDING.BACKGROUND;

    const sortedEmployees = useMemo(() => {
        const relevantEmployees = employees.filter(e =>
            e.tenantId === tenantId && (e.systemRole === 'Owner' || e.sector === allowedSector)
        );

        const roleOrder = { 'Owner': 0, 'Manager': 1, 'Staff': 2 };
        return [...relevantEmployees].sort((a, b) => {
            const roleDiff = (roleOrder[a.systemRole] || 2) - (roleOrder[b.systemRole] || 2);
            if (roleDiff !== 0) return roleDiff;
            return a.name.localeCompare(b.name);
        });
    }, [employees, allowedSector, tenantId]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Helper to normalize phone numbers (remove all non-digits)
        const normalizePhone = (phone: string | undefined): string => {
            if (!phone) return '';
            return phone.replace(/\D/g, '');
        };

        const cleanIdentity = identity.trim();
        const cleanIdentityPhone = normalizePhone(cleanIdentity);




        const checkUser = async () => {
            const user = employees.find(e =>
                e.tenantId === tenantId &&
                (
                    e.name.toLowerCase() === cleanIdentity.toLowerCase() ||
                    e.id === cleanIdentity ||
                    (normalizePhone(e.phoneNumber) === cleanIdentityPhone && cleanIdentityPhone.length >= 10)
                )
            );

            if (!user) {
                console.warn(`[Login Failed] No user found for identity: "${cleanIdentity}" in tenant: ${tenantId}`);
                setError("Please select a valid user.");
                return;
            }

            // --- Database Synchronization Layer ---
            // Fetch the absolutely latest record from Supabase to ensure we aren't using stale Redux state
            // This satisfies the requirement to "check their record in the employee table" during login.
            let freshUser = { ...user };
            if (supabase) {
                try {
                    const { data: dbUser, error: dbError } = await supabase
                        .from('employees')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (dbUser && !dbError) {
                        freshUser = { ...freshUser, ...dbUser };
                        // Ensure we map snake_case from DB to camelCase if needed, 
                        // but usually our Supabase client types might match or we rely on the `pin` field which is `pin`.
                        // Note: Our Redux logic maps snake_case keys usually? 
                        // If DB returns `daily_rate`, Redux might expect `dailyRate`. 
                        // But for `pin`, it's just `pin`. 
                        // We primarily care about the PIN here.
                        freshUser.pin = dbUser.pin;
                    }
                } catch (err) {
                    console.warn("Failed to sync with DB, falling back to local state.", err);
                }
            }

            let loginSuccess = false;
            let needsMigration = false;

            // 1. Try secure comparison (Primary) using FRESH PIN
            // comparePassword handles Encrypted, Hashed, AND Plain text (fallback)
            const isMatch = await comparePassword(pin, freshUser.pin);

            if (isMatch) {
                loginSuccess = true;
                // Check if migration is needed based on FRESH PIN
                // This covers the case where comparePassword matched a plain text PIN
                if (!isSecuredIdeally(freshUser.pin)) {
                    needsMigration = true;
                }
            }

            if (loginSuccess) {
                // --- Auto-Migration Check & Action ---
                // We check if the stored PIN matches the *current* ideal format (Hash or Encrypt).
                // If not, we migrate it AND force a re-login to verify the new credential works.
                if (needsMigration) {
                    console.log(`[Migration] Migrating user ${user.id} to secure storage (Configured Mode)...`);
                    try {
                        const newSecuredPin = await securePassword(pin);
                        // Update Supabase
                        if (supabase) {
                            const { error: updateError } = await supabase
                                .from('employees')
                                .update({ pin: newSecuredPin })
                                .eq('id', user.id);

                            if (updateError) {
                                console.error("Failed to migrate user PIN:", updateError);
                                // If migration failed, we probably still want to let them login or show error?
                                // Let's show error to be safe.
                                setError("Security update failed. Please try again.");
                                return;
                            } else {
                                console.log("User PIN migrated successfully to secure storage.");
                                // FORCE RE-LOGIN
                                setError("Security update applied successfully. Please log in again with your PIN to verify.");
                                setPin('');
                                return; // Stop login process
                            }
                        }
                    } catch (migErr) {
                        console.error("Migration exception:", migErr);
                        setError("Security update error. Please contact admin.");
                        return;
                    }
                }

                // --- Standard Login Flow (Only if no migration needed or it was already secure) ---
                const sessionUser = { ...user };

                // --- Auto-Heal Stale Branch IDs ---
                if (sessionUser.branchId) {
                    const allTenantBranches = (tenant?.locations || []).flatMap(loc => loc.branches || []);
                    const branchExists = allTenantBranches.some(b => b.id === sessionUser.branchId);

                    if (!branchExists) {
                        console.warn(`[Login] Detected stale branchId ${sessionUser.branchId} for user ${sessionUser.name}. Removing it from session.`);
                        sessionUser.branchId = '';
                    }
                }

                if (user.systemRole === 'Owner' && allowedSector) {
                    sessionUser.sector = allowedSector;
                }

                localStorage.setItem('erp_auth_user', JSON.stringify(sessionUser));
                dispatch(setUser(sessionUser));
                onLogin();
            } else {
                setError("Invalid PIN.");
                setPin('');
            }
        };

        checkUser();
    };


    return (
        <div className="h-screen relative flex items-center justify-start p-4 md:p-12 overflow-hidden bg-slate-900">
            {/* Background Layer with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-transform transition-transform duration-1000 scale-105"
                style={{ backgroundImage: `url('${backgroundImage}')` }}
                onTransitionEnd={() => { }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
                <img
                    src={tenant?.loginBgUrl}
                    className="hidden"
                    onError={() => setBgError(true)}
                    alt=""
                />
            </div>

            {/* Premium Login Card */}
            <div className="relative z-10 w-full max-w-lg animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-8">
                    <div className="mb-6 text-left">
                        <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20 group transform hover:rotate-6 transition-transform overflow-hidden relative">
                            {(!logoError && tenant?.loginLogoUrl) ? (
                                <img
                                    src={tenant.loginLogoUrl}
                                    alt={tenantName}
                                    className="w-full h-full object-cover"
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <Store className="w-10 h-10 text-white mb-0.5" />
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">POS</span>
                                </div>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight group">
                            {tenantName}
                            <span className="block h-1 w-10 bg-indigo-500 mt-1.5 rounded-full transition-all group-hover:w-16" />
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Identity Retrieval</label>
                            <div className="relative group">
                                <UserCircle className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-indigo-400" />
                                <input
                                    type="text"
                                    value={identity}
                                    onChange={(e) => setIdentity(e.target.value)}
                                    placeholder="Name or Phone Number"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white font-semibold transition-all hover:bg-white/10 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Credential</label>
                            <div className="relative group">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-indigo-400" />
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="Enter Secure PIN"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder:text-slate-600 font-mono tracking-widest text-base transition-all hover:bg-white/10"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <div className={`flex items-center gap-2 text-xs font-bold p-3 rounded-xl animate-in zoom-in-95 ${error.includes('Security update applied') ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                                {error.includes('Security update applied') ? <Lock className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />} {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50"
                        >
                            Log In to Terminal <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                </div>
            </div>

            {/* Aesthetic Sidebar Accents */}
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-emerald-500/10 blur-[100px] rounded-full animate-pulse delay-1000" />
            </div>
        </div>
    );
};


export default Login;
