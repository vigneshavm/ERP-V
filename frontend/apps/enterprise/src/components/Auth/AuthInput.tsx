import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: LucideIcon;
    registration?: UseFormRegisterReturn;
    leftElement?: React.ReactNode;
}

const AuthInput: React.FC<AuthInputProps> = ({
    label,
    error,
    icon: Icon,
    registration,
    leftElement,
    className = '',
    id,
    ...props
}) => {
    return (
        <div className="space-y-2.5 group">
            <label
                htmlFor={id}
                className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-0.5 transition-colors duration-300 group-focus-within:text-indigo-400"
            >
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-indigo-400 transition-colors duration-300" />
                )}
                {leftElement && (
                    <div className="absolute inset-y-0 left-0 flex items-center">
                        {leftElement}
                    </div>
                )}
                <input
                    id={id}
                    {...registration}
                    {...props}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`w-full h-13 bg-white/[0.04] border ${
                        error
                            ? 'border-red-500/40 focus:ring-red-500/30 focus:border-red-500/60'
                            : 'border-white/[0.07] focus:ring-indigo-500/30 focus:border-indigo-500/40'
                    } rounded-xl ${
                        Icon ? 'pl-11' : leftElement ? 'pl-16' : 'pl-4'
                    } pr-4 text-white/90 text-sm font-medium outline-none focus:ring-2 transition-all duration-300 placeholder:text-white/15 hover:border-white/[0.12] ${className}`}
                />
                {/* Focus glow effect */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-indigo-500/[0.03] to-violet-500/[0.03]" />
            </div>
            {error && (
                <p
                    id={`${id}-error`}
                    role="alert"
                    className="text-[11px] text-red-400/90 font-medium ml-0.5 flex items-center gap-1.5"
                    style={{ animation: 'slideDown 0.25s ease-out' }}
                >
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {error}
                </p>
            )}

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AuthInput;
