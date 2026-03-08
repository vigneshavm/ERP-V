import React, { useState, useTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from "../../redux/store";
import { setUser, setAuthError } from "../../redux/slices/authSlice";
import { Store, Lock, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff, Loader2, Mail, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

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
    const [isPending, startTransition] = useTransition();

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

            startTransition(() => {
                setSession(sessionUser, apiUser.token);
                dispatch(setUser(apiUser));
            });
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || "Connection failed. Please check your internet.");
        } finally {
            setIsLoading(false);
        }
    };

    const loading = isLoading || isPending;

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#06080F] overflow-hidden font-[system-ui]">
            {/* === LEFT — VISUAL BRANDING === */}
            <div className="hidden md:flex md:w-[55%] lg:w-[58%] relative overflow-hidden">
                <img
                    src={backgroundImage}
                    alt="Branding"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
                    onError={() => setBgError(true)}
                />
                {/* Multi-layer gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#06080F] via-[#06080F]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06080F] via-transparent to-[#06080F]/30" />

                <motion.div
                    className="relative z-10 w-full h-full p-10 lg:p-16 flex flex-col justify-between"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div>
                        {/* Tenant branding */}
                        <div className="flex items-center gap-3.5 mb-12">
                            <div className="w-11 h-11 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                                <Store className="w-6 h-6 text-white/80" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-white/90 tracking-tight block leading-none">{tenant?.name || DEFAULT_BRANDING.NAME}</span>
                                <span className="text-[9px] font-bold text-white/25 uppercase tracking-[0.25em]">{allowedSector} Platform</span>
                            </div>
                        </div>

                        <div className="max-w-lg">
                            <h1 className="text-4xl lg:text-6xl font-black text-white leading-[1.05] mb-6 tracking-tight">
                                Empower Your{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                    Business
                                </span>{' '}
                                Excellence
                            </h1>
                            <p className="text-base lg:text-lg text-white/30 font-medium leading-relaxed max-w-md">
                                Management, insights, and growth tools tailored for {allowedSector.toLowerCase()} enterprises.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl backdrop-blur-sm">
                            <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Enterprise Auth</span>
                        </div>
                        <span className="text-white/10 text-[10px] font-medium">Built for Enterprise Teams</span>
                    </div>
                </motion.div>
            </div>

            {/* === RIGHT — LOGIN FORM === */}
            <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-10 lg:p-16 relative z-20">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute top-6 left-6 p-2 text-white/25 hover:text-white/60 transition-colors group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                )}

                <motion.div
                    className="w-full max-w-sm sm:max-w-md"
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                >
                    {/* Glass card */}
                    <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/20 space-y-7">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1.5">System Login</h2>
                            <p className="text-white/25 text-sm font-medium">
                                Access your {allowedSector} workspace securely
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Identity Input */}
                            <div className="space-y-2.5 group">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-0.5 transition-colors group-focus-within:text-indigo-400">
                                    Identity
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-indigo-400 transition-colors duration-300" />
                                    <input
                                        type="text"
                                        value={identity}
                                        onChange={(e) => setIdentity(e.target.value)}
                                        className="w-full h-13 bg-white/[0.04] border border-white/[0.07] rounded-xl pl-11 pr-4 text-white/90 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all duration-300 placeholder:text-white/15 hover:border-white/[0.12]"
                                        placeholder="Email, ID or Mobile"
                                        required
                                    />
                                    <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03]" />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2.5 group">
                                <div className="flex justify-between items-center ml-0.5">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] transition-colors group-focus-within:text-indigo-400">
                                        Security Key
                                    </label>
                                    <button
                                        type="button"
                                        className="text-[10px] font-bold text-indigo-400/60 hover:text-indigo-400 uppercase tracking-[0.15em] transition-colors"
                                    >
                                        Recover
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-indigo-400 transition-colors duration-300" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-13 bg-white/[0.04] border border-white/[0.07] rounded-xl pl-11 pr-11 text-white/90 font-mono text-sm tracking-wider outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all duration-300 placeholder:text-white/15 hover:border-white/[0.12]"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors p-0.5"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03]" />
                                </div>
                            </div>

                            {/* Error */}
                            {(error || isError) && (
                                <div className="flex items-start gap-3 p-3.5 bg-red-500/[0.06] border border-red-500/15 rounded-xl text-red-400/80 text-[11px] font-medium leading-relaxed"
                                    style={{ animation: 'alertIn 0.3s ease-out' }}
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                                    <span>{error || message}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:scale-100 shadow-lg shadow-indigo-600/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Authenticate Access <ArrowRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-white/[0.04]" />
                            <span className="text-[9px] font-bold text-white/12 uppercase tracking-[0.25em]">Enterprise Shield Active</span>
                            <div className="h-px flex-1 bg-white/[0.04]" />
                        </div>

                        {/* Security notice */}
                        <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl text-center space-y-2">
                            <p className="text-white/15 text-[9px] font-bold uppercase tracking-[0.25em]">Authorized Access Only</p>
                            <p className="text-white/10 text-[11px] font-medium leading-relaxed">
                                Protected by enterprise-grade encryption. Unauthorized attempts are monitored.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <style>{`
                    @keyframes alertIn {
                        from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default Login;
