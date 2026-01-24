import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { performPasswordReset, reset } from '../../redux/slices/authSlice';
import SecurePasswordInput from '../../components/SecurePasswordInput';

const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSymbol;
};

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, message, user } = useSelector((s) => s.auth);

  const params = new URLSearchParams(location.search);
  const [email] = useState(params.get('email') || '');
  const [token] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard');
    return () => dispatch(reset());
  }, [user, navigate, dispatch]);

  const onSubmit = (e) => {
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
            Secure your workspace.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Create a strong password to protect your business data, financial records, and customer information.
          </p>
        </div>

        <div className="z-10 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} BizzAI Enterprise Solutions.
        </div>
      </div>

      {/* RIGHT SIDE - FORM PANEL */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Reset your password</h2>
            <p className="mt-2 text-sm text-slate-600">
              Set a new password for <span className="font-semibold text-slate-800">{email || 'your account'}</span>
            </p>
          </div>

          {/* Alerts: Validation / Error / Success */}
          {(validationError || isError || isSuccess) && (
            <div className={`rounded-md p-4 border-l-4 ${validationError || isError ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
              }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {validationError || isError ? (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${validationError || isError ? 'text-red-800' : 'text-green-800'}`}>
                    {isSuccess ? 'Success' : 'Error'}
                  </h3>
                  <div className={`mt-2 text-sm ${validationError || isError ? 'text-red-700' : 'text-green-700'}`}>
                    <p>{validationError || message || 'Password successfully reset! Redirecting...'}</p>
                  </div>
                </div>
              </div>
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
