import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import DeviceConflictModal from '../System/Sync/DeviceConflictModal';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import AuthInput from '../../components/Auth/AuthInput';
import { useLoginForm } from '../../hooks/auth/useLoginForm';

interface LoginProps {
    isAdmin?: boolean;
}

const Login: React.FC<LoginProps> = ({ isAdmin = false }) => {
    const { form, onSubmit, isLoading } = useLoginForm();
    const { register, formState: { errors }, watch } = form;
    const { isError, message, deviceConflict, reset } = form as any; // Hook exposes these via useAuthActions

    return (
        <AuthLayout
            title={isAdmin ? "Super Admin Console" : "Enterprise Access"}
            subtitle={isAdmin ? "Restricted System Access" : "Welcome back, Partner."}
            secondarySubtitle={isAdmin ? "authorized personnel only" : "Sign in to your workspace securely"}
            description={isAdmin
                ? "Secure access for system administration. All actions are logged and audited for compliance."
                : "Manage your business operations, inventory, and analytics in a secure and professional environment."}
        >
            {/* Error Alert */}
            {isError && (
                <AuthAlert
                    type="error"
                    title="Authentication Failed"
                    message={message}
                />
            )}

            <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                <div className="space-y-5">
                    <AuthInput
                        id="email"
                        label="Identity (Email)"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        icon={Mail}
                        registration={register('email')}
                        error={errors.email?.message}
                    />

                    <SecurePasswordInput
                        id="password"
                        label="Security Key"
                        placeholder="••••••••••••"
                        registration={register('password')}
                        error={errors.password?.message}
                    />
                </div>

                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative flex items-center">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                {...register('rememberMe')}
                                className="peer h-5 w-5 rounded-lg border-default bg-card text-primary focus:ring-primary/50 transition-all cursor-pointer appearance-none border-2 checked:bg-primary checked:border-primary"
                            />
                            <ShieldCheck className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-3.5 h-3.5 text-white left-0.5" />
                        </div>
                        <label htmlFor="rememberMe" className="text-[10px] font-bold text-secondary uppercase tracking-widest group-hover:text-main transition-colors cursor-pointer opacity-60 group-hover:opacity-100">
                            Remember Access
                        </label>
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-widest">
                        <Link to="/forgot-password" university-anchor="forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                            Recover Key
                        </Link>
                    </div>
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
                            <>Authenticate Access <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-8 border-t border-default text-center">
                {!isAdmin && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">
                            New to the Platform?
                        </p>
                        <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                            Start 14-day Enterprise Trial <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}
                {isAdmin && (
                    <Link to="/" className="text-[10px] font-bold text-secondary hover:text-main uppercase tracking-widest transition-colors flex items-center justify-center gap-2 opacity-60 hover:opacity-100">
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to System Login
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
        </AuthLayout>
    );
};

export default Login;
