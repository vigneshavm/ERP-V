import React, { useEffect, useState, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { performPasswordReset, resetAuthState } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import SecurePasswordInput from './SecurePasswordInput';
import AuthLayout from '../Views/AuthLayout';
import AuthAlert from '../Views/AuthAlert';
import { isStrongPassword } from "../../utils/authUtils";

const ResetPassword: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isError, isSuccess, message, user } = useSelector((state: RootState) => state.auth);

    const params = new URLSearchParams(location.search);
    const [email] = useState<string>(params.get('email') || '');
    const [token] = useState<string>(params.get('token') || '');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string>('');

    useEffect(() => {
        if (user) navigate('/dashboard');
        return () => {
            dispatch(resetAuthState());
        };
    }, [user, navigate, dispatch]);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setValidationError('');

        if (!token || !email) {
            setValidationError('Reset link is invalid. Please request a new one.');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        if (!isStrongPassword(password)) {
            setValidationError('Password must be 8+ chars with uppercase, lowercase, number, and symbol.');
            return;
        }

        dispatch(performPasswordReset({ token, email, password }));
    };

    useEffect(() => {
        // On successful reset, redirect to login after short delay
        if (isSuccess) {
            const t = setTimeout(() => navigate('/login'), 1500);
            return () => clearTimeout(t);
        }
    }, [isSuccess, navigate]);

    return (
        <AuthLayout
            title="Secure your workspace."
            subtitle="Reset your password"
            secondarySubtitle={`Set a new password for ${email || 'your account'}`}
            description="Create a strong password to protect your business data, financial records, and customer information."
        >
            {/* Alerts: Validation / Error / Success */}
            {(validationError || isError || isSuccess) && (
                <AuthAlert
                    type={isSuccess ? 'success' : 'error'}
                    title={isSuccess ? 'Success' : 'Error'}
                    message={validationError || message || 'Password successfully reset! Redirecting...'}
                />
            )}

            <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                <div className="space-y-5">
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                            New Password
                        </label>
                        <div className="mt-1">
                            <SecurePasswordInput
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                showPassword={showPassword}
                                onToggleVisibility={() => setShowPassword(!showPassword)}
                                placeholder="Min 8+ characters"
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                            Confirm New Password
                        </label>
                        <div className="mt-1">
                            <SecurePasswordInput
                                id="confirmPassword"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                showPassword={showConfirmPassword}
                                onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                                placeholder="Re-enter password"
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border"
                            />
                        </div>
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
                                Resetting...
                            </span>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm">
                <p className="text-slate-600">
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Back to Sign In
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default ResetPassword;
