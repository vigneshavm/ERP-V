import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import DeviceConflictModal from '../System/Sync/DeviceConflictModal';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import AuthInput from '../../components/Auth/AuthInput';
import { useLoginForm } from '../../hooks/auth/useLoginForm';
import { resetAuthState } from '../../redux/slices/authSlice';

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
                                className="peer h-5 w-5 rounded-lg border-slate-800 bg-slate-900 text-indigo-500 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none border-2 checked:bg-indigo-600 checked:border-indigo-600"
                            />
                            <ShieldCheck className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-3.5 h-3.5 text-white left-0.5" />
                        </div>
                        <label htmlFor="rememberMe" className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors cursor-pointer">
                            Remember Access
                        </label>
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-widest">
                        <Link to="/forgot-password" university-anchor="forgot-password" className="text-indigo-500 hover:text-indigo-400 transition-colors">
                            Recover Key
                        </Link>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-white/5"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                        ) : (
                            <>Authenticate Access <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                {!isAdmin && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            New to the Platform?
                        </p>
                        <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                            Start 14-day Enterprise Trial <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}
                {isAdmin && (
                    <Link to="/" className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
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
