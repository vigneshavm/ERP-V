import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="space-y-3 group relative">
            <div className="flex justify-between items-center px-1">
                <label
                    htmlFor={id}
                    className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] transition-colors duration-500 group-focus-within:text-indigo-400 italic"
                >
                    {label}
                </label>
            </div>
            
            <div className="relative isolate">
                {/* Secondary Focus Shadow Overlay */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-violet-500/0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000 blur-xl pointer-events-none" />
                
                <div className="relative">
                    {Icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center z-20">
                            <Icon className={`w-[18px] h-[18px] transition-all duration-500 ${
                                error ? 'text-rose-500/40' : 'text-white/10 group-focus-within:text-indigo-400 group-focus-within:scale-110'
                            }`} />
                        </div>
                    )}
                    
                    {leftElement && (
                        <div className="absolute inset-y-0 left-0 flex items-center z-20">
                            {leftElement}
                        </div>
                    )}
                    
                    <input
                        id={id}
                        {...registration}
                        {...props}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${id}-error` : undefined}
                        className={`w-full h-14 bg-white/[0.02] border backdrop-blur-3xl transition-all duration-500 font-bold ${
                            error
                                ? 'border-rose-500/30 focus:border-rose-500/50 focus:ring-rose-500/10'
                                : 'border-white/[0.06] focus:border-indigo-500/40 focus:ring-indigo-500/10'
                        } rounded-2xl ${
                            Icon ? 'pl-12' : leftElement ? 'pl-16' : 'pl-5'
                        } pr-5 text-white/90 text-[13px] outline-none focus:ring-8 placeholder:text-white/10 placeholder:italic hover:border-white/10 hover:bg-white/[0.03] ${className}`}
                    />

                    {/* Industrial focus ring divider */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-all duration-700 group-focus-within:w-[80%] opacity-50" />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-2 px-1 pt-1"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                        <p
                            id={`${id}-error`}
                            role="alert"
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic"
                        >
                            {error}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus {
                    -webkit-text-fill-color: #fff;
                    -webkit-box-shadow: 0 0 0px 1000px #0c0e14 inset;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}</style>
        </div>
    );
};

export default AuthInput;
