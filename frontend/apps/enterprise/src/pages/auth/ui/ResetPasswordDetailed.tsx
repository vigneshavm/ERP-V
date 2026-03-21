import { useAuthStore } from '@repo/shared';
import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import { setAuthError, setAuthSuccess, logout } from "@/entities/session/model/authSlice";

import api from "@/shared/api/api";
import { clearSession } from "@/shared/lib/utils/session";
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import PasswordStrengthMeter from '@/features/auth-by-email/ui/PasswordStrengthMeter';

const ResetPassword = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const {  isLoading, isSuccess, isError  } = useAuthStore();
    const [isPending, startTransition] = useTransition();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [localError, setLocalError] = useState('');

    const [validation, setValidation] = useState({
        length: false, upper: false, lower: false, number: false, special: false
    });

    useEffect(() => {
        const checkSession = async () => {
            try {
                setSessionChecked(true);
            } catch (e) {
                dispatch(setAuthError("Session invalid or link expired. Please request a new link."));
                setSessionChecked(true);
            }
        };
        checkSession();
        return () => {
            dispatch(setAuthSuccess(false));
            dispatch(setAuthError(null));
        };
    }, [dispatch]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
        setValidation({
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        });
    }, [password]);

    const strengthScore = Object.values(validation).filter(Boolean).length;
    const isPasswordStrong = validation.length && strengthScore >= 4;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        dispatch(setAuthError(null));

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }
        if (!isPasswordStrong) {
            setLocalError("Password does not meet security requirements.");
            return;
        }

        try {
            await api.post('/auth/reset-password', { password });
            dispatch(setAuthSuccess(true));
        } catch (err: any) {
            dispatch(setAuthError(err.message));
        }
    };

    useEffect(() => {
        if (isSuccess) {
            startTransition(() => {
                dispatch(logout());
                clearSession();
            });
            const timer = setTimeout(() => navigate('/'), 2500);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, navigate, dispatch, startTransition]);

    const loading = isLoading || isPending;

    if (!sessionChecked) {
        return (
            <div className="h-screen bg-[var(--erp-bg)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[var(--erp-bg)]">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[25%] -left-[10%] w-[55%] h-[55%] bg-indigo-600/[0.06] blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-violet-600/[0.05] blur-[130px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute inset-0 opacity-[0.012]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '64px 64px'
                }} />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-[460px]"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Glass Card */}
                <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl shadow-2xl shadow-black/20 p-7 sm:p-9 max-h-[90dvh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {/* Header */}
                    <div className="mb-7">
                        <div className="flex justify-between items-start mb-5">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/25">Secure</span>
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1.5">Set New Password</h1>
                        <p className="text-white/25 text-sm font-medium">Reset access for your Enterprise Account</p>
                    </div>

                    {isSuccess ? (
                        /* Success State */
                        <motion.div
                            className="text-center py-4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/15">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Password Updated</h2>
                            <p className="text-muted mb-6 text-sm">
                                Credentials synchronized. Redirecting...
                            </p>
                            <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                    style={{ animation: 'progressBar 2.5s ease-in-out forwards', width: '0%' }}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* New Password */}
                            <div className="group">
                                <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-2.5 ml-0.5 transition-colors group-focus-within:text-indigo-400">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="w-[18px] h-[18px] text-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors duration-300" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 8 characters"
                                        className="w-full h-13 pl-11 pr-11 bg-white/[0.04] border border-white/[0.07] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 text-main font-mono text-sm tracking-wider transition-all duration-300 placeholder:text-white/15 hover:border-white/[0.12]"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-muted transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03]" />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="group">
                                <label className="block text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-2.5 ml-0.5 transition-colors group-focus-within:text-indigo-400">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="w-[18px] h-[18px] text-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors duration-300" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat password"
                                        className="w-full h-13 pl-11 pr-4 bg-white/[0.04] border border-white/[0.07] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 text-main font-mono text-sm tracking-wider transition-all duration-300 placeholder:text-white/15 hover:border-white/[0.12]"
                                        disabled={loading}
                                    />
                                    <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03]" />
                                </div>
                            </div>

                            {/* Strength Meter */}
                            <PasswordStrengthMeter password={password} />

                            {/* Error */}
                            {(isError || localError) && (
                                <div
                                    className="flex items-center gap-3 text-[11px] font-medium p-3.5 bg-red-500/[0.06] border border-red-500/15 text-red-400/80 rounded-xl"
                                    style={{ animation: 'alertIn 0.3s ease-out' }}
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                                    <span>{localError || (typeof isError === 'string' ? isError : 'An error occurred')}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !isPasswordStrong}
                                className="w-full h-13 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Set New Password <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></>
                                )}
                            </button>

                            {/* Footer */}
                            <div className="pt-5 border-t border-white/[0.04] flex items-center justify-center gap-3">
                                <div className="flex -space-x-1">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-4 h-4 rounded-full bg-white/[0.04] border border-white/[0.06]" />
                                    ))}
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/12">Enterprise Encryption</span>
                            </div>
                        </form>
                    )}
                </div>

                <p className="mt-6 text-center text-white/10 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Secure Transmission
                </p>
            </motion.div>

            <style>{`
                @keyframes progressBar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes alertIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ResetPassword;
