import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import AuthInput from '../../components/Auth/AuthInput';
import { useRegisterForm } from '../../hooks/auth/useRegisterForm';

const Register: React.FC = () => {
    const { form, onSubmit, isLoading } = useRegisterForm();
    const { register, formState: { errors } } = form;
    const { isError, message, validationError } = form as any;

    return (
        <AuthLayout
            title="Enterprise Registration"
            subtitle="Start your 14-day Free Trial"
            secondarySubtitle="Set up your professional business profile"
            description="Join thousands of retailers using our platform to scale their logic. Professional tools for professional growth."
        >
            {/* Error Alert */}
            {(isError || validationError) && (
                <AuthAlert
                    type="error"
                    title="Registration Error"
                    message={validationError || message}
                />
            )}

            <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                <div className="space-y-6">
                    {/* Name & Email Group */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <AuthInput
                            id="name"
                            label="Full Name"
                            placeholder="John Doe"
                            icon={User}
                            registration={register('name')}
                            error={errors.name?.message}
                        />

                        <AuthInput
                            id="email"
                            label="Identity (Email)"
                            type="email"
                            placeholder="name@company.com"
                            icon={Mail}
                            registration={register('email')}
                            error={errors.email?.message}
                        />
                    </div>

                    {/* Business Name & Phone Group */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <AuthInput
                            id="shopName"
                            label="Enterprise Name"
                            placeholder="Acme Corp"
                            icon={Store}
                            registration={register('shopName')}
                            error={errors.shopName?.message}
                        />

                        <AuthInput
                            id="phone"
                            label="Contact Number"
                            type="tel"
                            placeholder="9876543210"
                            leftElement={
                                <span className="h-full rounded-l-2xl border-r border-slate-800 bg-slate-950 px-3 flex items-center text-slate-500 text-[10px] font-black tracking-widest transition-colors group-focus-within:text-primary group-focus-within:border-indigo-500/50">
                                    +91
                                </span>
                            }
                            registration={register('phone')}
                            error={errors.phone?.message}
                        />
                    </div>

                    {/* Password Group */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <SecurePasswordInput
                            id="password"
                            label="Security Key"
                            placeholder="Min 8 characters"
                            registration={register('password')}
                            error={errors.password?.message}
                        />

                        <SecurePasswordInput
                            id="confirmPassword"
                            label="Re-Verify Key"
                            placeholder="Repeat security key"
                            registration={register('confirmPassword')}
                            error={errors.confirmPassword?.message}
                        />
                    </div>
                </div>

                <div className="flex items-start px-1">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative flex items-center">
                            <input
                                id="terms"
                                type="checkbox"
                                {...register('terms')}
                                className="peer h-5 w-5 rounded-lg border-slate-800 bg-slate-900 text-primary focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none border-2 checked:bg-indigo-600 checked:border-indigo-600"
                            />
                            <ShieldCheck className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-3.5 h-3.5 text-white left-0.5" />
                        </div>
                        <label htmlFor="terms" className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors cursor-pointer leading-tight">
                            I agree to the <a href="#" className="underline text-primary hover:text-primary">Terms</a> and <a href="#" className="underline text-primary hover:text-primary">Privacy Policy</a>
                        </label>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-white text-slate-950 rounded-sm font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-white/5"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                        ) : (
                            <>Initialize Enterprise <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Already have access?
                    </p>
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-indigo-300 transition-colors">
                        Sign In to Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Register;
