import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register, reset } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import SecurePasswordInput from '../../components/SecurePasswordInput';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';
import { isStrongPassword, isValidPhone, formatPhoneInput } from '../../utils/authUtils';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        shopName: "",
        phone: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { name, email, password, confirmPassword, shopName, phone } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state: RootState) => state.auth
    );

    const [validationError, setValidationError] = useState("");
    const [phoneError, setPhoneError] = useState("");

    useEffect(() => {
        if (isSuccess || user) {
            navigate("/dashboard");
            dispatch(reset());
        }

        // Keep error visible; reset only on unmount
        return () => {
            dispatch(reset());
        };
    }, [user, isSuccess, navigate, dispatch]);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const nextValue = name === "phone" ? formatPhoneInput(value) : value;

        setFormData((prevState) => ({
            ...prevState,
            [name]: nextValue,
        }));

        if (name === "phone") {
            if (nextValue.length > 0 && nextValue.length < 10) {
                setPhoneError("Mobile number cannot be less than 10 digits.");
            } else {
                setPhoneError("");
            }
        }

        setValidationError("");
    };

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isValidPhone(phone)) {
            setValidationError("Phone number must be exactly 10 digits.");
            setPhoneError("Mobile number cannot be less than 10 digits.");
            return;
        }

        if (password !== confirmPassword) {
            setValidationError("Passwords do not match");
            return;
        }

        if (!isStrongPassword(password)) {
            setValidationError(
                "Password must be 8+ chars with uppercase, lowercase, number, and symbol."
            );
            return;
        }

        const userData = {
            name,
            email,
            password,
            shopName,
            phone,
        };

        dispatch(register(userData));
    };

    return (
        <AuthLayout
            title="Manage your entire business in one place."
            subtitle="Create your account"
            secondarySubtitle="Get started with your 14-day free trial. No credit card required."
            description="Streamline your billing, inventory, and accounting with our comprehensive enterprise solution. Join thousands of growing businesses today."
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
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={onChange}
                                    className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
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
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Business Name & Phone Group */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="shopName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Business Name</label>
                            <div className="mt-1">
                                <input
                                    id="shopName"
                                    name="shopName"
                                    type="text"
                                    value={shopName}
                                    onChange={onChange}
                                    className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
                                    placeholder="Acme Corp"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 flex items-center">
                                    <span className="h-full rounded-l-md border-r border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-slate-500 dark:text-slate-400 sm:text-sm font-medium transition-colors">
                                        +91
                                    </span>
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    required
                                    pattern="\d{10}"
                                    maxLength={10}
                                    value={phone}
                                    onChange={onChange}
                                    className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white pl-16 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 border transition-colors"
                                    placeholder="9876543210"
                                />
                            </div>
                            {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
                        </div>
                    </div>

                    {/* Password Group */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                            <div className="mt-1">
                                <SecurePasswordInput
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                    showPassword={showPassword}
                                    onToggleVisibility={() => setShowPassword(!showPassword)}
                                    placeholder="Min 8 chars"
                                    className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Confirm Password
                            </label>
                            <div className="mt-1">
                                <SecurePasswordInput
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={onChange}
                                    required
                                    showPassword={showConfirmPassword}
                                    onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                                    placeholder="Repeat password"
                                    className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="flex h-5 items-center">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            required
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="font-medium text-slate-700 dark:text-slate-300 transition-colors">I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Privacy Policy</a></label>
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
                                Creating Account...
                            </span>
                        ) : (
                            "Create My Account"
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm">
                <p className="text-slate-600 dark:text-slate-400 transition-colors">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                        Sign in here
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Register;
