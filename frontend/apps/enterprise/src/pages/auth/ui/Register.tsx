import React, { useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Store, Phone, ArrowRight, ArrowLeft, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '@/pages/Views/ui/AuthLayout';
import AuthAlert from '@/pages/Views/ui/AuthAlert';
import AuthInput from '@/features/auth-by-email/ui/AuthInput';
import PasswordStrengthMeter from '@/features/auth-by-email/ui/PasswordStrengthMeter';
import { useRegisterForm } from '@/features/auth-by-email/lib/useRegisterForm';

const STEPS = [
    { id: 1, label: 'Identity', fields: ['name', 'email'] as const },
    { id: 2, label: 'Business', fields: ['shopName', 'phone'] as const },
    { id: 3, label: 'Security', fields: ['password', 'confirmPassword', 'terms'] as const },
];

const Register: React.FC = () => {
    const { form, onSubmit, isLoading } = useRegisterForm();
    const { register, formState: { errors }, trigger, watch } = form;
    const { isError, message, validationError } = form as any;
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [isPending, startTransition] = useTransition();

    const passwordValue = watch('password') || '';

    const nextStep = async () => {
        const currentFields = STEPS[step - 1].fields;
        const isValid = await trigger(currentFields as any);
        if (isValid && step < 3) {
            setDirection(1);
            startTransition(() => setStep(step + 1));
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setDirection(-1);
            startTransition(() => setStep(step - 1));
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isValid = await trigger();
        if (isValid) {
            startTransition(() => {
                onSubmit(e);
            });
        }
    };

    const loading = isLoading || isPending;

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
    };

    return (
        <AuthLayout
            title="Enterprise Registration"
            subtitle="Create your workspace"
            secondarySubtitle="Start your 14-day free trial"
            description="Join thousands of retailers using our platform to scale their business. Professional tools for professional growth."
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Error Alert */}
                {(isError || validationError) && (
                    <div className="mb-6">
                        <AuthAlert
                            type="error"
                            title="Registration Error"
                            message={validationError || message}
                        />
                    </div>
                )}

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${step > s.id
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                        : step === s.id
                                            ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                                            : 'bg-white/[0.03] text-white/15 border border-white/[0.05]'
                                        }`}
                                >
                                    {step > s.id ? '✓' : s.id}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 hidden sm:block ${step >= s.id ? 'text-white/40' : 'text-white/10'
                                    }`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-px transition-colors duration-500 ${step > s.id ? 'bg-emerald-500/20' : 'bg-white/[0.04]'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <form onSubmit={handleFinalSubmit}>
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* STEP 1: Identity */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-5"
                            >
                                <AuthInput
                                    id="register-name"
                                    label="Full Name"
                                    placeholder="John Doe"
                                    icon={User}
                                    registration={register('name')}
                                    error={errors.name?.message}
                                />
                                <AuthInput
                                    id="register-email"
                                    label="Email Address"
                                    type="email"
                                    placeholder="name@company.com"
                                    icon={Mail}
                                    registration={register('email')}
                                    error={errors.email?.message}
                                />
                            </motion.div>
                        )}

                        {/* STEP 2: Business Profile */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-5"
                            >
                                <AuthInput
                                    id="register-shopName"
                                    label="Business Name"
                                    placeholder="Acme Corporation"
                                    icon={Store}
                                    registration={register('shopName')}
                                    error={errors.shopName?.message}
                                />
                                <AuthInput
                                    id="register-phone"
                                    label="Contact Number"
                                    type="tel"
                                    placeholder="9876543210"
                                    leftElement={
                                        <span className="h-full rounded-l-xl border-r border-white/[0.06] bg-white/[0.03] px-3 flex items-center text-white/25 text-[10px] font-bold tracking-[0.15em] transition-colors group-focus-within:text-indigo-400/60">
                                            +91
                                        </span>
                                    }
                                    registration={register('phone')}
                                    error={errors.phone?.message}
                                />
                            </motion.div>
                        )}

                        {/* STEP 3: Security */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-5"
                            >
                                <SecurePasswordInput
                                    id="register-password"
                                    label="Create Password"
                                    placeholder="Min 8 characters"
                                    registration={register('password')}
                                    error={errors.password?.message}
                                />

                                <PasswordStrengthMeter password={passwordValue} />

                                <SecurePasswordInput
                                    id="register-confirmPassword"
                                    label="Confirm Password"
                                    placeholder="Re-enter password"
                                    registration={register('confirmPassword')}
                                    error={errors.confirmPassword?.message}
                                />

                                {/* Terms */}
                                <div className="flex items-start gap-3 pt-1 group cursor-pointer">
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            id="register-terms"
                                            type="checkbox"
                                            {...register('terms')}
                                            className="peer h-4 w-4 rounded-md border-white/10 bg-white/[0.04] text-indigo-500 focus:ring-indigo-500/30 transition-all cursor-pointer appearance-none border checked:bg-indigo-600 checked:border-indigo-600"
                                        />
                                        <ShieldCheck className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-3 h-3 text-white left-0.5" />
                                    </div>
                                    <label htmlFor="register-terms" className="text-[10px] font-medium text-white/25 leading-relaxed cursor-pointer group-hover:text-white/35 transition-colors">
                                        I agree to the <a href="#" className="text-indigo-400/70 hover:text-indigo-400 underline underline-offset-2">Terms of Service</a> and <a href="#" className="text-indigo-400/70 hover:text-indigo-400 underline underline-offset-2">Privacy Policy</a>
                                    </label>
                                </div>
                                {errors.terms && (
                                    <p className="text-[11px] text-red-400/90 font-medium flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                                        {errors.terms?.message}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-3 mt-8">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="h-12 px-5 bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/[0.06] rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 shadow-lg shadow-indigo-600/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Initialize Enterprise <ArrowRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-7 border-t border-white/[0.05] text-center">
                    <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] mb-3">
                        Already have access?
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400/80 hover:text-indigo-300 transition-colors"
                    >
                        Sign In to Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </motion.div>
        </AuthLayout>
    );
};

export default Register;
