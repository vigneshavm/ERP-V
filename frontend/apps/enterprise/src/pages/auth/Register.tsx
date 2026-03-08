import React, { useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Store, Phone, ArrowRight, ArrowLeft, ShieldCheck, Loader2, ChevronRight, Zap, Target, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import AuthInput from '../../components/Auth/AuthInput';
import PasswordStrengthMeter from '../../components/Auth/PasswordStrengthMeter';
import { useRegisterForm } from '../../hooks/auth/useRegisterForm';

const STEPS = [
    { id: 1, label: 'Identity', fields: ['name', 'email'] as const, icon: User },
    { id: 2, label: 'Enterprise', fields: ['shopName', 'phone'] as const, icon: Store },
    { id: 3, label: 'Security', fields: ['password', 'confirmPassword', 'terms'] as const, icon: Lock },
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
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0, filter: 'blur(8px)' }),
        center: { x: 0, opacity: 1, filter: 'blur(0px)' },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0, filter: 'blur(8px)' }),
    };

    return (
        <AuthLayout
            title="Entity Initialisation"
            subtitle="Architect Your Workspace"
            secondarySubtitle="Phase: Rapid Enterprise Provisioning"
            description="Joining the global network of high-performance enterprises. Deploying sovereign business intelligence and scalable operational frameworks."
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-10"
            >
                {/* Error Pulse */}
                <AnimatePresence mode="wait">
                    {(isError || validationError) && (
                        <AuthAlert
                            type="error"
                            title="Infrastructure Refinement Required"
                            message={validationError || message}
                        />
                    )}
                </AnimatePresence>

                {/* Business Blueprint HUD (Step Indicator) */}
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl space-y-6 relative overflow-hidden group/hud">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/hud:scale-110 transition-all duration-1000">
                        <Target className="w-20 h-20 text-indigo-500" />
                    </div>
                    
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">Deployment Phase</span>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] italic flex items-center gap-2">
                             0{step} / 03 <Zap className="w-3 h-3 animate-pulse" />
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => {
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;
                            const Icon = s.icon;
                            return (
                                <React.Fragment key={s.id}>
                                    <div className="flex flex-col items-center gap-2 group/step cursor-help">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-700 relative overflow-hidden ${
                                                isCompleted
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                    : isActive
                                                        ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]'
                                                        : 'bg-white/[0.03] text-white/10 border border-white/[0.05]'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                                            {isCompleted && (
                                                <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/[0.03]">
                                            <motion.div 
                                                className="h-full bg-indigo-500/40"
                                                initial={{ width: '0%' }}
                                                animate={{ width: isCompleted ? '100%' : '0%' }}
                                                transition={{ duration: 0.8 }}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                    
                    <div className="px-1">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">
                            Current: <span className="text-white/80">{STEPS[step-1].label} Validation</span>
                        </p>
                    </div>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-8">
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
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-6"
                            >
                                <AuthInput
                                    id="register-name"
                                    label="Legal Identity"
                                    placeholder="Full Name"
                                    icon={User}
                                    registration={register('name')}
                                    error={errors.name?.message}
                                />
                                <AuthInput
                                    id="register-email"
                                    label="Communications Node (Email)"
                                    type="email"
                                    placeholder="node@enterprise.network"
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
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-6"
                            >
                                <AuthInput
                                    id="register-shopName"
                                    label="Enterprise Designation"
                                    placeholder="Organization Name"
                                    icon={Store}
                                    registration={register('shopName')}
                                    error={errors.shopName?.message}
                                />
                                <AuthInput
                                    id="register-phone"
                                    label="Operational Contact"
                                    type="tel"
                                    placeholder="9876543210"
                                    leftElement={
                                        <span className="h-full px-5 flex items-center text-white/20 text-[10px] font-black tracking-widest italic border-r border-white/5">
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
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                     <SecurePasswordInput
                                        id="register-password"
                                        label="Access Secret"
                                        placeholder="Min 8 Complex Units"
                                        registration={register('password')}
                                        error={errors.password?.message}
                                    />
                                    <PasswordStrengthMeter password={passwordValue} />
                                </div>

                                <SecurePasswordInput
                                    id="register-confirmPassword"
                                    label="Verify Secret"
                                    placeholder="Re-initialise Secret"
                                    registration={register('confirmPassword')}
                                    error={errors.confirmPassword?.message}
                                />

                                {/* Tactical Switch - Terms */}
                                <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] group cursor-pointer transition-colors hover:bg-white/[0.04]">
                                    <div className="relative flex items-center mt-1">
                                        <input
                                            id="register-terms"
                                            type="checkbox"
                                            {...register('terms')}
                                            className="peer h-5 w-5 rounded-lg border-white/10 bg-white/[0.03] text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none border checked:bg-indigo-600 checked:border-indigo-600"
                                        />
                                        <ShieldCheck className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-3.5 h-3.5 text-white left-0.5" />
                                    </div>
                                    <label htmlFor="register-terms" className="text-[10px] font-bold text-white/30 leading-relaxed cursor-pointer group-hover:text-white/50 transition-colors uppercase tracking-widest italic">
                                        I accept the <a href="#" className="text-indigo-400 border-b border-indigo-400/20 hover:border-indigo-400">Terms of Operation</a> and <a href="#" className="text-indigo-400 border-b border-indigo-400/20 hover:border-indigo-400">Privacy Protocols</a>
                                    </label>
                                </div>
                                {errors.terms && (
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest italic flex items-center gap-2 px-1">
                                        <div className="w-1 h-1 rounded-full bg-rose-500" />
                                        {errors.terms?.message}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Industrial Navigation Controls */}
                    <div className="flex items-center gap-4">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="h-14 px-8 bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/80 hover:bg-white/[0.06] rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] italic flex items-center gap-3 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                REVERT
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)]"
                            >
                                PROCEED PHASE <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex-1 h-14 overflow-hidden rounded-[1.5rem] bg-indigo-600 font-black text-[12px] uppercase tracking-[0.2em] italic text-white shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>INITIALISE INSTANCE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </span>
                            </button>
                        )}
                    </div>
                </form>

                {/* Vault Linker Footer */}
                <div className="mt-12 pt-8 border-t border-white/[0.05] text-center space-y-4">
                    <p className="text-[10px] font-black text-white/15 uppercase tracking-[0.3em] italic">
                        Established Identity?
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-black text-indigo-400 hover:text-indigo-300 transition-all uppercase tracking-widest italic group"
                    >
                        INITIALISE SIGN_IN <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </motion.div>
        </AuthLayout>
    );
};

export default Register;
