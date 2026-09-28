import React from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputStatus = 'default' | 'success' | 'error' | 'warning';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label text */
  label?: string;
  /** Help text below the input */
  helperText?: string;
  /** Error message (shows error state) */
  error?: string;
  /** Success message (shows success state) */
  success?: boolean;
  /** Warning message */
  warning?: string;
  /** Input size */
  size?: InputSize;
  /** Input status color */
  status?: InputStatus;
  /** Show required asterisk */
  required?: boolean;
  /** Left icon/element */
  icon?: React.ReactNode;
  /** Right icon/element */
  iconRight?: React.ReactNode;
  /** Allow toggling password visibility (for password type) */
  showPasswordToggle?: boolean;
  /** Container className for styling wrapper */
  wrapperClassName?: string;
  /** Label className for styling label */
  labelClassName?: string;
}

const sizeClasses: Record<InputSize, { padding: string; fontSize: string; height: string }> = {
  sm: {
    padding: 'px-3 py-1.5',
    fontSize: 'text-xs',
    height: 'h-8',
  },
  md: {
    padding: 'px-4 py-2',
    fontSize: 'text-sm',
    height: 'h-10',
  },
  lg: {
    padding: 'px-4 py-3',
    fontSize: 'text-base',
    height: 'h-12',
  },
};

const statusClasses: Record<InputStatus, string> = {
  default: 'border-default focus:border-primary focus:ring-4 focus:ring-primary/30',
  success: 'border-success focus:border-success focus:ring-4 focus:ring-success/30',
  error: 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/30',
  warning: 'border-warning focus:border-warning focus:ring-4 focus:ring-warning/30',
};

const statusBgClasses: Record<InputStatus, string> = {
  default: 'bg-white dark:bg-slate-900',
  success: 'bg-success-soft/30 dark:bg-success-soft/10',
  error: 'bg-danger-soft/30 dark:bg-danger-soft/10',
  warning: 'bg-warning-soft/30 dark:bg-warning-soft/10',
};

/**
 * Reusable Input component with support for various states and sizes.
 *
 * @example
 * // Basic input
 * <Input label="Email" type="email" placeholder="user@example.com" />
 *
 * // With validation
 * <Input
 *   label="Password"
 *   type="password"
 *   error={errors.password?.message}
 *   required
 * />
 *
 * // With icon
 * <Input
 *   label="Search"
 *   type="search"
 *   icon={<Search size={16} />}
 *   placeholder="Search items..."
 * />
 *
 * // With success state
 * <Input
 *   label="Username"
 *   value={username}
 *   success={usernameAvailable}
 *   helperText="Username is available"
 * />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      warning,
      size = 'md',
      status = 'default',
      required = false,
      icon,
      iconRight,
      type = 'text',
      showPasswordToggle = type === 'password',
      className = '',
      wrapperClassName = '',
      labelClassName = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    // Determine status based on error/success/warning
    let resolvedStatus: InputStatus = status;
    if (error) resolvedStatus = 'error';
    else if (success) resolvedStatus = 'success';
    else if (warning) resolvedStatus = 'warning';

    const sizeStyle = sizeClasses[size];
    const statusStyle = statusClasses[resolvedStatus];
    const statusBg = statusBgClasses[resolvedStatus];

    const inputClasses = `
      w-full
      ${sizeStyle.padding}
      ${sizeStyle.fontSize}
      ${sizeStyle.height}
      border border-solid
      rounded-lg
      outline-none
      transition-all
      duration-200
      bg-white
      dark:bg-slate-900
      text-main
      dark:text-white
      placeholder:text-slate-400
      dark:placeholder:text-slate-500
      disabled:opacity-50
      disabled:cursor-not-allowed
      ${statusStyle}
      ${statusBg}
      ${icon ? 'pl-10' : ''}
      ${iconRight || showPasswordToggle ? 'pr-10' : ''}
      ${className}
    `.replace(/\s+/g, ' ').trim();

    const iconWrapperClasses = 'absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-10 h-10 text-slate-400 dark:text-slate-500';
    const interactiveIconClasses = 'absolute top-1/2 -translate-y-1/2 right-0 pointer-events-auto flex items-center justify-center w-10 h-10 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer transition-colors';

    return (
      <div className={`space-y-1.5 ${wrapperClassName}`}>
        {/* Label */}
        {label && (
          <label className={`
            block
            text-xs
            font-bold
            text-slate-600
            dark:text-slate-400
            uppercase
            tracking-wider
            ${labelClassName}
          `.replace(/\s+/g, ' ').trim()}>
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        {/* Input Wrapper */}
        <div className="relative">
          {/* Left Icon */}
          {icon && <div className={`${iconWrapperClasses} left-0`}>{icon}</div>}

          {/* Input Field */}
          <input
            ref={ref}
            type={showPassword ? 'text' : type}
            disabled={disabled}
            className={inputClasses}
            {...props}
          />

          {/* Status Icon (Right) */}
          {resolvedStatus !== 'default' && !iconRight && !showPasswordToggle && (
            <div className={`${interactiveIconClasses} right-0`}>
              {resolvedStatus === 'success' && <CheckCircle size={18} className="text-success" />}
              {resolvedStatus === 'error' && <AlertCircle size={18} className="text-danger" />}
              {resolvedStatus === 'warning' && <AlertCircle size={18} className="text-warning" />}
            </div>
          )}

          {/* Right Icon */}
          {iconRight && !showPasswordToggle && (
            <div className={`${iconWrapperClasses} right-0`}>{iconRight}</div>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={interactiveIconClasses}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {/* Helper Text / Error / Success / Warning */}
        {(helperText || error || success || warning) && (
          <p
            className={`
              text-xs
              font-medium
              ${error ? 'text-danger' : success ? 'text-success' : warning ? 'text-warning' : 'text-slate-500 dark:text-slate-400'}
            `.replace(/\s+/g, ' ').trim()}
          >
            {error || success || warning || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
