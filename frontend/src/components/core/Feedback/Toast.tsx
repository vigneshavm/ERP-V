import React from 'react';
import { CheckCircle, XCircle, Loader2, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading' | 'warning';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    onDismiss?: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: React.ReactNode; border: string }> = {
    success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-500',
        icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-500',
        icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    },
    loading: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-500',
        icon: <Loader2 className="w-5 h-5 text-indigo-600 dark:text-primary animate-spin" />,
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-500',
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-warning" />,
    },
};

const textColors: Record<ToastType, string> = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    loading: 'text-indigo-800 dark:text-indigo-200',
    warning: 'text-amber-800 dark:text-amber-200',
};

/**
 * Toast notification component.
 * Displays success, error, loading, or warning messages.
 */
export const Toast: React.FC<ToastProps> = ({ id, type, message, onDismiss }) => {
    const style = toastStyles[type];
    const textColor = textColors[type];

    return (
        <div
            className={`
        flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-lg
        ${style.bg} ${style.border}
        animate-slide-in-right
        min-w-[300px] max-w-[400px]
      `}
            role="alert"
            aria-live={type === 'error' ? 'assertive' : 'polite'}
        >
            <div className="flex-shrink-0">{style.icon}</div>

            <p className={`flex-1 text-sm font-medium ${textColor}`}>
                {message}
            </p>

            {type !== 'loading' && onDismiss && (
                <button
                    onClick={() => onDismiss(id)}
                    className={`
            flex-shrink-0 p-1 rounded-full
            hover:bg-black/10 dark:hover:bg-white/10
            transition-colors
          `}
                    aria-label="Dismiss notification"
                >
                    <X className={`w-4 h-4 ${textColor}`} />
                </button>
            )}
        </div>
    );
};

/**
 * Container for stacking multiple toasts.
 */
export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-2"
            aria-label="Notifications"
        >
            {children}
        </div>
    );
};
