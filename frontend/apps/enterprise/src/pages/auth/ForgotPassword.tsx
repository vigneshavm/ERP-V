import React, { useState, useEffect, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, LifeBuoy, Loader2, CheckCircle2, RotateCcw, Zap, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import AuthInput from '../../components/Auth/AuthInput';
import { useForgotPasswordForm } from '../../hooks/auth/useForgotPasswordForm';

const ForgotPassword: React.FC = () => {
    const { form, onSubmit, isLoading } = useForgotPasswordForm();
    const { register, formState: { errors } } = form;
    const { isError, isSuccess, message } = form as any;
    const [isPending, startTransition] = useTransition();
    const [resendTimer, setResendTimer] = useState(0);

    const loading = isLoading || isPending;

    // Resend timer countdown
    useEffect(() => {
        if (isSuccess) setResendTimer(60);
    }, [isSuccess]);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            onSubmit(e);
        });
    };

    const handleResend = (e: React.FormEvent) => {
        e.preventDefault();
        if (resendTimer > 0) return;
        startTransition(() => {
            onSubmit(e);
        });
        setResendTimer(60);
    };

    return (
        <AuthLayout
            title="Recovery Protocol"
            subtitle="Crendential Reset"
            secondarySubtitle="Phase: Secure Identity Reclamation"
            description="Initiating the secure reset sequence. We will dispatch a single-use neural link to your registered communication node to re-initialise your access secret."
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-10"
            >
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        /* === SUCCESS STATE — TRANSMISSION COMPLETE === */
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center space-y-8"
                        >
                            <div className="relative mx-auto w-20 h-20">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative w-full h-full bg-white/[0.03] border border-emerald-500/20 rounded-[2rem] flex items-center justify-center backdrop-blur-3xl shadow-2xl">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Transmission Successful</h3>
                                <p className="text-white/30 text-xs font-bold leading-relaxed max-w-xs mx-auto uppercase tracking-wide">
                                    A secure reset link has been dispatched to your node. Please verify the integrity of your inbox.
                                </p>
                            </div>

                            {message && (
                                <AuthAlert type="success" message={message} />
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={handleResend}
                                    disabled={resendTimer > 0}
                                    className="group inline-flex items-center gap-3 text-[10px] font-black text-white/20 hover:text-white/50 disabled:text-white/5 uppercase tracking-[0.25em] transition-all italic"
                                >
                                    <RotateCcw className={`w-3.5 h-3.5 ${resendTimer > 0 ? '' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                                    {resendTimer > 0 ? `Retry in ${resendTimer}s` : 'DISPATCH NEW LINK'}
                                </button>
                            </div>

                            <div className="pt-8 border-t border-white/[0.05]">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-black text-indigo-400 hover:text-indigo-300 transition-all uppercase tracking-widest italic group"
                                >
                                    RETURN TO GATEWAY <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        /* === RESET FORM STATE === */
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-10"
                        >
                            {/* HUD Header */}
                            <div className="flex items-center justify-between border-b border-white/[0.05] pb-6 px-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-indigo-500 animate-ping' : 'bg-amber-500/50'}`} />
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] italic">
                                        {loading ? "PROCESSING_RECOVERY..." : "AWAITING_NODE_IDENTITY"}
                                    </span>
                                </div>
                                <Zap className="w-4 h-4 text-white/10" />
                            </div>

                            <AnimatePresence mode="wait">
                                {isError && (
                                    <AuthAlert type="error" title="Recovery Interrupted" message={message} />
                                )}
                            </AnimatePresence>

                            <form className="space-y-8" onSubmit={handleSubmit}>
                                <AuthInput
                                    id="forgot-email"
                                    label="Registered Node (Email)"
                                    type="email"
                                    placeholder="user@enterprise.nexus"
                                    icon={Mail}
                                    registration={register('email')}
                                    error={errors.email?.message}
                                />

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full h-14 overflow-hidden rounded-[1.5rem] bg-indigo-600 font-black text-[12px] uppercase tracking-[0.2em] italic text-white shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 group-hover:translate-x-full transition-transform duration-1000" />
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>AUTHORISE RESET DISPATCH <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </span>
                                </button>
                            </form>

                            {/* Footer Nodes */}
                            <div className="mt-12 pt-8 border-t border-white/[0.05] text-center space-y-4">
                                <p className="text-[10px] font-black text-white/15 uppercase tracking-[0.3em] italic">
                                     Secret Recovered?
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-black text-indigo-400 hover:text-indigo-300 transition-all uppercase tracking-widest italic group"
                                >
                                    SIGN_IN TO VAULT <Key className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                </Link>
                            </div>

                            {/* Recovery Intelligence Sidebar (embedded) */}
                            <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex items-center gap-5 relative overflow-hidden group/intel">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-20" />
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover/intel:scale-110 transition-transform duration-700">
                                    <LifeBuoy className="w-5 h-5 text-indigo-400 animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Recovery Intel</p>
                                    <p className="text-[11px] text-white/10 font-bold uppercase leading-relaxed tracking-tight italic">
                                        Contact our <span className="text-white/30 hover:text-indigo-400 transition-colors cursor-pointer">enterprise desk</span> for immediate manual override assistance.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AuthLayout>
    );
};

export default ForgotPassword;
