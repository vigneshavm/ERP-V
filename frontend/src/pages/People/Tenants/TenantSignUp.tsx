import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    Building2,
    User,
    Mail,
    Phone,
    Lock,
    Globe,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Store,
    Sparkles,
    ShieldCheck,
    Zap,
    Eye,
    EyeOff,
    AlertCircle
} from 'lucide-react';
import { Sector } from "../../../types/common";
import { APP_CONFIG } from "../../../config";
import api from "../../../services/api.js";
import { DATA_MODE } from "../../../services/dataSource";
import { securePassword } from "../../../utils/auth";
import { registrationUtil } from "../../../utils/registrationUtil";

// Use native crypto.randomUUID() for generating UUIDs
const generateId = () => crypto.randomUUID();

interface TenantSignUpProps {
    onComplete: () => void;
    onBackToLogin: () => void;
}

const SECTORS = [
    { id: Sector.GENERAL, name: 'General Retail', icon: '🏪' },
    { id: Sector.TEXTILE, name: 'Textile & Apparel', icon: '🧵' },
    { id: Sector.PHARMACY, name: 'Pharmacy', icon: '💊' },
    { id: Sector.GROCERY, name: 'Grocery', icon: '🛒' },
    { id: Sector.ELECTRONICS, name: 'Electronics', icon: '📱' },
    { id: Sector.FMCG, name: 'FMCG', icon: '📦' },
];

const TenantSignUp: React.FC<TenantSignUpProps> = ({ onComplete, onBackToLogin }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Business Info
    const [businessName, setBusinessName] = useState('');
    const [sector, setSector] = useState<string>(Sector.GENERAL);
    const [subdomain, setSubdomain] = useState('');

    // Step 2: Owner Account
    const [ownerName, setOwnerName] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [ownerMobile, setOwnerMobile] = useState('');
    const [ownerPassword, setOwnerPassword] = useState('');

    // Auto-generate subdomain from business name
    const handleBusinessNameChange = (name: string) => {
        setBusinessName(name);
        const generatedSubdomain = name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 20);
        setSubdomain(generatedSubdomain);
    };

    const validateStep1 = () => {
        if (!businessName.trim()) {
            setError('Business name is required');
            return false;
        }
        if (!subdomain.trim() || subdomain.length < 3) {
            setError('Subdomain must be at least 3 characters');
            return false;
        }
        setError('');
        return true;
    };

    const validateStep2 = () => {
        if (!ownerName.trim()) {
            setError('Owner name is required');
            return false;
        }
        if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
            setError('Valid email is required');
            return false;
        }
        if (!ownerMobile.trim() || ownerMobile.length < 10) {
            setError('Valid mobile number is required');
            return false;
        }
        if (!ownerPassword || ownerPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        setError('');
        return true;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handleBack = () => {
        setError('');
        if (step === 2) setStep(1);
        else if (step === 3) setStep(2);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        try {
            if (DATA_MODE === 'DEMO') {
                // Use registrationUtil for demo mode
                registrationUtil.registerTenant({
                    businessName: businessName,
                    businessType: 'Retail',
                    sector: sector,
                    city: 'Default City',
                    state: 'Default State',
                    modules: ['DASHBOARD', 'POS', 'INVENTORY', 'CUSTOMERS', 'SALES', 'GROW'],
                    adminName: ownerName,
                    adminEmail: ownerEmail,
                    adminMobile: ownerMobile,
                    adminPassword: ownerPassword,
                    preferredLogin: 'email',
                    employeeCount: 1,
                    branchCount: 1
                });
            } else {
                // Add to Backend (which handles DB)

                await api.post('/auth/register-tenant', {
                    businessName,
                    sector,
                    subdomain,
                    ownerName,
                    ownerEmail,
                    ownerMobile,
                    ownerPassword
                });
            }

            // Success - redirect to login
            onComplete();

        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-hidden bg-slate-900">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/20 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            {/* Sign Up Card */}
            <div className="relative z-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl p-8 md:p-12">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                            Start Your Journey
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Register your business and unlock the Growth Platform
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${step >= s
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                    : 'bg-white/10 text-slate-500'
                                    }`}>
                                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-12 h-1 rounded-full transition-all ${step > s ? 'bg-indigo-600' : 'bg-white/10'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-white mb-1">Business Information</h2>
                                <p className="text-slate-400 text-xs">Tell us about your business</p>
                            </div>

                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Business Name</label>
                                    <div className="relative">
                                        <Store className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => handleBusinessNameChange(e.target.value)}
                                            placeholder="Your Business Name"
                                            className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Industry Sector</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {SECTORS.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setSector(s.id)}
                                                className={`p-4 rounded-2xl border text-left transition-all ${sector === s.id
                                                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="text-2xl mb-2 block">{s.icon}</span>
                                                <span className="text-xs font-bold">{s.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Store URL</label>
                                    <div className="relative">
                                        <Globe className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                                        <input
                                            type="text"
                                            value={subdomain}
                                            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                            placeholder="yourstore"
                                            className="w-full h-14 pl-12 pr-28 bg-white/5 border border-white/10 rounded-2xl text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                        <span className="absolute right-4 top-4 text-slate-500 text-sm font-medium">.app.com</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-white mb-1">Owner Account</h2>
                                <p className="text-slate-400 text-xs">Create your admin credentials</p>
                            </div>

                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                                        <input
                                            type="text"
                                            value={ownerName}
                                            onChange={(e) => setOwnerName(e.target.value)}
                                            placeholder="Your Name"
                                            className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                                            <input
                                                type="email"
                                                value={ownerEmail}
                                                onChange={(e) => setOwnerEmail(e.target.value)}
                                                placeholder="you@business.com"
                                                className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Mobile</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                                            <input
                                                type="tel"
                                                value={ownerMobile}
                                                onChange={(e) => setOwnerMobile(e.target.value)}
                                                placeholder="9876543210"
                                                className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={ownerPassword}
                                            onChange={(e) => setOwnerPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full h-14 pl-12 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-4 text-slate-500 hover:text-indigo-400 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-white mb-1">Confirm & Launch</h2>
                                <p className="text-slate-400 text-xs">Review your details and start growing</p>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Business</p>
                                        <p className="text-white font-bold">{businessName}</p>
                                        <p className="text-slate-400 text-xs">{subdomain}.app.com • {SECTORS.find(s => s.id === sector)?.name}</p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Owner Account</p>
                                        <p className="text-white font-bold">{ownerName}</p>
                                        <p className="text-slate-400 text-xs">{ownerEmail} • {ownerMobile}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits Preview */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { icon: Zap, label: 'Growth Platform', color: 'text-violet-400' },
                                    { icon: ShieldCheck, label: 'Secure & Scalable', color: 'text-emerald-400' },
                                    { icon: Sparkles, label: 'AI Insights', color: 'text-amber-400' }
                                ].map((benefit, idx) => (
                                    <div key={idx} className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <benefit.icon className={`w-6 h-6 ${benefit.color} mx-auto mb-2`} />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{benefit.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-3 text-xs font-bold p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mt-6 animate-in zoom-in-95">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex-1 h-14 bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex-1 h-14 bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-xl"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex-1 h-14 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-violet-500 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>Launch Business <Sparkles className="w-4 h-4" /></>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Back to Login */}
                    <button
                        type="button"
                        onClick={onBackToLogin}
                        className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors py-4 mt-4"
                    >
                        Already have an account? Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TenantSignUp;
