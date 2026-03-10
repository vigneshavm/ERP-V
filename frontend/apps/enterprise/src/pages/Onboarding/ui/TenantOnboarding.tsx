/**
 * Tenant Onboarding Wizard
 * 
 * Multi-step wizard for new tenant signup with:
 * - Welcome & tips
 * - Business information collection
 * - Team setup
 * - Feature selection
 * - Plan recommendation
 * - Plan comparison & confirmation
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '@/entities/session/model/authSlice';
import { setSession } from "@/shared/lib/utils/session";
import { registrationUtil } from "@/features/tenant-onboarding/lib/registrationUtil";
import {
    Building2, Users, Package, Zap, CreditCard, CheckCircle, ChevronRight,
    ChevronLeft, Sparkles, ArrowRight, Globe, Shield, Crown, Info,
    Check, X, Gift, HelpCircle, Lightbulb, PlayCircle, Settings, Clock,
    Edit3, Plus, Minus, Calculator
} from 'lucide-react';
import { SECTORS, BUSINESS_TYPES, MODULES, PLANS, FEATURE_MATRIX, Plan } from '@/entities/session/api/plans';
import { recommendPlan, BusinessProfile, getRecommendedModules, calculateCustomPricing } from "@/features/tenant-onboarding/lib/planRecommendationEngine";

// Step definitions
const STEPS = [
    { id: 1, name: 'Welcome', icon: Sparkles },
    { id: 2, name: 'Business', icon: Building2 },
    { id: 3, name: 'Team', icon: Users },
    { id: 4, name: 'Features', icon: Package },
    { id: 5, name: 'Plan', icon: Zap },
    { id: 6, name: 'Confirm', icon: CheckCircle }
];

const TenantOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [sector, setSector] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [employeeCount, setEmployeeCount] = useState(1);
    const [branchCount, setBranchCount] = useState(1);
    const [expectedTransactions, setExpectedTransactions] = useState<'low' | 'medium' | 'high' | 'very_high'>('medium');
    const [selectedModules, setSelectedModules] = useState<string[]>(['pos', 'inventory']);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    // Plan customization state
    const [showPlanCustomizer, setShowPlanCustomizer] = useState(false);
    const [customizingPlan, setCustomizingPlan] = useState<Plan | null>(null);
    const [additionalUsers, setAdditionalUsers] = useState(0);
    const [additionalBranches, setAdditionalBranches] = useState(0);
    const [customModules, setCustomModules] = useState<string[]>([]);
    const [skippedPlanSelection, setSkippedPlanSelection] = useState(false);

    // Admin account state (for login)
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminMobile, setAdminMobile] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [preferredLogin, setPreferredLogin] = useState<'email' | 'mobile'>('mobile');

    // Build business profile for recommendation
    const businessProfile: BusinessProfile = useMemo(() => ({
        businessName,
        businessType,
        sector,
        location: { city, state },
        gstNumber,
        employeeCount,
        branchCount,
        expectedTransactions,
        selectedModules
    }), [businessName, businessType, sector, city, state, gstNumber, employeeCount, branchCount, expectedTransactions, selectedModules]);

    // Get recommendation
    const recommendation = useMemo(() => {
        if (currentStep >= 5) {
            return recommendPlan(businessProfile);
        }
        return null;
    }, [businessProfile, currentStep]);

    // Auto-select recommended modules based on business type and sector
    React.useEffect(() => {
        if (businessType && sector) {
            const recommended = getRecommendedModules(businessType, sector);
            setSelectedModules(prev => [...new Set([...prev, ...recommended])]);
        }
    }, [businessType, sector]);

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const toggleModule = (moduleId: string) => {
        setSelectedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(m => m !== moduleId)
                : [...prev, moduleId]
        );
    };

    // Render progress stepper
    const renderStepper = () => (
        <div className="flex items-center justify-between mb-8 px-4">
            {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-brand-600 text-white scale-110 shadow-lg shadow-brand-600/30' :
                                isCompleted ? 'bg-emerald-500 text-white' :
                                    'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                                }`}>
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${isActive ? 'text-brand-600' :
                                isCompleted ? 'text-emerald-600' :
                                    'text-neutral-400'
                                }`}>
                                {step.name}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-700'
                                }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    // Step 1: Welcome
    const renderWelcome = () => (
        <div className="text-center space-y-8 py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-brand-600/20">
                <Sparkles className="w-12 h-12 text-white" />
            </div>

            <div>
                <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-3">
                    Welcome to Your ERP Journey
                </h1>
                <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                    Let's set up your business in just a few minutes. We'll help you choose the perfect plan for your needs.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[
                    { icon: Lightbulb, title: 'Smart Setup', desc: 'Answer a few questions' },
                    { icon: Zap, title: 'AI Recommendation', desc: 'Get personalized plan' },
                    { icon: Gift, title: 'Start Free', desc: 'No credit card required' }
                ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                        <item.icon className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                        <div className="font-bold text-sm">{item.title}</div>
                        <div className="text-xs text-neutral-500">{item.desc}</div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 max-w-lg mx-auto">
                <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <div className="font-bold text-sm text-blue-800 dark:text-blue-200">Quick Tip</div>
                        <div className="text-sm text-blue-600 dark:text-blue-300">
                            You can always change your plan later. Start with what fits now and upgrade as you grow.
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={nextStep}
                className="btn btn-primary btn-lg text-lg px-12 py-4 rounded-xl shadow-xl shadow-brand-600/20"
            >
                Let's Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </button>
        </div>
    );

    // Step 2: Business Info
    const renderBusinessInfo = () => (
        <div className="space-y-10 max-w-3xl mx-auto step-bounce">
            <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Build Your Core</h2>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-tight">Help us tailor the ERP to your business model</p>
            </div>

            <div className="space-y-10">
                <div className="glass-card p-2 rounded-[2rem] border-neutral-200/50 dark:border-white/5">
                    <div className="p-6 space-y-8">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2 ml-1">Business Name</label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                placeholder="e.g., Vijayalakshmi Textiles & Readymades"
                                className="input text-xl py-4 px-6 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20 focus:scale-[1.01] transition-transform"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-4 ml-1">Business Type</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {BUSINESS_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setBusinessType(type.id)}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 ${businessType === type.id
                                            ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/20 scale-[1.02] shadow-lg shadow-brand-600/10'
                                            : 'border-neutral-100 dark:border-neutral-800 bg-white/30 dark:bg-black/10 hover:border-brand-300'
                                            }`}
                                    >
                                        <div className="font-bold text-base mb-1">{type.name}</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{type.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-4 ml-1">Industry / Sector</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {SECTORS.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSector(s.id)}
                                        className={`p-4 rounded-2xl border-2 text-center transition-all duration-300 ${sector === s.id
                                            ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/20 scale-[1.05] shadow-lg shadow-brand-600/10'
                                            : 'border-neutral-100 dark:border-neutral-800 bg-white/30 dark:bg-black/10 hover:border-brand-200'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">{s.icon}</div>
                                        <div className="text-[10px] font-black uppercase tracking-wider truncate">{s.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-3xl border-neutral-200/50 dark:border-white/5 bg-white/30 dark:bg-black/10">
                        <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-3 ml-1">Location Details</label>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="City (e.g., Chennai)"
                                className="input py-3 px-5 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                            />
                            <input
                                type="text"
                                value={state}
                                onChange={e => setState(e.target.value)}
                                placeholder="State (e.g., Tamil Nadu)"
                                className="input py-3 px-5 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                            />
                        </div>
                    </div>
                    <div className="glass-card p-6 rounded-3xl border-neutral-200/50 dark:border-white/5 bg-white/30 dark:bg-black/10">
                        <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-3 ml-1">GST Identification</label>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={gstNumber}
                                onChange={e => setGstNumber(e.target.value)}
                                placeholder="33AABCU9603R1ZM"
                                className="input py-3 px-5 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20 font-mono tracking-wider"
                            />
                            <p className="text-[10px] text-neutral-400 font-medium px-1 italic">
                                * Optional. You can add this later in settings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Admin Account Section */}
                <div className="glass-card p-8 rounded-[2rem] border-brand-100 dark:border-brand-900/30 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Users className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl onboarding-gradient-bg flex items-center justify-center text-white">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Identity & Access</h3>
                                <p className="text-sm text-neutral-500 font-medium">Create your master administrator account</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={adminName}
                                    onChange={e => setAdminName(e.target.value)}
                                    placeholder="e.g., Vignesh Kumar"
                                    className="input py-4 px-6 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                                />
                            </div>

                            <div className="col-span-full">
                                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-4 ml-1">Login Preference</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setPreferredLogin('mobile')}
                                        className={`flex-1 p-5 rounded-2xl border-2 transition-all duration-300 ${preferredLogin === 'mobile'
                                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 shadow-lg shadow-brand-600/10'
                                            : 'border-neutral-100 dark:border-neutral-800 bg-white/30 dark:bg-black/10'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">📱</div>
                                        <div className="font-bold text-sm">Mobile OTP</div>
                                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">One-click Sync</div>
                                    </button>
                                    <button
                                        onClick={() => setPreferredLogin('email')}
                                        className={`flex-1 p-5 rounded-2xl border-2 transition-all duration-300 ${preferredLogin === 'email'
                                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 shadow-lg shadow-brand-600/10'
                                            : 'border-neutral-100 dark:border-neutral-800 bg-white/30 dark:bg-black/10'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">✉️</div>
                                        <div className="font-bold text-sm">Email + Pass</div>
                                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Classic Secure</div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">Mobile</label>
                                <div className="flex">
                                    <span className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-700 rounded-l-xl text-sm font-bold text-neutral-500">+91</span>
                                    <input
                                        type="tel"
                                        value={adminMobile}
                                        onChange={e => setAdminMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="9876543210"
                                        className="input rounded-l-none rounded-r-xl py-3 px-5 border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={adminEmail}
                                    onChange={e => setAdminEmail(e.target.value)}
                                    placeholder="admin@company.com"
                                    className="input py-3 px-5 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                                />
                            </div>

                            {preferredLogin === 'email' && (
                                <div className="col-span-full space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">Secure Password</label>
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={e => setAdminPassword(e.target.value)}
                                        placeholder="Minimum 8 characters"
                                        className="input py-4 px-6 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Step 3: Team Setup
    const renderTeamSetup = () => (
        <div className="space-y-12 max-w-3xl mx-auto step-bounce">
            <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Scale Your Empire</h2>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-tight">Configure your operation workload and capacity</p>
            </div>

            <div className="space-y-12">
                <div className="glass-card p-8 rounded-[2.5rem] bg-white/40 dark:bg-black/20">
                    <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-8 text-center bg-neutral-100 dark:bg-neutral-800 py-2 px-4 rounded-full inline-block mx-auto relative left-1/2 -translate-x-1/2">
                        System Users
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 3, 5, 10, 15, 25, 50, 100].map(count => (
                            <button
                                key={count}
                                onClick={() => setEmployeeCount(count)}
                                className={`p-6 rounded-3xl border-2 text-center transition-all duration-300 ${employeeCount === count
                                    ? 'border-brand-600 bg-brand-600 text-white scale-110 shadow-2xl shadow-brand-600/30'
                                    : 'border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-black/10 hover:border-brand-200'
                                    }`}
                            >
                                <div className="text-2xl font-black">{count >= 100 ? '100+' : count}</div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${employeeCount === count ? 'text-brand-100' : 'text-neutral-400'}`}>users</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] bg-white/40 dark:bg-black/20">
                    <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-8 text-center bg-neutral-100 dark:bg-neutral-800 py-2 px-4 rounded-full inline-block mx-auto relative left-1/2 -translate-x-1/2">
                        Physical Branches
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 5, 10].map(count => (
                            <button
                                key={count}
                                onClick={() => setBranchCount(count)}
                                className={`p-6 rounded-3xl border-2 text-center transition-all duration-300 ${branchCount === count
                                    ? 'border-brand-600 bg-brand-600 text-white scale-110 shadow-2xl shadow-brand-600/30'
                                    : 'border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-black/10 hover:border-brand-200'
                                    }`}
                            >
                                <div className="text-2xl font-black">{count >= 10 ? '10+' : count}</div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${branchCount === count ? 'text-brand-100' : 'text-neutral-400'}`}>{count === 1 ? 'branch' : 'branches'}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] bg-white/40 dark:bg-black/20">
                    <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-8 text-center bg-neutral-100 dark:bg-neutral-800 py-2 px-4 rounded-full inline-block mx-auto relative left-1/2 -translate-x-1/2">
                        Monthly Velocity
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { id: 'low', label: '< 100', desc: 'Starting' },
                            { id: 'medium', label: '100-500', desc: 'Scaling' },
                            { id: 'high', label: '500-2k', desc: 'Steady' },
                            { id: 'very_high', label: '2k+', desc: 'Extreme' }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setExpectedTransactions(opt.id as any)}
                                className={`p-6 rounded-3xl border-2 text-center transition-all duration-300 ${expectedTransactions === opt.id
                                    ? 'border-brand-600 bg-brand-600 text-white scale-110 shadow-2xl shadow-brand-600/30'
                                    : 'border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-black/10 hover:border-brand-200'
                                    }`}
                            >
                                <div className="text-xl font-black">{opt.label}</div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${expectedTransactions === opt.id ? 'text-brand-100' : 'text-neutral-400'}`}>{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // Step 4: Feature Selection
    const renderFeatureSelection = () => (
        <div className="space-y-12 max-w-5xl mx-auto step-bounce">
            <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Select Your Arsenal</h2>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-tight">Choose the components you need for your operations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MODULES.map(module => {
                    const isSelected = selectedModules.includes(module.id);
                    const isEssential = module.essential;

                    return (
                        <button
                            key={module.id}
                            onClick={() => !isEssential && toggleModule(module.id)}
                            disabled={isEssential}
                            className={`group relative p-8 rounded-[2rem] border-2 text-left transition-all duration-500 hover:scale-[1.02] ${isSelected
                                ? 'border-brand-600 bg-brand-50/30 dark:bg-brand-900/10 shadow-xl shadow-brand-600/10'
                                : 'border-neutral-100 dark:border-neutral-800 bg-white/30 dark:bg-black/10 hover:border-brand-300'
                                } ${isEssential ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            {isSelected && (
                                <div className="absolute top-4 right-4 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center text-white scale-110 shadow-lg shadow-brand-600/30 animate-in zoom-in duration-300">
                                    <Check className="w-4 h-4" />
                                </div>
                            )}

                            {module.id === 'pos' && (
                                <div className="absolute -top-3 left-8 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20">
                                    Popular Choice
                                </div>
                            )}

                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 text-3xl ${isSelected ? 'onboarding-gradient-bg shadow-lg shadow-brand-600/20 scale-110' : 'bg-neutral-100 dark:bg-neutral-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20'}`}>
                                {module.icon}
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-black text-lg group-hover:text-brand-600 transition-colors uppercase tracking-wide">{module.name}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">{module.description}</p>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2">
                                {isEssential ? (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        Essential Core
                                    </span>
                                ) : (
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isSelected ? 'bg-brand-100/50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                                        Add-on
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="glass-card p-6 rounded-3xl border-brand-100 dark:border-brand-900/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-black uppercase tracking-widest text-xs text-neutral-400">Inventory Sync</div>
                        <div className="text-sm font-bold text-emerald-600">Modules are automatically interconnected</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-brand-600">{selectedModules.length}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Modules Selected</div>
                </div>
            </div>
        </div>
    );

    // Open plan customizer
    const openPlanCustomizer = (plan: Plan) => {
        setCustomizingPlan(plan);
        setCustomModules([...selectedModules]);
        setAdditionalUsers(0);
        setAdditionalBranches(0);
        setShowPlanCustomizer(true);
    };

    // Calculate custom pricing
    const customPricing = useMemo(() => {
        if (!customizingPlan) return null;
        const addons = customModules.filter(m => !customizingPlan.modules.includes(m));
        return calculateCustomPricing(customizingPlan, addons, additionalUsers, additionalBranches);
    }, [customizingPlan, customModules, additionalUsers, additionalBranches]);

    // Skip plan and configure later
    const handleSkipPlan = () => {
        setSkippedPlanSelection(true);
        setSelectedPlan(PLANS[0]); // Default to Starter (free)
        nextStep();
    };

    // Complete setup and navigate
    const handleCompleteSetup = async () => {
        // Collect all final modules (base + custom)
        const finalModules = [...new Set([
            ...(selectedPlan?.modules || recommendation?.recommendedPlan.modules || []),
            ...selectedModules,
            ...customModules
        ])];

        // Register the tenant and admin in mock DB
        const response = await registrationUtil.registerTenant({
            businessName,
            businessType,
            sector,
            city,
            state,
            modules: finalModules,
            adminName,
            adminEmail,
            adminMobile,
            adminPassword,
            preferredLogin,
            employeeCount,
            branchCount
        });

        const { admin } = response as any; // Cast to any if type is incomplete


        // Auto-login the user
        dispatch(setUser(admin));
        setSession(admin); // Persist session correctly

        // Mark session as active for demo purposes
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('erp_current_tenant', admin.tenantId); // Hint for the app shell

        // Navigate to dashboard with success message
        navigate('/', { replace: true });
    };

    // Render plan customizer modal
    const renderPlanCustomizer = () => {
        if (!showPlanCustomizer || !customizingPlan) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Settings className="w-5 h-5" /> Customize {customizingPlan.name} Plan
                            </h3>
                            <button onClick={() => setShowPlanCustomizer(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Base Plan */}
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold">{customizingPlan.name} Plan</div>
                                    <div className="text-sm text-neutral-500">{customizingPlan.description}</div>
                                </div>
                                <div className="text-xl font-black">{customizingPlan.price}</div>
                            </div>
                        </div>

                        {/* Additional Users */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Additional Users</label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setAdditionalUsers(Math.max(0, additionalUsers - 1))}
                                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <span className="text-2xl font-bold w-16 text-center">{additionalUsers}</span>
                                <button
                                    onClick={() => setAdditionalUsers(additionalUsers + 1)}
                                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-neutral-500">₹99/user/month</span>
                            </div>
                        </div>

                        {/* Additional Branches */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Additional Branches</label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setAdditionalBranches(Math.max(0, additionalBranches - 1))}
                                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <span className="text-2xl font-bold w-16 text-center">{additionalBranches}</span>
                                <button
                                    onClick={() => setAdditionalBranches(additionalBranches + 1)}
                                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-neutral-500">₹199/branch/month</span>
                            </div>
                        </div>

                        {/* Add-on Modules */}
                        <div>
                            <label className="block text-sm font-bold mb-3">Add-on Modules</label>
                            <div className="grid grid-cols-2 gap-2">
                                {MODULES.filter(m => !customizingPlan.modules.includes(m.id)).map(module => {
                                    const isSelected = customModules.includes(module.id);
                                    return (
                                        <button
                                            key={module.id}
                                            onClick={() => setCustomModules(prev =>
                                                prev.includes(module.id)
                                                    ? prev.filter(m => m !== module.id)
                                                    : [...prev, module.id]
                                            )}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${isSelected
                                                ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                                                : 'border-neutral-200 dark:border-neutral-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{module.icon}</span>
                                                <span className="font-medium text-sm">{module.name}</span>
                                                <span className="ml-auto text-xs text-neutral-500">+₹299</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pricing Summary */}
                        {customPricing && (
                            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 border border-brand-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calculator className="w-5 h-5 text-brand-600" />
                                    <span className="font-bold">Pricing Summary</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {customPricing.breakdown.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="text-neutral-600">{item.item}</span>
                                            <span className="font-medium">₹{item.cost.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-brand-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                                        <span>Total / Month</span>
                                        <span className="text-brand-600">₹{customPricing.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
                        <button
                            onClick={() => setShowPlanCustomizer(false)}
                            className="btn btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setSelectedPlan(customizingPlan);
                                setSelectedModules([...new Set([...selectedModules, ...customModules])]);
                                setShowPlanCustomizer(false);
                                nextStep();
                            }}
                            className="btn btn-primary flex-1"
                        >
                            Apply & Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Step 5: Plan Recommendation
    const renderPlanRecommendation = () => {
        if (!recommendation) return null;

        return (
            <div className="space-y-12 step-bounce">
                <div className="text-center">
                    <h2 className="text-3xl font-black mb-2">Your Path to <span className="onboarding-gradient-text">Success</span></h2>
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">Data-driven recommendation optimized for your profile</p>
                </div>

                {/* Recommended Plan */}
                <div className="max-w-xl mx-auto">
                    <div className="relative p-1 rounded-[2.5rem] onboarding-gradient-bg shadow-2xl shadow-brand-600/30 group">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-xl shadow-amber-500/40 z-20">
                            Our Best Pick for You
                        </div>

                        <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl p-10 rounded-[2.4rem] space-y-8 relative overflow-hidden">
                            {/* Abstract background elements */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 onboarding-gradient-bg rounded-full blur-[80px] opacity-10" />

                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 rounded-3xl onboarding-gradient-bg flex items-center justify-center mx-auto shadow-xl shadow-brand-600/20 rotate-3">
                                    <recommendation.recommendedPlan.icon className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tight">{recommendation.recommendedPlan.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1 mt-1">
                                        <span className="text-5xl font-black text-neutral-900 dark:text-white">{recommendation.recommendedPlan.price}</span>
                                        <span className="text-neutral-400 font-bold uppercase tracking-widest text-xs">{recommendation.recommendedPlan.period}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {recommendation.reasons.map((reason, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                                            <Check className="w-4 h-4 stroke-[3]" />
                                        </div>
                                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{reason}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-6 rounded-3xl border-brand-100 dark:border-brand-900/30 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Estimated Monthly</div>
                                    <div className="text-3xl font-black text-brand-600">₹{(recommendation.monthlyEstimate ?? 0).toLocaleString()}</div>
                                </div>
                                {recommendation.savings && (
                                    <div className="text-right">
                                        <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-tighter mb-1">
                                            Save 15% Yearly
                                        </div>
                                        <div className="text-[10px] text-neutral-400 italic">Pre-applied</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 pt-2">
                                <button
                                    onClick={() => {
                                        setSelectedPlan(recommendation.recommendedPlan);
                                        nextStep();
                                    }}
                                    className="onboarding-gradient-bg text-white font-black text-xl py-5 rounded-2xl shadow-2xl shadow-brand-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Activate {recommendation.recommendedPlan.name}
                                </button>
                                <button
                                    onClick={() => openPlanCustomizer(recommendation.recommendedPlan)}
                                    className="btn btn-secondary py-4 rounded-2xl border-neutral-200 dark:border-neutral-800 font-bold flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                                >
                                    <Settings className="w-5 h-5" /> Customize Plan Add-ons
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* All Plans Selector */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Other Available Options</span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        {PLANS.map(plan => {
                            const isRecommended = plan.id === recommendation.recommendedPlan.id;
                            return (
                                <div
                                    key={plan.id}
                                    className={`p-6 rounded-3xl border-2 transition-all duration-500 overflow-hidden relative group ${isRecommended
                                        ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/20 ring-4 ring-brand-600/10 shadow-xl'
                                        : 'border-neutral-100 dark:border-neutral-800 bg-white/30 dark:bg-black/10 hover:border-brand-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRecommended ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-brand-100 group-hover:text-brand-600'}`}>
                                            <plan.icon className="w-6 h-6" />
                                        </div>
                                        <span className="font-black uppercase tracking-tight text-sm">{plan.name}</span>
                                    </div>
                                    <div className="text-2xl font-black mb-1">{plan.price}</div>
                                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest mb-6">{plan.period}</div>

                                    <button
                                        onClick={() => {
                                            setSelectedPlan(plan);
                                            nextStep();
                                        }}
                                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isRecommended
                                            ? 'onboarding-gradient-bg text-white shadow-lg shadow-brand-600/20'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-brand-600 hover:text-white'
                                            }`}
                                    >
                                        Choose Plan
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center pt-8">
                    <button
                        onClick={handleSkipPlan}
                        className="group flex flex-col items-center gap-2 mx-auto"
                    >
                        <span className="text-sm font-bold text-neutral-500 group-hover:text-brand-600 transition-colors">Not ready to decide?</span>
                        <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:border-brand-300">
                            <Clock className="w-3 h-3" /> Start for Free & Choose Later
                        </div>
                    </button>
                </div>
            </div>
        );
    };

    // Step 6: Confirmation
    const renderConfirmation = () => {
        const plan = selectedPlan || recommendation?.recommendedPlan;
        if (!plan) return null;

        return (
            <div className="space-y-12 max-w-5xl mx-auto step-bounce">
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5 pulse">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black">Ready to <span className="onboarding-gradient-text">Blast Off!</span></h2>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Your enterprise-grade foundation is prepared</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-5 gap-8 items-start">
                    {/* Summary Cards */}
                    <div className="md:col-span-3 space-y-6">
                        <div className="glass-card p-8 rounded-[2rem] border-neutral-100 dark:border-neutral-800">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-brand-600" /> Organization Profile
                            </h3>

                            <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Business Name</div>
                                    <div className="font-bold text-lg">{businessName}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Sector</div>
                                    <div className="font-bold text-lg">{SECTORS.find(s => s.id === sector)?.name}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Location</div>
                                    <div className="font-bold text-lg">{city}, {state}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Team Scale</div>
                                    <div className="font-bold text-lg">{employeeCount} Employees / {branchCount} Branches</div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-6">Activated Modules</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedModules.map(moduleId => {
                                        const m = MODULES.find(mod => mod.id === moduleId);
                                        return m ? (
                                            <div key={moduleId} className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-xs font-bold border border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                                                <span className="text-lg">{m.icon}</span> {m.name}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-[2rem] border-brand-100 dark:border-brand-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-neutral-400">Security Ready</div>
                                    <div className="text-sm font-bold">Encrypted Data & Tenant Isolation Activated</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Master Admin</div>
                                <div className="text-sm font-bold">{adminName}</div>
                            </div>
                        </div>
                    </div>

                    {/* Final CTA Card */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-neutral-900 dark:bg-neutral-800 text-white space-y-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 onboarding-gradient-bg opacity-20 blur-[60px]" />

                            <div className="space-y-2">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Selected Plan</div>
                                <h3 className="text-4xl font-black">{plan.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black onboarding-gradient-text">{plan.price}</span>
                                    <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">{plan.period}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {plan.features.slice(0, 4).map((f: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-brand-600/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-brand-400" />
                                        </div>
                                        <span className="text-sm text-neutral-300 font-medium">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleCompleteSetup}
                                    className="w-full onboarding-gradient-bg py-5 rounded-2xl font-black text-xl shadow-xl shadow-brand-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    Complete Setup <ArrowRight className="w-6 h-6" />
                                </button>
                                <p className="text-[10px] text-center text-neutral-500 mt-6 font-bold uppercase tracking-widest">
                                    By clicking complete, you agree to our Terms of Service
                                </p>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-[2rem] border-neutral-100 dark:border-neutral-800 text-center">
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                Need help? Our experts are ready to assist you in setting up your workspace once you enter the dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render current step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return renderWelcome();
            case 2: return renderBusinessInfo();
            case 3: return renderTeamSetup();
            case 4: return renderFeatureSelection();
            case 5: return renderPlanRecommendation();
            case 6: return renderConfirmation();
            default: return null;
        }
    };

    // Check if can proceed to next step
    const canProceed = () => {
        switch (currentStep) {
            case 1: return true;
            case 2: {
                // Business info + admin contact validation
                const hasBusinessInfo = businessName && businessType && sector;
                const hasAdminName = adminName.trim().length > 0;
                const hasValidContact = preferredLogin === 'mobile'
                    ? adminMobile.length === 10
                    : (adminEmail.includes('@') && adminPassword.length >= 8);
                return hasBusinessInfo && hasAdminName && hasValidContact;
            }
            case 3: return employeeCount > 0 && branchCount > 0;
            case 4: return selectedModules.length > 0;
            case 5: return true;
            default: return true;
        }
    };

    return (
        <div className="min-h-screen gradient-mesh py-12 px-4 selection:bg-brand-100 selection:text-brand-900">
            <div className="max-w-5xl mx-auto">
                {/* Progress Stepper */}
                {renderStepper()}

                {/* Main Content Card */}
                <div className="glass-card rounded-[2.5rem] shadow-2xl shadow-brand-900/10 overflow-hidden border-none step-bounce">
                    <div className="p-8 md:p-12">
                        {/* Plan Customizer Modal */}
                        {renderPlanCustomizer()}

                        {/* Step Content */}
                        <div className="min-h-[500px]">
                            {renderStepContent()}
                        </div>

                        {/* Navigation */}
                        {currentStep > 1 && currentStep < 6 && (
                            <div className="flex justify-between items-center mt-12 pt-8 border-t border-neutral-200/50 dark:border-neutral-800/50">
                                <button
                                    onClick={prevStep}
                                    className="btn btn-secondary px-8 py-3 rounded-xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Back
                                </button>

                                {currentStep < 5 && (
                                    <button
                                        onClick={nextStep}
                                        disabled={!canProceed()}
                                        className="onboarding-gradient-bg text-white font-bold px-12 py-3 rounded-xl shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                                    >
                                        Continue <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Trust Footer */}
                <div className="mt-8 flex justify-center items-center gap-8 text-neutral-400 dark:text-neutral-500 font-medium text-sm">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" /> SSL Encrypted
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Trusted by 5,000+ Businesses
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantOnboarding;
