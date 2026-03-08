import React, { useState, useTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from "../../redux/store";
import { setUser } from "../../redux/slices/authSlice";
import { Store, Lock, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff, Loader2, Mail, Fingerprint, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Sector, SystemRole } from "../../types/common";
import { Tenant, DbRoleCode } from "../../types/tenant";
import api from "../../services/api.js";
import { setSession } from "../../utils/session";
import AuthAlert from '../Views/AuthAlert';

interface LoginProps {
    tenant: Tenant | null;
    allowedSector: Sector;
    onBack?: () => void;
}

const SECTOR_METADATA: Record<Sector, { image: string, label: string, accent: string }> = {
    'Retail': {
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80',
        label: 'Omni-Channel Retail',
        accent: 'indigo'
    },
    'Restaurant': {
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
        label: 'Culinary Operations',
        accent: 'rose'
    },
    'Services': {
        image: 'https://images.unsplash.com/photo-1521791136064-7986c29598a5?auto=format&fit=crop&q=80',
        label: 'Professional Services',
        accent: 'sky'
    },
    'Pharmacy': {
        image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80',
        label: 'Clinical Intelligence',
        accent: 'emerald'
    },
    'General': {
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80',
        label: 'Enterprise Management',
        accent: 'slate'
    },
    'Electronics': {
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80',
        label: 'Logic & Circuitry',
        accent: 'blue'
    },
    'Grocery': {
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
        label: 'Essential Logistics',
        accent: 'lime'
    },
    'Supermarket': {
        image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80',
        label: 'Aggregate Retail',
        accent: 'cyan'
    },
    'Textile': {
        image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80',
        label: 'Woven Infrastructure',
        accent: 'violet'
    },
    'Mobile Shop': {
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80',
        label: 'Telemetric Hub',
        accent: 'amber'
    },
    'FMCG': {
        image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80',
        label: 'Fast-Velocity Assets',
        accent: 'orange'
    }
};

const DEFAULT_BRANDING = {
    NAME: 'BizzAI Enterprise',
    BACKGROUND: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80'
};

const TenantLogin: React.FC<LoginProps> = ({ tenant, allowedSector, onBack }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isError, message } = useSelector((state: RootState) => state.auth);

    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bgError, setBgError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const sectorInfo = SECTOR_METADATA[allowedSector] || SECTOR_METADATA.General;
    const backgroundImage = (!bgError && tenant?.loginBgUrl) || sectorInfo.image || DEFAULT_BRANDING.BACKGROUND;

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
        <div className="min-h-screen w-full flex bg-[#030408] overflow-hidden font-[Inter,system-ui] relative">
            {/* === LEFT — IMMERSIVE BRANDING === */}
            <div className="hidden md:flex md:w-[55%] lg:w-[58%] relative overflow-hidden group/bg">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={backgroundImage}
                        src={backgroundImage}
                        alt="Tenant Branding"
                        initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        animate={{ opacity: 0.35, scale: 1.02, filter: 'blur(0px)' }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        onError={() => setBgError(true)}
                    />
                </AnimatePresence>
                
                {/* Multi-layer gradient overlays for depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#030408] via-[#030408]/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030408] via-transparent to-[#030408]/40" />
                
                {/* Tactical Overlays */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />

                <motion.div
                    className="relative z-10 w-full h-full p-12 lg:p-20 flex flex-col justify-between"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="space-y-16">
                        {/* Tenant Header Nodes */}
                        <div className="flex items-center gap-5 group/tenant">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-indigo-500/20 blur-xl opacity-0 group-hover/tenant:opacity-100 transition-all duration-700" />
                                <div className="w-14 h-14 bg-white/5 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl relative overflow-hidden">
                                    <Store className="w-7 h-7 text-white/80" />
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <span className="text-xl font-black text-white tracking-tighter block leading-none uppercase italic">
                                    {tenant?.name || DEFAULT_BRANDING.NAME}
                                </span>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-2 mt-1">
                                    <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                                    {sectorInfo.label} Portal
                                </span>
                            </div>
                        </div>

                        <div className="max-w-xl space-y-6">
                            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[0.95] tracking-tighter uppercase italic">
                                Domain <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500 underline decoration-indigo-500/20 decoration-8 underline-offset-8">
                                    IntelliGence
                                </span>
                            </h1>
                            <p className="text-lg lg:text-xl text-white/30 font-bold leading-relaxed max-w-md uppercase tracking-tight italic">
                                Specialized enterprise infrastructure serving the <span className="text-indigo-400/60">{allowedSector}</span> sector with high-integrity automation.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl backdrop-blur-3xl shadow-xl">
                            <Fingerprint className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Institutional Auth</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
                             <span className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">Encrypted Pipeline Active</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* === RIGHT — SECURE PORTAL FORM === */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 relative z-20">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute top-10 left-10 p-2 text-white/20 hover:text-white/60 transition-all group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] italic"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        TERMINATE PORTAL
                    </button>
                )}

                <motion.div
                    className="w-full max-w-sm sm:max-w-md"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                >
                    {/* Secure Glass Card */}
                    <div className="bg-white/[0.015] backdrop-blur-3xl border border-white/[0.07] rounded-[2.5rem] p-8 sm:p-12 shadow-[0_32px_100px_rgba(0,0,0,0.6)] space-y-10 relative overflow-hidden group/form">
                         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-30" />
                         
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-indigo-500 animate-pulse" />
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Access Node</h2>
                            </div>
                            <p className="text-white/20 text-[11px] font-bold uppercase tracking-[0.25em] italic flex items-center gap-2">
                                <div className="h-px w-6 bg-white/10" />
                                SECURE SESSION_INIT
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Identity Input */}
                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 transition-colors group-focus-within/field:text-indigo-400 italic">
                                    Identity Profile
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/10 group-focus-within/field:text-indigo-400 transition-all duration-500" />
                                    <input
                                        type="text"
                                        value={identity}
                                        onChange={(e) => setIdentity(e.target.value)}
                                        className="w-full h-14 bg-white/[0.02] border border-white/[0.07] rounded-2xl pl-12 pr-4 text-white/90 text-[13px] font-bold outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all duration-500 placeholder:text-white/10 placeholder:italic hover:border-white/[0.12] hover:bg-white/[0.04]"
                                        placeholder="Email, ID or Mobile"
                                        required
                                    />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-indigo-500 transition-all duration-700 group-focus-within/field:w-[80%] opacity-40" />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-3 group/field">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] transition-colors group-focus-within/field:text-indigo-400 italic">
                                        Security Handle
                                    </label>
                                    <button
                                        type="button"
                                        className="text-[10px] font-black text-indigo-400/60 hover:text-indigo-400 uppercase tracking-widest transition-all italic border-b border-transparent hover:border-indigo-500"
                                    >
                                        RECOVER
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/10 group-focus-within/field:text-indigo-400 transition-all duration-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-14 bg-white/[0.02] border border-white/[0.07] rounded-2xl pl-12 pr-12 text-white/90 font-mono text-[13px] tracking-[0.3em] outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all duration-500 placeholder:text-white/10 hover:border-white/[0.12] hover:bg-white/[0.04]"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-white/40 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-indigo-500 transition-all duration-700 group-focus-within/field:w-[80%] opacity-40" />
                                </div>
                            </div>

                            {/* Error Pulse */}
                            <AnimatePresence mode="wait">
                                {(error || isError) && (
                                    <AuthAlert
                                        type="error"
                                        title="System Integrity Breach"
                                        message={error || message}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Submit — The Portal Key */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full h-14 overflow-hidden rounded-[1.5rem] bg-indigo-600 font-black text-[13px] uppercase tracking-[0.2em] italic text-white shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:scale-100"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>INITIALIZE ACCESS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Security Ledger Notice */}
                        <div className="bg-white/5 border border-white/5 p-5 rounded-[1.5rem] text-center space-y-2 relative overflow-hidden group/notice">
                             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-20" />
                            <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] italic">Authorized Personnel Only</p>
                            <p className="text-white/10 text-[11px] font-bold leading-relaxed italic uppercase tracking-tight">
                                This portal is guarded by enterprise-grade encryption. Unauthorized session attempts are traced by central intelligence.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TenantLogin;
