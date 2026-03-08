import React, { useTransition } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, Loader2, Key, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceConflictModal from '../System/Sync/DeviceConflictModal';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import AuthInput from '../../components/Auth/AuthInput';
import { useLoginForm } from '../../hooks/auth/useLoginForm';

interface LoginProps {
    isAdmin?: boolean;
}

const Login: React.FC<LoginProps> = ({ isAdmin = false }) => {
    const { form, onSubmit, isLoading } = useLoginForm();
    const { register, formState: { errors }, watch } = form;
    const { isError, message, deviceConflict, reset } = form as any;
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            onSubmit(e);
        });
    };

    const loading = isLoading || isPending;

    return (
        <AuthLayout
            title={isAdmin ? "Nexus Control" : "Identity Gateway"}
            subtitle={isAdmin ? "Omni-Sovereign Access" : "Secure Entry Sequence"}
            secondarySubtitle={isAdmin ? "Phase: Restricted Core Auth" : "Phase: Credential Validation"}
            description={isAdmin
                ? "Accessing the enterprise nerve center. All neural pathways are monitored and logged for regulatory compliance."
                : "Initialising your digital workspace. Converging business intelligence and operational excellence."}
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-10"
            >
                {/* Status HUD */}
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                            {loading ? "Decrypting..." : "Ready for Auth"}
                        </span>
                    </div>
                    {isAdmin && (
                        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-rose-500" />
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Admin Mode</span>
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {isError && (
                        <AuthAlert
                            type="error"
                            title="Breach Detected / Invalid Credentials"
                            message={message}
                        />
                    )}
                </AnimatePresence>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <AuthInput
                            id="login-email"
                            label="Neural Identity (Email)"
                            type="email"
                            autoComplete="email"
                            placeholder="user@enterprise.nexus"
                            icon={Mail}
                            registration={register('email')}
                            error={errors.email?.message}
                        />

                        <div className="space-y-1">
                            <div className="flex justify-between items-center px-1 mb-1">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Security Protocol</label>
                                <Link
                                    to="/forgot-password"
                                    className="text-[10px] font-black text-indigo-400/60 hover:text-indigo-400 uppercase tracking-[0.15em] transition-colors italic border-b border-indigo-500/0 hover:border-indigo-500/50"
                                >
                                    Recovery Flow
                                </Link>
                            </div>
                            <SecurePasswordInput
                                id="login-password"
                                placeholder="••••••••••••"
                                registration={register('password')}
                                error={errors.password?.message}
                            />
                        </div>
                    </div>

                    {/* Tactical Switch - Remember Me */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative flex items-center">
                                <input
                                    id="rememberMe"
                                    type="checkbox"
                                    {...register('rememberMe')}
                                    className="peer h-5 w-5 rounded-lg border-white/10 bg-white/[0.03] text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none border checked:bg-indigo-600 checked:border-indigo-600"
                                />
                                <ShieldCheck className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-3.5 h-3.5 text-white left-0.5 top-0.5" />
                            </div>
                            <label htmlFor="rememberMe" className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors cursor-pointer italic">
                                Institutional Trust
                            </label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             <Zap className="w-3 h-3 text-amber-500/30" />
                             <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">v4.0.2</span>
                        </div>
                    </div>

                    {/* Submit - The Vault Handle */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full h-14 overflow-hidden rounded-[1.5rem] bg-indigo-600 font-black text-[13px] uppercase tracking-[0.2em] italic text-white shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:scale-100"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Verify Identity <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </span>
                    </button>
                </form>

                {/* Secure Footer Nodes */}
                <div className="mt-12 pt-8 border-t border-white/[0.05]">
                    {!isAdmin && (
                        <div className="text-center space-y-4">
                            <p className="text-[10px] font-black text-white/15 uppercase tracking-[0.3em] italic">
                                No Clearance?
                            </p>
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-black text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.05] transition-all group"
                            >
                                REQUEST ACCESS <Key className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                            </Link>
                        </div>
                    )}
                    {isAdmin && (
                        <Link
                            to="/"
                            className="text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-colors flex items-center justify-center gap-3 italic group"
                        >
                            <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" /> TERMINATE ADMIN SESSION
                        </Link>
                    )}
                </div>

                {/* Device Conflict Modal */}
                {deviceConflict && (
                    <DeviceConflictModal
                        email={watch('email')}
                        password={watch('password')}
                        onClose={() => reset()}
                    />
                )}
            </motion.div>
        </AuthLayout>
    );
};

export default Login;
