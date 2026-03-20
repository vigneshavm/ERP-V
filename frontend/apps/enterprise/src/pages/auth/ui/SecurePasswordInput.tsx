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
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isVisible = externalShowPassword !== undefined ? externalShowPassword : internalShowPassword;
    const toggleVisibility = onToggleVisibility || (() => setInternalShowPassword(!internalShowPassword));

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const showSecurityMessage = (message: string) => {
        setTooltipMessage(message);
        setAriaMessage(message);
        setShowTooltip(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setShowTooltip(false);
            setAriaMessage('');
        }, 3000);
    };

    const handlePreventAction = (e: React.SyntheticEvent<HTMLInputElement>, action: string) => {
        e.preventDefault();
        showSecurityMessage(`${action} is disabled for security.`);
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLInputElement>) => {
        e.preventDefault();
        showSecurityMessage('Right-click disabled on secure fields.');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key)) {
            e.preventDefault();
            const action = e.key === 'c' ? 'Copying' : e.key === 'v' ? 'Pasting' : 'Cutting';
            showSecurityMessage(`${action} is disabled for security.`);
        }
        if (props.onKeyDown) props.onKeyDown(e);
    };

    return (
        <div className="space-y-2.5 group relative">
            {label && (
                <label
                    htmlFor={id}
                    className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-0.5 transition-colors duration-300 group-focus-within:text-indigo-400"
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
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-indigo-400 transition-colors duration-300" />
                )}

                <input
                    type={isVisible ? "text" : "password"}
                    id={id}
                    {...registration}
                    {...props}
                    onCopy={(e) => handlePreventAction(e, 'Copying')}
                    onPaste={(e) => handlePreventAction(e, 'Pasting')}
                    onCut={(e) => handlePreventAction(e, 'Cutting')}
                    onDragStart={(e) => handlePreventAction(e, 'Dragging')}
                    onDrop={(e) => handlePreventAction(e, 'Dropping')}
                    onContextMenu={handleContextMenu}
                    onKeyDown={handleKeyDown}
                    autoComplete="new-password"
                    data-lpignore="true"
                    aria-invalid={!!error}
                    aria-describedby={showTooltip ? `${id}-security-message` : error ? `${id}-error` : undefined}
                    aria-label={label || placeholder}
                    className={`w-full h-13 bg-white/[0.04] border ${
                        error
                            ? 'border-red-500/40 focus:ring-red-500/30 focus:border-red-500/60'
                            : 'border-white/[0.07] focus:ring-indigo-500/30 focus:border-indigo-500/40'
                    } rounded-xl ${icon ? 'pl-11' : 'pl-4'} pr-11 text-white/90 text-sm font-mono tracking-wider outline-none focus:ring-2 transition-all duration-300 placeholder:text-white/15 hover:border-white/[0.12] ${className}`}
                    placeholder={placeholder}
                />

                <button
                    type="button"
                    onClick={toggleVisibility}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors p-0.5"
                    aria-label={isVisible ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {/* Focus glow */}
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

            {/* Security Tooltip */}
            {showTooltip && (
                <div
                    id={`${id}-security-message`}
                    className="absolute left-0 -bottom-10 w-full z-30"
                    role="alert"
                    style={{ animation: 'alertIn 0.2s ease-out' }}
                >
                    <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] text-white/60 text-[10px] font-bold rounded-lg py-2 px-3 shadow-xl flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{tooltipMessage}</span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes alertIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default SecurePasswordInput;
