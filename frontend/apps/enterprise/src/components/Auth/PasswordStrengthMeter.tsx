import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordStrengthMeterProps {
    password: string;
    className?: string;
}

interface Requirement {
    label: string;
    met: boolean;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password, className = '' }) => {
    const validation = useMemo(() => ({
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    }), [password]);

    const score = Object.values(validation).filter(Boolean).length;

    const strengthConfig = useMemo(() => {
        if (score === 0) return { label: 'Awaiting Input', color: 'bg-white/5', textColor: 'text-white/10' };
        if (score <= 2) return { label: 'vulnerable_core', color: 'bg-rose-500', textColor: 'text-rose-500' };
        if (score <= 3) return { label: 'standard_integrity', color: 'bg-amber-500', textColor: 'text-amber-500' };
        if (score <= 4) return { label: 'elevated_shield', color: 'bg-indigo-500', textColor: 'text-indigo-500' };
        return { label: 'sovereign_logic', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
    }, [score]);

    const requirements: Requirement[] = [
        { label: '8+ UNIT LENGTH', met: validation.length },
        { label: 'UPPERCASE_ALPHA', met: validation.upper },
        { label: 'LOWERCASE_ALPHA', met: validation.lower },
        { label: 'NUMERIC_VAL', met: validation.number },
        { label: 'SYMB_ENTROPY', met: validation.special },
    ];

    if (!password) return null;

    return (
        <div className={`space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl ${className}`}>
            {/* Strength HUD */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-0.5">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">Vault Integrity</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.25em] transition-colors duration-700 italic flex items-center gap-2 ${strengthConfig.textColor}`}>
                         <div className={`w-1 h-1 rounded-full ${strengthConfig.color} animate-pulse`} />
                         {strengthConfig.label}
                    </span>
                </div>
                <div className="flex gap-1.5 h-[4px]">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <div
                            key={level}
                            className={`flex-1 rounded-full transition-all duration-700 ease-[0.22,1,0.36,1] ${
                                level <= score ? strengthConfig.color : 'bg-white/[0.04]'
                            } ${level <= score ? 'shadow-[0_0_10px_rgba(255,255,255,0.1)]' : ''}`}
                            style={{
                                transitionDelay: `${level * 40}ms`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Tactical Checklist */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
                {requirements.map(({ label, met }) => (
                    <div
                        key={label}
                        className={`flex items-center gap-2 text-[9px] font-black transition-all duration-500 uppercase tracking-widest italic ${
                            met ? 'text-white/40' : 'text-white/10'
                        }`}
                    >
                        {met ? (
                            <Check className="w-3 h-3 text-emerald-500/60" />
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                        )}
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
