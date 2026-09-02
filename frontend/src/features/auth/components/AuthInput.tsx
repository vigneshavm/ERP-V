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
        <div className="space-y-2 group">
            <label
                htmlFor={id}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary"
            >
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-primary transition-colors" />
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
                    className={`w-full h-14 bg-slate-900 border ${error ? 'border-red-500/50' : 'border-slate-800'
                        } rounded-sm ${Icon ? 'pl-12' : leftElement ? 'pl-16' : 'pl-4'} pr-4 text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 ${className}`}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};

export default AuthInput;
