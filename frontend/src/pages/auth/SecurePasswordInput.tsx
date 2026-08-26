import React, { useState, useEffect, useRef } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';

interface SecurePasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    registration?: UseFormRegisterReturn;
    error?: string;
    showPassword?: boolean;
    onToggleVisibility?: () => void;
    icon?: boolean;
}

const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
    id,
    label,
    registration,
    error,
    placeholder = "Enter password",
    showPassword: externalShowPassword,
    onToggleVisibility,
    className = "",
    icon = true,
    ...props
}) => {
    const [internalShowPassword, setInternalShowPassword] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipMessage, setTooltipMessage] = useState('');
    const [ariaMessage, setAriaMessage] = useState('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isVisible = externalShowPassword !== undefined ? externalShowPassword : internalShowPassword;
    const toggleVisibility = onToggleVisibility || (() => setInternalShowPassword(!internalShowPassword));

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const showSecurityMessage = (message: string) => {
        setTooltipMessage(message);
        setAriaMessage(message);
        setShowTooltip(true);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setShowTooltip(false);
            setAriaMessage('');
        }, 3000);
    };

    const handlePreventAction = (e: React.SyntheticEvent<HTMLInputElement>, action: string) => {
        e.preventDefault();
        showSecurityMessage(`For security reasons, ${action} passwords is disabled.`);
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLInputElement>) => {
        e.preventDefault();
        showSecurityMessage('For security reasons, right-click is disabled on password fields.');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
            e.preventDefault();
            const action = e.key === 'c' ? 'copying' : e.key === 'v' ? 'pasting' : 'cutting';
            showSecurityMessage(`For security reasons, ${action} passwords is disabled.`);
        }
        if (props.onKeyDown) props.onKeyDown(e);
    };

    return (
        <div className="space-y-2 group">
            {label && (
                <label
                    htmlFor={id}
                    className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {/* ARIA live region */}
                <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                    {ariaMessage}
                </div>

                {icon && (
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-primary transition-colors" />
                )}

                <input
                    type={isVisible ? "text" : "password"}
                    id={id}
                    {...registration}
                    {...props}
                    onCopy={handlePreventAction ? (e) => handlePreventAction(e, 'copying') : undefined}
                    onPaste={handlePreventAction ? (e) => handlePreventAction(e, 'pasting') : undefined}
                    onCut={handlePreventAction ? (e) => handlePreventAction(e, 'cutting') : undefined}
                    onDragStart={handlePreventAction ? (e) => handlePreventAction(e, 'dragging') : undefined}
                    onDrop={handlePreventAction ? (e) => handlePreventAction(e, 'dropping') : undefined}
                    onContextMenu={handleContextMenu}
                    onKeyDown={handleKeyDown}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className={`w-full h-14 bg-slate-900 border ${error ? 'border-red-500/50' : 'border-slate-800'
                        } rounded-sm ${icon ? 'pl-12' : 'pl-4'} pr-12 text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 ${className}`}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    aria-describedby={showTooltip ? `${id}-security-message` : undefined}
                />

                <button
                    type="button"
                    onClick={toggleVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    aria-label={isVisible ? 'Hide password' : 'Show password'}
                >
                    {isVisible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
            </div>

            {error && (
                <p className="mt-1 text-xs text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}

            {/* Tooltip */}
            {showTooltip && (
                <div
                    id={`${id}-security-message`}
                    className="absolute left-0 -bottom-12 w-full z-20 animate-in fade-in zoom-in-95"
                    role="alert"
                >
                    <div className="bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl py-2 px-3 shadow-2xl flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>{tooltipMessage}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurePasswordInput;
