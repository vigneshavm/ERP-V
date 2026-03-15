"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, LifeBuoy, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '@/views/Views/ui/AuthLayout';
import AuthAlert from '@/views/Views/ui/AuthAlert';
import AuthInput from '@/features/auth-by-email/ui/AuthInput';
import { useForgotPasswordForm } from '@/features/auth-by-email/lib/useForgotPasswordForm';

export default function ForgotPasswordPage() {
    const { form, onSubmit, isLoading } = useForgotPasswordForm();
    const { register, formState: { errors } } = form;
    const { isError, isSuccess, message } = form as any;
    const [isPending, startTransition] = useTransition();
    const [resendTimer, setResendTimer] = useState(0);

    const loading = isLoading || isPending;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
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
            title="Account Recovery"
            subtitle="Forgot Password?"
            secondarySubtitle="Initiate the secure reset protocol"
            description="Don't worry, it happens. Enter your registered email and we'll send you a secure link to reset your credentials."
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center space-y-6"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white">Check your inbox</h3>
                                <p className="text-white/30 text-sm leading-relaxed max-w-xs mx-auto">
                                    We've sent a password reset link to your registered email address.
                                </p>
                            </div>
                            {message && (
                                <AuthAlert type="success" message={message} />
                            )}
                            <div className="pt-2">
                                <button
                                    onClick={handleResend}
                                    disabled={resendTimer > 0}
                                    className="inline-flex items-center gap-2 text-[11px] font-bold text-white/30 hover:text-white/50 disabled:text-white/10 uppercase tracking-[0.15em] transition-colors"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Link'}
                                </button>
                            </div>
                            <div className="pt-4 border-t border-white/[0.05]">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400/80 hover:text-indigo-300 transition-colors"
                                >
                                    Return to Sign In <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {isError && (
                                <div className="mb-6">
                                    <AuthAlert type="error" title="Recovery Error" message={message} />
                                </div>
                            )}
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <AuthInput
                                    id="forgot-email"
                                    label="Registered Email"
                                    type="email"
                                    placeholder="you@company.com"
                                    icon={Mail}
                                    registration={register('email')}
                                    error={errors.email?.message}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:scale-100 shadow-lg shadow-indigo-600/20"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Send Recovery Link <ArrowRight className="w-3.5 h-3.5" /></>
                                    )}
                                </button>
                            </form>
                            <div className="mt-8 pt-7 border-t border-white/[0.05] text-center">
                                <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] mb-3">
                                    Remembered your Key?
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400/80 hover:text-indigo-300 transition-colors"
                                >
                                    Return to Sign In <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div className="mt-6 bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center shrink-0">
                                    <LifeBuoy className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Need Support?</p>
                                    <p className="text-[11px] text-white/15 font-medium">Contact our enterprise desk for assistance.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AuthLayout>
    );
}
