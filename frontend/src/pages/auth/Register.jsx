import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register, reset } from "../../redux/slices/authSlice";
import SecurePasswordInput from '../../components/SecurePasswordInput';

// Frontend password strength check mirrors backend
const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSymbol;
};

const isValidPhone = (value) => /^\d{10}$/.test(value);

const Register = () => {
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
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const [validationError, setValidationError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (isSuccess || user) {
      navigate("/dashboard");
      dispatch(reset());
    }

    // Keep error visible; reset only on unmount
    return () => dispatch(reset());
  }, [user, isSuccess, navigate, dispatch]);

  const onChange = (e) => {
    const { name, value } = e.target;
    // For phone, only allow numbers and cap at 10
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

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

  const onSubmit = (e) => {
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
    <div className="min-h-screen flex bg-slate-50">
      {/* LEFT SIDE - BRAND PANEL */}
      <div className="hidden lg:flex w-5/12 bg-slate-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'rgb(99, 102, 241)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgb(168, 85, 247)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="z-10 mt-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">BizzAI ERP</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Manage your entire business in one place.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Streamline your billing, inventory, and accounting with our comprehensive enterprise solution. Join thousands of growing businesses today.
          </p>
        </div>

        <div className="z-10 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} BizzAI Enterprise Solutions.
        </div>
      </div>

      {/* RIGHT SIDE - FORM PANEL */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h2>
            <p className="mt-2 text-sm text-slate-600">
              Get started with your 14-day free trial. No credit card required.
            </p>
          </div>

          {/* Error Alert */}
          {(isError || validationError) && (
            <div className="rounded-md bg-red-50 p-4 border-l-4 border-red-500">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Registration Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{validationError || message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <div className="space-y-6">
              {/* Name & Email Group */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700">Full Name</label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={onChange}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={onChange}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Shop Name & Phone Group */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="shopName" className="block text-sm font-semibold text-slate-700">Business Name</label>
                  <div className="mt-1">
                    <input
                      id="shopName"
                      name="shopName"
                      type="text"
                      value={shopName}
                      onChange={onChange}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">Phone Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <span className="h-full rounded-l-md border-r border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-500 sm:text-sm font-medium">
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
                      className="block w-full rounded-md border-slate-300 pl-16 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 border"
                      placeholder="9876543210"
                    />
                  </div>
                  {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
                </div>
              </div>

              {/* Password Group */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
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
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
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
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border"
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
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-slate-700">I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a></label>
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
            <p className="text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
