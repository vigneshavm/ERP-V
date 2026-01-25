import React, { useState, useEffect, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset, reset } from '../../redux/slices/authSlice';
import { RootState, AppDispatch } from '../../redux/store';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState<string>('');

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { isLoading, isError, isSuccess, message, user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        // If already logged in, go to dashboard
        if (user) navigate('/dashboard');

        return () => {
            dispatch(reset());
        };
    }, [user, navigate, dispatch]);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email) return;
        dispatch(requestPasswordReset(email));
    };

    return (
        <AuthLayout
            title="Recover your account."
            subtitle="Forgot Password?"
            secondarySubtitle="Enter your registered email address and we'll send you a link to reset your password."
            description="Don't worry, it happens. We'll help you reset your password and get back to managing your business in no time."
        >
            {/* Feedback Alert */}
            {(isError || isSuccess) && (
                <AuthAlert
                    type={isSuccess ? 'success' : 'error'}
                    title={isSuccess ? 'Email Sent' : 'Error'}
                    message={message}
                />
            )}

            <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                        Email Address
                    </label>
                    <div className="mt-1">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border"
                            placeholder="you@company.com"
                        />
                    </div>
                </div>

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
                            Sending Link...
                        </span>
                    ) : (
                        'Send Reset Link'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <p className="text-slate-600">
                    Remember your password?{' '}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Sign in here
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
