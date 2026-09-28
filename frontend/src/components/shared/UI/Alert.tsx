/**
 * ALERT COMPONENT
 *
 * Information banner with:
 * - 4 variants (info, success, warning, error)
 * - 3 sizes (sm, md, lg)
 * - Icon support
 * - Closeable option
 * - Full dark mode support
 * - Accessibility features
 *
 * Import: import { Alert } from '@/components/shared'
 */

import React, { forwardRef, useState } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export type AlertSize = 'sm' | 'md' | 'lg';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alert variant/severity level */
  variant?: AlertVariant;

  /** Alert size */
  size?: AlertSize;

  /** Alert title */
  title?: string;

  /** Alert message/content */
  message?: React.ReactNode;

  /** Custom icon (overrides default) */
  icon?: React.ReactNode;

  /** Show close button */
  closeable?: boolean;

  /** Callback when close button is clicked */
  onClose?: () => void;

  /** Show icon background pill */
  showIconPill?: boolean;

  /** Custom className */
  className?: string;
}

// ============================================
// VARIANT CLASSES
// ============================================

const variantClasses: Record<
  AlertVariant,
  {
    container: string;
    icon: string;
    title: string;
    message: string;
    closeButton: string;
  }
> = {
  info: {
    container: 'bg-primary/10 dark:bg-primary/10 border border-primary/30 dark:border-primary/30',
    icon: 'text-primary dark:text-primary',
    title: 'text-primary dark:text-primary',
    message: 'text-primary/80 dark:text-primary/80',
    closeButton: 'text-primary/60 hover:text-primary dark:text-primary/60 dark:hover:text-primary',
  },
  success: {
    container: 'bg-success/10 dark:bg-success/10 border border-success/30 dark:border-success/30',
    icon: 'text-success dark:text-success',
    title: 'text-success dark:text-success',
    message: 'text-success/80 dark:text-success/80',
    closeButton: 'text-success/60 hover:text-success dark:text-success/60 dark:hover:text-success',
  },
  warning: {
    container: 'bg-warning/10 dark:bg-warning/10 border border-warning/30 dark:border-warning/30',
    icon: 'text-warning dark:text-warning',
    title: 'text-warning dark:text-warning',
    message: 'text-warning/80 dark:text-warning/80',
    closeButton: 'text-warning/60 hover:text-warning dark:text-warning/60 dark:hover:text-warning',
  },
  error: {
    container: 'bg-danger/10 dark:bg-danger/10 border border-danger/30 dark:border-danger/30',
    icon: 'text-danger dark:text-danger',
    title: 'text-danger dark:text-danger',
    message: 'text-danger/80 dark:text-danger/80',
    closeButton: 'text-danger/60 hover:text-danger dark:text-danger/60 dark:hover:text-danger',
  },
};

// ============================================
// SIZE CLASSES
// ============================================

const sizeClasses: Record<AlertSize, { container: string; icon: string; title: string; message: string }> =
  {
    sm: {
      container: 'p-3 rounded-md',
      icon: 'w-4 h-4',
      title: 'text-xs font-bold uppercase tracking-widest',
      message: 'text-xs font-medium',
    },
    md: {
      container: 'p-4 rounded-lg',
      icon: 'w-5 h-5',
      title: 'text-sm font-bold uppercase tracking-wider',
      message: 'text-sm font-medium',
    },
    lg: {
      container: 'p-6 rounded-xl',
      icon: 'w-6 h-6',
      title: 'text-base font-bold uppercase tracking-wider',
      message: 'text-sm font-medium',
    },
  };

// ============================================
// DEFAULT ICONS BY VARIANT
// ============================================

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: <AlertCircle className="w-full h-full" />,
  success: <CheckCircle className="w-full h-full" />,
  warning: <AlertTriangle className="w-full h-full" />,
  error: <AlertTriangle className="w-full h-full" />,
};

// ============================================
// ALERT COMPONENT
// ============================================

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      size = 'md',
      title,
      message,
      icon,
      closeable = false,
      onClose,
      showIconPill = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isClosed, setIsClosed] = useState(false);

    const handleClose = () => {
      setIsClosed(true);
      onClose?.();
    };

    if (isClosed) return null;

    const variantStyle = variantClasses[variant];
    const sizeStyle = sizeClasses[size];
    const displayIcon = icon || defaultIcons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={`
          flex items-start gap-4
          ${sizeStyle.container}
          ${variantStyle.container}
          ${className || ''}
        `}
        {...props}
      >
        {/* Icon */}
        {displayIcon && (
          <div
            className={`
              flex-shrink-0 flex items-center justify-center
              ${sizeStyle.icon}
              ${variantStyle.icon}
              ${
                showIconPill
                  ? `rounded-md p-1 ${variant === 'info' ? 'bg-primary/15' : variant === 'success' ? 'bg-success/15' : variant === 'warning' ? 'bg-warning/15' : 'bg-danger/15'}`
                  : ''
              }
            `}
          >
            {displayIcon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && <p className={`${sizeStyle.title} mb-1 ${variantStyle.title}`}>{title}</p>}
          {message && <p className={`${sizeStyle.message} ${variantStyle.message}`}>{message}</p>}
          {children && <div className={`${variantStyle.message}`}>{children}</div>}
        </div>

        {/* Close Button */}
        {closeable && (
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0 p-1 rounded-md transition-colors
              ${variantStyle.closeButton}
              hover:bg-slate-200/20 dark:hover:bg-slate-700/20
            `}
            aria-label="Close alert"
          >
            <X className={sizeStyle.icon} />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;

/**
 * USAGE GUIDE
 *
 * 1. Info Alert
 *    <Alert variant="info" title="Notice" message="This is an info message" />
 *
 * 2. Success Alert
 *    <Alert variant="success" title="Success" message="Operation completed" />
 *
 * 3. Warning Alert
 *    <Alert variant="warning" title="Warning" message="Please review before proceeding" />
 *
 * 4. Error Alert
 *    <Alert variant="error" title="Error" message="Something went wrong" />
 *
 * 5. With Custom Icon
 *    <Alert variant="info" icon={<CustomIcon />} message="Custom message" />
 *
 * 6. Closeable Alert
 *    <Alert variant="info" message="Dismiss me" closeable onClose={() => console.log('closed')} />
 *
 * 7. Different Sizes
 *    <Alert size="sm" message="Small alert" />
 *    <Alert size="md" message="Medium alert" />
 *    <Alert size="lg" message="Large alert" />
 *
 * 8. With Custom Content
 *    <Alert variant="info">
 *      <p>Custom content</p>
 *    </Alert>
 */
