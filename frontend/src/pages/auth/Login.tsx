import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, resetAuthState } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import DeviceConflictModal from '../System/Sync/Sync/DeviceConflictModal';
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';

interface LoginProps {
    isAdmin?: boolean;
}

const Login: React.FC<LoginProps> = ({ isAdmin = false }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { user, isLoading, isError, isSuccess, message, deviceConflict } = useSelector(
        (state: RootState) => state.auth
    );

    const [showConflictModal, setShowConflictModal] = useState(false);

    useEffect(() => {
        if (isSuccess || user) {
            navigate('/dashboard');
        }

        // Cleanup: reset only on unmount
        return () => {
            dispatch(resetAuthState());
        };
    }, [user, isSuccess, navigate, dispatch]);

    useEffect(() => {
        if (deviceConflict) {
            setShowConflictModal(true);
        }
    }, [deviceConflict]);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(login(formData));
    };

    return (
        <AuthLayout
            title={isAdmin ? "Super Admin Console" : "Welcome back, Partner."}
            subtitle={isAdmin ? "Restricted System Access" : "Sign in to your account"}
            secondarySubtitle={isAdmin ? "authorized personnel only" : "Enter your credentials to continue."}
            description={isAdmin ? "Secure access for system administration. All actions are logged." : "Securely access your dashboard to manage sales, inventory, and financial reports. Your business data is just a click away."}
        >
            {/* Error Alert */}
            {isError && (
                <AuthAlert
                    type="error"
                    title="Authentication Error"
                    message={message}
                />
            )}

            <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                <div className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Email Address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={onChange}
                                className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
                                placeholder="you@company.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Password
                        </label>
                        <div className="mt-1">
                            <SecurePasswordInput
                                id="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                showPassword={showPassword}
                                onToggleVisibility={() => setShowPassword(!showPassword)}
                                placeholder="Enter your password"
                                className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link to="/forgot-password" university-anchor="forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm">
                {!isAdmin && (
                    <p className="text-slate-600 dark:text-slate-400 transition-colors">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                            Start your 14-day free trial
                        </Link>
                    </p>
                )}
                {isAdmin && (
                    <Link to="/" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors">
                        ← Back to Tenant Login
                    </Link>
                )}
            </div>

            {/* Device Conflict Modal */}
            {showConflictModal && (
                <DeviceConflictModal
                    email={email}
                    password={password}
                    onClose={() => setShowConflictModal(false)}
                />
            )}
        </AuthLayout>
    );
};

export default Login;
