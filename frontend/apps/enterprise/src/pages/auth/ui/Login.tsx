import React, { useTransition } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import DeviceConflictModal from '@/pages/System/Sync/DeviceConflictModal';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../../Views/ui/AuthLayout';
import AuthAlert from '../../Views/ui/AuthAlert';
import AuthInput from '@/features/auth-by-email/ui/AuthInput';
import { useLoginForm } from '@/features/auth-by-email/lib/useLoginForm';

interface LoginProps {
    isAdmin?: boolean;
}

const Login: React.FC<LoginProps> = ({ isAdmin = false }) => {
    const { form, onSubmit, isLoading } = useLoginForm();
    const { register, formState: { errors }, watch } = form;
    const { isError, message, deviceConflict, reset } = form as any;
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            onSubmit(e);
        });
    };

    const loading = isLoading || isPending;

    return (
        <AuthLayout
            title={isAdmin ? "Super Admin Console" : "Enterprise Access"}
            subtitle={isAdmin ? "Admin Authentication" : "Welcome back"}
            secondarySubtitle={isAdmin ? "Restricted access • All actions audited" : "Sign in to your workspace"}
            description={isAdmin
                ? "Secure access for system administration. All actions are logged and audited for compliance."
                : "Manage your business operations, inventory, and analytics in a secure and professional environment."}
        >
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Error Alert */}
                {isError && (
                    <div className="mb-6">
                        <AuthAlert
                            type="error"
                            title="Authentication Failed"
                            message={message}
                        />
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <AuthInput
                            id="login-email"
                            label="Identity (Email)"
                            type="email"
                            autoComplete="email"
                            placeholder="you@company.com"
                            icon={Mail}
                            registration={register('email')}
                            error={errors.email?.message}
                        />

                        <div>
                            <div className="flex justify-between items-center mb-2.5">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Security Key</span>
                                <Link
                                    to="/forgot-password"
                                    className="text-[10px] font-bold text-indigo-400/70 hover:text-indigo-400 uppercase tracking-[0.15em] transition-colors"
                                >
                                    Recover
                                </Link>
                            </div>
                            <SecurePasswordInput
                                id="login-password"
                                placeholder="••••••••••••"
                                registration={register('password')}
                                error={errors.password?.message}
                            />
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center gap-3 group cursor-pointer px-0.5">
                        <div className="relative flex items-center">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                {...register('rememberMe')}
                                className="peer h-4 w-4 rounded-md border-white/10 bg-white/[0.04] text-indigo-500 focus:ring-indigo-500/30 transition-all cursor-pointer appearance-none border checked:bg-indigo-600 checked:border-indigo-600"
                            />
                            <ShieldCheck className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-3 h-3 text-white left-0.5" />
                        </div>
                        <label htmlFor="rememberMe" className="text-[10px] font-bold text-white/25 uppercase tracking-[0.18em] group-hover:text-white/40 transition-colors cursor-pointer">
                            Remember this device
                        </label>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:scale-100 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>Authenticate <ArrowRight className="w-3.5 h-3.5" /></>
                        )}
                    </button>
                </form>

                {/* Footer links */}
                <div className="mt-8 pt-7 border-t border-white/[0.05]">
                    {!isAdmin && (
                        <div className="text-center space-y-3">
                            <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em]">
                                New to the Platform?
                            </p>
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400/80 hover:text-indigo-300 transition-colors"
                            >
                                Start 14-day Enterprise Trial <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                    {isAdmin && (
                        <Link
                            to="/"
                            className="text-[10px] font-bold text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-3 h-3 rotate-180" /> Back to System Login
                        </Link>
                    )}
                </div>

                {/* Device Conflict Modal */}
                {deviceConflict && (
                    <DeviceConflictModal
                        email={watch('email')}
                        password={watch('password')}
                        onClose={() => reset()}
                    />
                )}
            </motion.div>
        </AuthLayout>
    );
};

export default Login;
