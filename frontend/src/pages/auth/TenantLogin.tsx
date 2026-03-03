
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from "../../redux/store";
import { setUser, setAuthError, setAuthSuccess } from "../../redux/slices/authSlice";
import { Store, Lock, ArrowRight, ArrowLeft, AlertCircle, UserCircle, Eye, EyeOff, Loader2, Mail, CheckCircle2 } from 'lucide-react';


import { Sector, SystemRole } from "../../types/common";
import { Tenant, TenantUser, DbRoleCode } from "../../types/tenant";
import api from "../../services/api.js";
import { setSession } from "../../utils/session";

interface LoginProps {
    tenant: Tenant | null;
    allowedSector: Sector;
    onBack?: () => void;
}

const SECTOR_IMAGES: Partial<Record<Sector, string>> = {
    'Retail': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80',
    'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
    'Services': 'https://images.unsplash.com/photo-1521791136064-7986c29598a5?auto=format&fit=crop&q=80',
    'Pharmacy': 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80',
    'General': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80'
};

const DEFAULT_BRANDING = {
    NAME: 'BizzAI Enterprise',
    LOGO: 'https://bizzai.com/logo.png',
    BACKGROUND: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80'
};

const Login: React.FC<LoginProps> = ({ tenant, allowedSector, onBack }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isError, message } = useSelector((state: RootState) => state.auth);

    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bgError, setBgError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const [rememberMe, setRememberMe] = useState(false);
    const [showOTP, setShowOTP] = useState(false);

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
            const response = await api.post('/auth/login', {
                tenantId: tenant.id,
                identity: cleanIdentity,
                password: password
            });

            const data = response.data;

            if (!data || !data.success || !data.user) {
                setError(data?.message || "Invalid credentials.");
                setIsLoading(false);
                return;
            }

            const apiUser = data.user;
            let systemRole: SystemRole = SystemRole.STAFF;

            if (apiUser.role) {
                const code = apiUser.role.code?.toLowerCase();
                if (code === DbRoleCode.OWNER) systemRole = SystemRole.OWNER;
                else if (code === DbRoleCode.ADMIN) systemRole = SystemRole.ADMIN;
                else if (code === DbRoleCode.MANAGER) systemRole = SystemRole.MANAGER;
            }

            const sessionUser: any = {
                ...apiUser,
                id: apiUser._id,
                name: apiUser.fullName,
                systemRole: systemRole,
                sector: allowedSector,
                tenantId: tenant.id
            };

            setSession(sessionUser, apiUser.token);
            dispatch(setUser(apiUser));
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || "Connection failed. Please check your internet.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-950 overflow-hidden font-inter">
            {/* Left Section: Visual & Branding */}
            <div className="hidden md:flex md:w-[60%] lg:w-[65%] relative overflow-hidden">
                <img
                    src={backgroundImage}
                    alt="Branding"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                    onError={() => setBgError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/40 to-transparent" />

                <div className="relative z-10 w-full h-full p-12 lg:p-20 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-white/10 ring-4 ring-white/5">
                                <Store className="w-7 h-7 text-slate-950" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tighter uppercase">{tenant?.name || DEFAULT_BRANDING.NAME}</span>
                        </div>
                        <div className="max-w-xl">
                            <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6 animate-in slide-in-from-left duration-700">
                                Empower Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Business</span> Excellence
                            </h1>
                            <p className="text-lg lg:text-xl text-slate-400 font-medium leading-relaxed max-w-md animate-in slide-in-from-left duration-700 delay-150">
                                Management, insights, and growth tools tailored for {allowedSector.toLowerCase()} enterprises.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 animate-in fade-in duration-1000 delay-300">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden">
                                    <UserCircle className="w-full h-full" />
                                </div>
                            ))}
                        </div>
                        <div className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                            Built for Enterprise Teams
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 bg-slate-900 md:bg-slate-950 relative z-20">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute top-8 left-8 p-2 text-slate-400 hover:text-white transition-colors group flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Selection
                    </button>
                )}

                <div className="w-full max-w-sm sm:max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white tracking-tight">System Login</h2>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            Access your {allowedSector} workspace securely
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-400">Identity</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={identity}
                                        onChange={(e) => setIdentity(e.target.value)}
                                        className="w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                                        placeholder="Email, ID or Mobile"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest transition-colors group-focus-within:text-indigo-400">Security Key</label>
                                    <button type="button" className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">Recover Access</button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-12 text-white font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {(error || isError) && (
                            <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-in zoom-in-95 leading-relaxed">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>{error || message}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-white/5"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Authenticate Access <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 py-4">
                        <div className="h-px flex-1 bg-slate-800/50" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Enterprise Shield Active</span>
                        <div className="h-px flex-1 bg-slate-800/50" />
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 text-center">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Authorized Access Only</p>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">
                            This system is protected by high-level encryption. All unauthorized attempts are logged and reported.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
