import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';

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
        if (score === 0) return { label: 'Enter Password', color: 'bg-[var(--erp-bg-sunken)]', textColor: 'text-white/20' };
        if (score <= 2) return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' };
        if (score <= 3) return { label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400' };
        if (score <= 4) return { label: 'Good', color: 'bg-sky-500', textColor: 'text-sky-400' };
        return { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
    }, [score]);

    const requirements: Requirement[] = [
        { label: '8+ characters', met: validation.length },
        { label: 'Uppercase', met: validation.upper },
        { label: 'Lowercase', met: validation.lower },
        { label: 'Number', met: validation.number },
        { label: 'Symbol', met: validation.special },
    ];

    if (!password) return null;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Strength bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-white/25 uppercase tracking-[0.25em]">Strength</span>
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${strengthConfig.textColor}`}>
                        {strengthConfig.label}
                    </span>
                </div>
                <div className="flex gap-1 h-[3px]">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <div
                            key={level}
                            className={`flex-1 rounded-full transition-all duration-500 ease-out ${
                                level <= score ? strengthConfig.color : 'bg-white/[0.04]'
                            }`}
                            style={{
                                transitionDelay: `${level * 50}ms`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Requirements checklist */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {requirements.map(({ label, met }) => (
                    <div
                        key={label}
                        className={`flex items-center gap-1.5 text-[10px] font-medium transition-all duration-300 ${
                            met ? 'text-white/50' : 'text-white/15'
                        }`}
                    >
                        {met ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                            <X className="w-3 h-3 text-white/10" />
                        )}
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
