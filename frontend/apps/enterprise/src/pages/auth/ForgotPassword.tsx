import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, LifeBuoy } from 'lucide-react';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import AuthInput from '../../components/Auth/AuthInput';
import { useForgotPasswordForm } from '../../hooks/auth/useForgotPasswordForm';

const ForgotPassword: React.FC = () => {
    const { form, onSubmit, isLoading } = useForgotPasswordForm();
    const { register, formState: { errors } } = form;
    const { isError, isSuccess, message } = form as any;

    return (
        <AuthLayout
            title="Account Recovery"
            subtitle="Forgot Password?"
            secondarySubtitle="Initiate the secure reset protocol"
            description="Don't worry, it happens. Enter your registered email address and we'll send you a secure link to reset your credentials."
        >
            {/* Feedback Alert */}
            {(isError || isSuccess) && (
                <AuthAlert
                    type={isSuccess ? 'success' : 'error'}
                    title={isSuccess ? 'Frequency Sent' : 'Protocol Error'}
                    message={message}
                />
            )}

            <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                <AuthInput
                    id="email"
                    label="Registered Identity (Email)"
                    type="email"
                    placeholder="you@company.com"
                    icon={Mail}
                    registration={register('email')}
                    error={errors.email?.message}
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-cyber-primary w-full h-14 !rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>Send Recovery Link <ArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-8 border-t border-default text-center">
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">
                        Remembered your Key?
                    </p>
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                        Return to Sign In <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            <div className="mt-8 bg-card border border-default p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Need Support?</p>
                    <p className="text-xs text-secondary font-medium">Contact our enterprise desk for further assistance.</p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
