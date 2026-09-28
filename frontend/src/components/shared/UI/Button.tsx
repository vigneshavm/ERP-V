import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'success' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Icon to display (left of text) */
  icon?: React.ReactNode;
  /** Icon to display (right of text) */
  iconRight?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Button text/children */
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary dark:hover:bg-primary-hover shadow-lg shadow-primary/20 dark:shadow-none focus:ring-4 focus:ring-primary/50 focus:outline-none transition-all duration-200',
  secondary: 'bg-input text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-default dark:border-slate-700 focus:ring-4 focus:ring-primary/30 focus:outline-none transition-all duration-200',
  tertiary: 'bg-transparent text-primary hover:bg-primary/5 dark:hover:bg-primary/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 focus:ring-primary/30 focus:outline-none transition-all duration-200',
  danger: 'bg-danger text-white hover:bg-danger/90 dark:hover:bg-danger/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-danger shadow-lg shadow-danger/20 dark:shadow-none focus:ring-4 focus:ring-danger/50 focus:outline-none transition-all duration-200',
  warning: 'bg-warning text-white hover:bg-warning/90 dark:hover:bg-warning/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-warning shadow-lg shadow-warning/20 dark:shadow-none focus:ring-4 focus:ring-warning/50 focus:outline-none transition-all duration-200',
  success: 'bg-success text-white hover:bg-success/90 dark:hover:bg-success/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-success shadow-lg shadow-success/20 dark:shadow-none focus:ring-4 focus:ring-success/50 focus:outline-none transition-all duration-200',
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:border-slate-600 focus:ring-4 focus:ring-primary/30 focus:outline-none transition-all duration-200',
};

const sizeClasses: Record<ButtonSize, { padding: string; fontSize: string; gap: string }> = {
  sm: {
    padding: 'px-3 py-1.5',
    fontSize: 'text-xs',
    gap: 'gap-1.5',
  },
  md: {
    padding: 'px-4 py-2',
    fontSize: 'text-sm',
    gap: 'gap-2',
  },
  lg: {
    padding: 'px-6 py-3',
    fontSize: 'text-base',
    gap: 'gap-2.5',
  },
};

/**
 * Reusable Button component with multiple variants and sizes.
 *
 * @example
 * // Primary button
 * <Button variant="primary">Save Changes</Button>
 *
 * // Secondary with icon
 * <Button variant="secondary" icon={<RefreshCw size={16} />}>Refresh</Button>
 *
 * // Danger button with loading state
 * <Button variant="danger" loading={isDeleting}>Delete Account</Button>
 *
 * // Large outline button
 * <Button variant="outline" size="lg">Learn More</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const sizeStyle = sizeClasses[size];
    const variantStyle = variantClasses[variant];

    const baseClasses =
      'inline-flex items-center justify-center font-bold rounded-lg whitespace-nowrap text-center cursor-pointer';

    const fullWidthClass = fullWidth ? 'w-full' : '';
    const combinedClasses = `${baseClasses} ${sizeStyle.padding} ${sizeStyle.fontSize} ${variantStyle} ${fullWidthClass} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={combinedClasses}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        <span className={`flex items-center ${sizeStyle.gap}`}>
          {/* Left Icon */}
          {icon && !loading && (
            <span className="flex items-center justify-center">
              {icon}
            </span>
          )}

          {/* Loading Spinner */}
          {loading && (
            <Loader2 
              size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} 
              className="animate-spin"
            />
          )}

          {/* Text Content */}
          <span>{children}</span>

          {/* Right Icon */}
          {iconRight && !loading && (
            <span className="flex items-center justify-center">
              {iconRight}
            </span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
