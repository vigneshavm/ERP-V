import React, { useEffect, useTransition } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import SecurePasswordInput from './SecurePasswordInput';
import PasswordStrengthMeter from '@/features/auth-by-email/ui/PasswordStrengthMeter';
import AuthLayout from '@/pages/Views/ui/AuthLayout';
import AuthAlert from '@/pages/Views/ui/AuthAlert';
import { useResetPasswordForm } from '@/features/auth-by-email/lib/useResetPasswordForm';

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

    // Invalid / expired link
    if (!token || !email) {
        return (
            <AuthLayout
                title="Access Denied"
                subtitle="Invalid Reset Link"
                secondarySubtitle="This request could not be verified"
                description="This reset link is either invalid or has expired. Please request a new one for security."
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="bg-red-500/[0.06] border border-red-500/10 p-6 rounded-xl flex flex-col items-center gap-4 text-center">
                        <ShieldAlert className="w-10 h-10 text-red-400/80" />
                        <p className="text-[10px] font-bold text-red-400/60 uppercase tracking-[0.2em]">Security Link Invalid</p>
                        <Link
                            to="/forgot-password"
                            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            Request New Link <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </motion.div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="System Security"
            subtitle="Reset your Password"
            secondarySubtitle={`Updating credentials for ${email}`}
            description="Create a strong, unique password to protect your enterprise workspace and data."
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Success state */}
                {isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white">Password Updated</h3>
                            <p className="text-white/30 text-sm">
                                Your credentials have been updated. Redirecting to login...
                            </p>
                        </div>
                        {/* Progress indicator */}
                        <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                style={{
                                    animation: 'progressBar 2.5s ease-in-out forwards',
                                    width: '0%'
                                }}
                            />
                        </div>
                        <style>{`
                            @keyframes progressBar {
                                from { width: 0%; }
                                to { width: 100%; }
                            }
                        `}</style>
                    </motion.div>
                ) : (
                    <>
                        {/* Alerts */}
                        {(validationError || isError) && (
                            <div className="mb-6">
                                <AuthAlert
                                    type="error"
                                    title="Reset Error"
                                    message={validationError || message}
                                />
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <SecurePasswordInput
                                id="reset-password"
                                label="New Password"
                                placeholder="Min 8+ characters"
                                registration={register('password')}
                                error={errors.password?.message}
                            />

                            <PasswordStrengthMeter password={passwordValue} />

                            <SecurePasswordInput
                                id="reset-confirmPassword"
                                label="Confirm New Password"
                                placeholder="Re-enter your password"
                                registration={register('confirmPassword')}
                                error={errors.confirmPassword?.message}
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:scale-100 shadow-lg shadow-indigo-600/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Update Password <ArrowRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        </form>

                        {/* Back to login */}
                        <div className="mt-8 pt-7 border-t border-white/[0.05] text-center">
                            <Link
                                to="/login"
                                className="text-[10px] font-bold text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="w-3 h-3 rotate-180" /> Abort & Return to Login
                            </Link>
                        </div>
                    </>
                )}
            </motion.div>
        </AuthLayout>
    );
};

export default ResetPassword;
