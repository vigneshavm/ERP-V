import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import { useResetPasswordForm } from '../../hooks/auth/useResetPasswordForm';

const ResetPassword: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const params = new URLSearchParams(location.search);
    const email = params.get('email') || '';
    const token = params.get('token') || '';

    const { form, onSubmit, isLoading } = useResetPasswordForm(email, token);
    const { register, formState: { errors } } = form;
    const { isError, isSuccess, message, validationError } = form as any;

    useEffect(() => {
        if (isSuccess) {
            const t = setTimeout(() => navigate('/login'), 2000);
            return () => clearTimeout(t);
        }
    }, [isSuccess, navigate]);

    if (!token || !email) {
        return (
            <AuthLayout
                title="Access Denied"
                subtitle="Invalid Reset Protocol"
                secondarySubtitle="The request could not be verified"
                description="This reset link is either invalid or has expired. For security reasons, please request a new one."
            >
                <div className="mt-8 bg-red-500/10 border border-red-500/20 p-6 rounded-sm flex flex-col gap-4 text-center">
                    <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Security Link Compromised</p>
                    <Link to="/forgot-password" university-anchor="forgot-password" className="w-full h-14 bg-white text-slate-950 rounded-sm font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all">
                        Request New Key
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="System Security"
            subtitle="Reset your Key"
            secondarySubtitle={`Updating credentials for ${email}`}
            description="Create a strong, unique security key to protect your enterprise workspace and professional data."
        >
            {/* Alerts: Validation / Error / Success */}
            {(validationError || isError || isSuccess) && (
                <AuthAlert
                    type={isSuccess ? 'success' : 'error'}
                    title={isSuccess ? 'Frequency Updated' : 'Reset Error'}
                    message={validationError || message || 'Security key successfully updated! Redirecting to secure login...'}
                />
            )}

            <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                <div className="space-y-5">
                    <SecurePasswordInput
                        id="password"
                        label="New Security Key"
                        placeholder="Min 8+ characters"
                        registration={register('password')}
                        error={errors.password?.message}
                    />

                    <SecurePasswordInput
                        id="confirmPassword"
                        label="Re-Verify New Key"
                        placeholder="Re-enter security key"
                        registration={register('confirmPassword')}
                        error={errors.confirmPassword?.message}
                    />
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-cyber-primary w-full h-14 !rounded-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Update Security Key <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                <Link to="/login" className="text-[10px] font-bold text-secondary hover:text-main uppercase tracking-widest transition-colors flex items-center justify-center gap-2 opacity-60 hover:opacity-100">
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Abort and Return to Login
                </Link>
            </div>
        </AuthLayout>
    );
};

export default ResetPassword;
