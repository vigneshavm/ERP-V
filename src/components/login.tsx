
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../store';
import { Store, Lock, ArrowRight, ArrowLeft, AlertCircle, UserCircle, Eye, EyeOff, Loader2, Mail, CheckCircle2 } from 'lucide-react';


import { Sector, SystemRole } from '../types/common';
import { Tenant, TenantUser, DbRoleCode } from '../types/tenant';
import { setSession } from '../utils/session';
import { supabase } from '../lib/supabase';
import { securePassword } from '../utils/auth';
import { getTable, DATA_MODE } from '../services/dataSource';
import { demoDB } from '../data/demo';
import TenantSignUp from './TenantSignUp';

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
    const allowedSector = tenant?.sector || Sector.GENERAL;

    const dispatch = useDispatch();

    const [identity, setIdentity] = useState<string>('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [logoError, setLogoError] = useState(false);
    const [bgError, setBgError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpMethod, setOtpMethod] = useState<'email' | 'sms'>('email');
    const [tempUser, setTempUser] = useState<TenantUser | null>(null);
    const [resetSent, setResetSent] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [authView, setAuthView] = useState<'login' | 'forgot' | 'signup'>('login');

    const backgroundImage = (!bgError && tenant?.loginBgUrl) || SECTOR_IMAGES[allowedSector] || DEFAULT_BRANDING.BACKGROUND;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!tenant?.id) {
            setError("Tenant context missing.");
            setIsLoading(false);
            return;
        }

        const cleanIdentity = identity.trim();
        if (!cleanIdentity || !password) {
            setError("Please fill in all fields.");
            setIsLoading(false);
            return;
        }

        try {
            let sessionUser: TenantUser | null = null;
            let apiUser: any = null;

            if (DATA_MODE === 'DEMO') {
                // Demo Authentication Logic - Use getTable to include dynamic registrations
                const employees = await getTable('tenant_users');
                const demoUser = employees.find((e: any) =>
                    (e.email === cleanIdentity || e.id === cleanIdentity || e.mobile === cleanIdentity) &&
                    (e.password === password || password === 'demo123') && // Fallback for demo
                    e.tenant_id === tenant.id
                );

                if (!demoUser) {
                    setError("Invalid demo credentials.");
                    setIsLoading(false);
                    return;
                }

                apiUser = demoUser;
                const roleCode = demoUser.role_id?.toLowerCase();
                let systemRole: SystemRole = 'Staff';
                if (roleCode === 'admin') systemRole = 'Admin';
                else if (roleCode === 'owner') systemRole = 'Owner';
                else if (roleCode === 'manager') systemRole = 'Manager';

                sessionUser = {
                    id: demoUser.id,
                    tenantId: demoUser.tenant_id,
                    fullName: demoUser.full_name,
                    name: demoUser.full_name,
                    mobile: demoUser.mobile || '',
                    email: demoUser.email || '',
                    role: demoUser.role_id || 'Staff',
                    roleId: demoUser.role_id,
                    systemRole: systemRole,
                    sector: allowedSector,
                    branchId: demoUser.branch_id || ''
                };
            } else {
                // Real DB Authentication Logic
                if (!supabase) throw new Error("Supabase client not initialized.");

                const { data, error: rpcError } = await supabase
                    .rpc('login_tenant_user', {
                        p_tenant_id: tenant.id,
                        p_identity: cleanIdentity,
                        p_password: password
                    });

                if (rpcError) {
                    console.error("Login RPC Error:", rpcError);
                    setError("Authentication failed. " + rpcError.message);
                    setIsLoading(false);
                    return;
                }

                if (!data || !data.success || !data.user) {
                    setError(data?.message || "Invalid credentials.");
                    setIsLoading(false);
                    return;
                }

                apiUser = data.user;

                // Map role and create session object
                let systemRole: SystemRole = 'Staff';
                let displayRole = 'Staff';

                if (apiUser.role_id) {
                    const { data: roleData } = await supabase
                        .from('roles')
                        .select('code, description')
                        .eq('id', apiUser.role_id)
                        .single();

                    if (roleData) {
                        const code = roleData.code.toLowerCase();
                        if (code === DbRoleCode.OWNER) {
                            systemRole = 'Owner';
                        } else if (code === DbRoleCode.ADMIN) {
                            systemRole = 'Admin';
                        } else if (code === DbRoleCode.MANAGER) {
                            systemRole = 'Manager';
                        }
                        displayRole = roleData.description || code;
                    }
                }

                sessionUser = {
                    id: apiUser.id,
                    tenantId: apiUser.tenant_id,
                    fullName: apiUser.full_name,
                    name: apiUser.full_name,
                    mobile: apiUser.mobile,
                    email: apiUser.email,
                    role: displayRole,
                    roleId: apiUser.role_id,
                    systemRole: systemRole,
                    sector: allowedSector,
                    branchId: ''
                };
            }

            if (!sessionUser) throw new Error("Session resolution failed.");
            setTempUser(sessionUser);

            // 3. Conditional 2FA check (Per-User) - Skip for Demo
            if (DATA_MODE === 'DEMO' || !apiUser.is_2fa_enabled) {
                setSession(sessionUser, rememberMe);
                dispatch(setUser(sessionUser));
                onLogin();
                return;
            }

            if (sessionUser.email) {
                setOtpMethod('email');
                const { error: otpErr } = await supabase.auth.signInWithOtp({
                    email: sessionUser.email,
                    options: { shouldCreateUser: true }
                });
                if (otpErr) throw otpErr;
            } else if (sessionUser.mobile) {
                setOtpMethod('sms');
                // Normalize phone number to E.164 if it's just 10 digits (assume +91 for India as per context)
                let phoneNumber = sessionUser.mobile.trim();
                if (phoneNumber.length === 10 && /^\d+$/.test(phoneNumber)) {
                    phoneNumber = `+91${phoneNumber}`;
                } else if (!phoneNumber.startsWith('+')) {
                    phoneNumber = `+${phoneNumber}`;
                }

                const { error: otpErr } = await supabase.auth.signInWithOtp({
                    phone: phoneNumber,
                    options: { shouldCreateUser: true }
                });

                if (otpErr) {
                    if (otpErr.message.includes("Unsupported phone provider")) {
                        throw new Error("SMS OTP is not configured in Supabase. Please enable an SMS provider (Twilio/MessageBird) in Supabase Dashboard or provide an email address for the user.");
                    }
                    throw otpErr;
                }
            } else {
                throw new Error("User does not have a registered email or mobile number for verification.");
            }

            setShowOTP(true);
            setIsLoading(false);

        } catch (err: any) {
            console.error("Login process error:", err);
            setError(err.message || "Failed to send verification code.");
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!identity.trim() || !identity.includes('@')) {
            setError("Please enter your registered email address above to reset password.");
            return;
        }

        setError('');
        setIsResetting(true);
        try {
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(identity.trim(), {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetErr) throw resetErr;
            setResetSent(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!tempUser?.email) {
                throw new Error("Session expired. Please login again.");
            }

            let error;

            if (otpMethod === 'email') {
                if (!tempUser?.email) throw new Error("Missing email for verification.");
                const res = await supabase.auth.verifyOtp({
                    email: tempUser.email,
                    token: otpCode,
                    type: 'email'
                });
                error = res.error;
            } else {
                if (!tempUser?.mobile) throw new Error("Missing mobile for verification.");
                const res = await supabase.auth.verifyOtp({
                    phone: tempUser.mobile,
                    token: otpCode,
                    type: 'sms'
                });
                error = res.error;
            }

            if (error) throw error;

            // OTP Success: Finalize Login
            setSession(tempUser, rememberMe);
            dispatch(setUser(tempUser));
            onLogin();
        } catch (err) {
            setError("Invalid or expired OTP code.");
            setIsLoading(false);
        }
    };


    // Render Sign Up Flow
    if (authView === 'signup') {
        return (
            <TenantSignUp
                onComplete={() => {
                    setAuthView('login');
                    // Could show a success message here
                }}
                onBackToLogin={() => setAuthView('login')}
            />
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center lg:justify-start p-4 md:p-8 lg:p-12 overflow-x-hidden bg-slate-900">
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
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12">
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
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 tracking-tight group">
                            {tenantName}
                            <span className="block h-1 w-10 bg-indigo-500 mt-1.5 rounded-full transition-all group-hover:w-16" />
                        </h1>
                    </div>

                    <div className="flex flex-col gap-6">
                        {authView === 'login' ? (
                            <form onSubmit={showOTP ? handleVerifyOTP : handleSubmit} className="space-y-4">
                                {showOTP ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                            Verification Node: {otpMethod === 'email' ? 'Mail Delivery' : 'Secure SMS'}
                                        </label>
                                        <div className="relative group">
                                            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                                            <input
                                                type="text"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                placeholder="000000"
                                                className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-mono tracking-[0.8em] text-center outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all p-4"
                                                maxLength={8}
                                                autoFocus
                                            />
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-3 text-xs font-bold p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl animate-in zoom-in-95">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Identity <ArrowRight className="w-4 h-4" /></>}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowOTP(false);
                                                setOtpCode('');
                                                setError('');
                                            }}
                                            className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors py-2"
                                        >
                                            Return to Credentials
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-5 animate-in fade-in duration-500">
                                        <div className="space-y-4">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Identity Terminal</label>
                                                <div className="relative">
                                                    <UserCircle className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-4 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        type="text"
                                                        value={identity}
                                                        onChange={(e) => setIdentity(e.target.value)}
                                                        placeholder="Mobile or Email"
                                                        className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white font-semibold transition-all hover:bg-white/10 text-sm p-4"
                                                    />
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Security Key</label>
                                                <div className="relative">
                                                    <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-4 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="••••••••"
                                                        className="w-full h-14 pl-12 pr-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white font-mono tracking-widest transition-all hover:bg-white/10 p-4"
                                                        autoComplete="current-password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-4 text-slate-500 hover:text-indigo-400 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between px-1">
                                            <label className="flex items-center cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={rememberMe}
                                                        onChange={(e) => setRememberMe(e.target.checked)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-8 h-4 rounded-full transition-colors ${rememberMe ? 'bg-indigo-600' : 'bg-slate-700'}`} />
                                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${rememberMe ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                                <span className="ml-2 text-[10px] font-black text-slate-500 group-hover:text-slate-400 uppercase tracking-widest">Persist Session</span>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => setAuthView('forgot')}
                                                className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                                            >
                                                Lost Access?
                                            </button>
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-3 text-xs font-bold p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl animate-in zoom-in-95">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-16 bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.99] rounded-[1.25rem] font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                                        >
                                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Initialize Login <ArrowRight className="w-5 h-5" /></>}
                                        </button>

                                        {/* Sign Up Link */}
                                        <button
                                            type="button"
                                            onClick={() => setAuthView('signup')}
                                            className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors py-2 mt-2"
                                        >
                                            New Business? Register Now
                                        </button>
                                    </div>
                                )}
                            </form>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-6">
                                    <div className="text-left">
                                        <h2 className="text-xl font-bold text-white mb-2">Recover Access</h2>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Enter your registered email address. We will synchronize a secure recovery node to your inbox.
                                        </p>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Recovery Email</label>
                                        <div className="relative">
                                            <Mail className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-4 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="email"
                                                value={identity}
                                                onChange={(e) => setIdentity(e.target.value)}
                                                placeholder="user@enterprise.com"
                                                className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white font-semibold transition-all hover:bg-white/10 text-sm p-4"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {resetSent ? (
                                    <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-95">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <p className="text-emerald-400 text-xs font-bold text-center uppercase tracking-widest leading-relaxed">
                                            Security link dispatched. Check your inbox to proceed.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {error && (
                                            <div className="flex items-center gap-3 text-xs font-bold p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl animate-in zoom-in-95">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                <span>{error}</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleForgotPassword}
                                            disabled={isResetting}
                                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Request Recovery <ArrowRight className="w-4 h-4" /></>}
                                        </button>
                                    </>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthView('login');
                                        setError('');
                                        setResetSent(false);
                                    }}
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors py-2 flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-3 h-3" /> Return to Login Terminal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Aesthetic Sidebar Accents */}
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-emerald-500/10 blur-[100px] rounded-full animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]" />
            </div>
        </div>
    );
};


export default Login;
