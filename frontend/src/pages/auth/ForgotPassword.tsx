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
                    className="w-full h-14 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-white/5"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                        <>Send Recovery Link <ArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Remembered your Key?
                    </p>
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                        Return to Sign In <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            <div className="mt-8 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Need Support?</p>
                    <p className="text-xs text-slate-500 font-medium">Contact our enterprise desk for further assistance.</p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
