import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { logout, setAuthError, setAuthSuccess } from '../redux/slices/authSlice';
import api from '../services/api';
import { clearSession } from '../utils/session';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isSuccess, isError } = useSelector((state: RootState) => state.auth);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [localError, setLocalError] = useState('');

    const [validation, setValidation] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    });

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Use backend to verify reset token/session
                setSessionChecked(true);
            } catch (e) {
                dispatch(setAuthError("Session invalid or link expired. Please request a new security link."));
                setSessionChecked(true);
            }
        };
        checkSession();
        return () => {
            dispatch(setAuthSuccess(false));
            dispatch(setAuthError(null));
        };
    }, [dispatch]);

    useEffect(() => {
        setValidation({
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        });
    }, [password]);

    const strengthScore = Object.values(validation).filter(Boolean).length;
    const isPasswordStrong = validation.length && strengthScore >= 4;

    const getStrengthColor = () => {
        if (strengthScore <= 2) return 'bg-red-500';
        if (strengthScore <= 3) return 'bg-orange-500';
        if (strengthScore <= 4) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const getStrengthLabel = () => {
        if (strengthScore === 0) return 'Very Weak';
        if (strengthScore <= 2) return 'Weak';
        if (strengthScore <= 3) return 'Fair';
        if (strengthScore <= 4) return 'Good';
        return 'Strong';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        dispatch(setAuthError(null));

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match. Please verify.");
            return;
        }

        if (!isPasswordStrong) {
            setLocalError("Security standards not met. Follow the checklist below.");
            return;
        }

        try {
            await api.post('/auth/reset-password', { password });
            dispatch(setAuthSuccess(true));
        } catch (err: any) {
            dispatch(setAuthError(err.message));
        }
    };

    useEffect(() => {
        if (isSuccess) {
            dispatch(logout());
            clearSession();
            const timer = setTimeout(() => navigate('/'), 2500);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, navigate, dispatch]);

    if (!sessionChecked) {
        return (
            <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden bg-[#0F172A]">
            {/* Professional Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <div className="relative z-10 w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-slate-900/50 backdrop-blur-3xl border border-white/5 rounded-3xl md:rounded-[2.5rem] shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 max-h-[90dvh] overflow-y-auto scrollbar-none">

                    {/* Enterprise Identity */}
                    <div className="mb-6 md:mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Security Node</span>
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Set New Password</h1>
                        <p className="text-slate-400 text-xs sm:text-sm font-medium">Resetting access for your Enterprise Account</p>
                    </div>

                    {isSuccess ? (
                        <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-8">
                            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Update Successful</h2>
                            <p className="text-slate-400 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
                                Your security credentials have been synchronized. Redirecting for authentication...
                            </p>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 animate-[progress_2s_ease-in-out]" style={{ width: '100%' }} />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                            <div className="space-y-4 md:space-y-5">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">New Password</label>
                                    <div className="relative">
                                        <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-4 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 8 characters"
                                            className="w-full h-14 pl-12 pr-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white font-mono tracking-widest transition-all p-4"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Confirm Identity</label>
                                    <div className="relative">
                                        <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-4 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat password"
                                            className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white font-mono tracking-widest transition-all p-4"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Strength Meter */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end px-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Strength</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${getStrengthColor().replace('bg-', 'text-')}`}>
                                        {getStrengthLabel()}
                                    </span>
                                </div>
                                <div className="flex gap-1 h-1">
                                    {[1, 2, 3, 4, 5].map((lvl) => (
                                        <div
                                            key={lvl}
                                            className={`flex-1 rounded-full transition-all duration-500 ${lvl <= strengthScore ? getStrengthColor() : 'bg-white/5'}`}
                                        />
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pt-1">
                                    <Requirement label="Length" met={validation.length} />
                                    <Requirement label="Uppercase" met={validation.upper} />
                                    <Requirement label="Lowercase" met={validation.lower} />
                                    <Requirement label="Special" met={validation.special} />
                                </div>
                            </div>

                            {(isError || localError) && (
                                <div className="flex items-center gap-3 text-xs font-bold p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl animate-in zoom-in-95">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{isError || localError}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !isPasswordStrong}
                                className="w-full h-16 bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.99] rounded-[1.25rem] font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>Verify & Set New Key <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                            <div className="pt-4 md:pt-6 border-t border-white/5 flex items-center justify-center gap-3 grayscale opacity-40">
                                <div className="flex -space-x-1">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-800 border border-slate-700" />
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-800 border border-slate-700" />
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-800 border border-slate-700" />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">Enterprise Grade Encryption</span>
                            </div>
                        </form>
                    )}
                </div>

                <p className="mt-4 md:mt-8 text-center text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Secure Transmission Active
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .scrollbar-none::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-none {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            ` }} />
        </div >
    );
};

const Requirement = ({ label, met }: { label: string, met: boolean }) => (
    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${met ? 'text-emerald-400' : 'text-slate-600'}`}>
        <div className={`w-1 h-1 rounded-full ${met ? 'bg-emerald-400' : 'bg-slate-800'}`} />
        {label}
    </div>
);

export default ResetPassword;
