import React, { useEffect, useTransition } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ShieldAlert, Loader2, CheckCircle2, Zap, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SecurePasswordInput from './SecurePasswordInput';
import PasswordStrengthMeter from '../../components/Auth/PasswordStrengthMeter';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import { useResetPasswordForm } from '../../hooks/auth/useResetPasswordForm';

const ResetPassword: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isPending, startTransition] = useTransition();

    const params = new URLSearchParams(location.search);
    const email = params.get('email') || '';
    const token = params.get('token') || '';

    const { form, onSubmit, isLoading } = useResetPasswordForm(email, token);
    const { register, formState: { errors }, watch } = form;
    const { isError, isSuccess, message, validationError } = form as any;

    const passwordValue = watch('password') || '';
    const loading = isLoading || isPending;

    useEffect(() => {
        if (isSuccess) {
            const t = setTimeout(() => navigate('/login'), 2500);
            return () => clearTimeout(t);
        }
    }, [isSuccess, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            onSubmit(e);
        });
    };

    // Invalid / Vault Access Denied State
    if (!token || !email) {
        return (
            <AuthLayout
                title="Access Denied"
                subtitle="Invalid Token Sequence"
                secondarySubtitle="Phase: Secure Link Failure"
                description="The cryptographic reset sequence could not be verified. This link has either expired or been corrupted during transmission."
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-8 text-center"
                >
                    <div className="relative mx-auto w-20 h-20">
                         <div className="absolute inset-0 bg-rose-500/10 blur-2xl rounded-full" />
                         <div className="relative w-full h-full bg-white/[0.03] border border-rose-500/20 rounded-[2rem] flex items-center justify-center backdrop-blur-3xl shadow-2xl">
                            <ShieldAlert className="w-10 h-10 text-rose-500" />
                         </div>
                    </div>

                    <div className="space-y-3">
                         <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Identity Mismatch</h3>
                         <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest italic leading-relaxed">Verification node returned a terminal failure code. Access denied.</p>
                    </div>

                    <Link
                        to="/forgot-password"
                        className="group relative w-full h-14 overflow-hidden rounded-[1.5rem] bg-indigo-600 font-black text-[12px] uppercase tracking-[0.2em] italic text-white shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-3"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            RE-INITIALISE PROTOCOL <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>
                </motion.div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Vault Override"
            subtitle="Reset Access Key"
            secondarySubtitle={`Identity: ${email.split('@')[0]}@****.nexus`}
            description="Re-establishing your enterprise credential matrix. Ensure your new secret meets the sovereign integrity standards."
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-10"
            >
                {/* Success Sequence HUD */}
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            className="text-center space-y-8 py-4"
                        >
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
                                <div className="relative w-full h-full bg-white/[0.03] border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center backdrop-blur-3xl shadow-2xl">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Vault Updated</h3>
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest italic">
                                    Credentials synchronized across nodes. Redirecting to gateway...
                                </p>
                            </div>

                            {/* Sync Progress */}
                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] italic">Synchronisation State</span>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Live Redirect</span>
                                </div>
                                <div className="w-full bg-white/[0.02] border border-white/5 h-2 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 rounded-full"
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 2.5, ease: 'easeInOut' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="space-y-8">
                             {/* Alerts HUD */}
                            <AnimatePresence mode="wait">
                                {(validationError || isError) && (
                                    <AuthAlert
                                        type="error"
                                        title="Initialisation Error"
                                        message={validationError || message}
                                    />
                                )}
                            </AnimatePresence>

                            <form className="space-y-8" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                     <SecurePasswordInput
                                        id="reset-password"
                                        label="New Access Secret"
                                        placeholder="Min 8 Complex Units"
                                        registration={register('password')}
                                        error={errors.password?.message}
                                    />
                                    <PasswordStrengthMeter password={passwordValue} />
                                </div>

                                <SecurePasswordInput
                                    id="reset-confirmPassword"
                                    label="Confirm New Secret"
                                    placeholder="Re-initialise Secret"
                                    registration={register('confirmPassword')}
                                    error={errors.confirmPassword?.message}
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
                                            <>UPDATE VAULT SECRET <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </span>
                                </button>
                            </form>

                            {/* Back to gateway node */}
                            <div className="mt-12 pt-8 border-t border-white/[0.05] text-center space-y-4">
                                <p className="text-[10px] font-black text-white/15 uppercase tracking-[0.3em] italic">
                                     Abort Sequence?
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-black text-white/40 hover:text-white transition-all uppercase tracking-widest italic group"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> RETURN TO GATEWAY
                                </Link>
                                
                                <div className="flex items-center justify-center gap-2 pt-4">
                                     <Zap className="w-3.5 h-3.5 text-white/10" />
                                     <span className="text-[9px] font-black text-white/5 uppercase tracking-[0.4em]">v4.0.2 // Secure Session</span>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AuthLayout>
    );
};

export default ResetPassword;
