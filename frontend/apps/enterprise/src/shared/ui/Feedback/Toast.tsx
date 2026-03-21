/**
 * Toast / ToastContainer — Notification system.
 *
 * Upgrades over original:
 * - AnimatePresence handles enter AND exit (original only had a CSS animate-in with no exit)
 * - Stacked toasts slide in from right, slide out to right on dismiss
 * - Auto-dismiss timer shows progress bar consuming down to 0
 * - Surface tokens consistent with rest of system (white/dark:neutral-900)
 * - WCAG: role="alert" + aria-live already present, kept and refined
 * - Icon area larger, easier to scan at a glance
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'loading' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  /** Auto-dismiss after N ms; omit or 0 to require manual dismiss */
  duration?: number;
  onDismiss?: (id: string) => void;
}

/* ── Per-type styles ────────────────────────────────────────────────── */
const CONFIG = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    accent: 'bg-emerald-500',
    progress: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-rose-500 dark:text-rose-400',
    accent: 'bg-rose-500',
    progress: 'bg-rose-500',
  },
  loading: {
    icon: Loader2,
    iconClass: 'text-primary animate-spin',
    accent: 'bg-primary',
    progress: 'bg-primary',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500 dark:text-amber-400',
    accent: 'bg-amber-500',
    progress: 'bg-amber-500',
  },
} as const;

/* ── Single Toast ───────────────────────────────────────────────────── */
export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 4000,
  onDismiss,
}) => {
  const cfg = CONFIG[type];
  const IconCmp = cfg.icon;
  const isDismissible = type !== 'loading' && !!onDismiss;
  const progressRef = useRef<HTMLDivElement>(null);

  /* Auto-dismiss timer */
  useEffect(() => {
    if (!duration || type === 'loading' || !onDismiss) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, type, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 56, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 56, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={[
        'relative flex items-start gap-3 overflow-hidden',
        'min-w-[280px] max-w-[400px] w-full',
        'bg-white dark:bg-[var(--erp-bg)]',
        'border border-neutral-200 dark:border-neutral-700/60',
        'rounded-xl shadow-lg shadow-black/8',
        'p-4',
      ].join(' ')}
    >
      {/* Left accent bar */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${cfg.accent}`}
        aria-hidden="true"
      />

      {/* Icon */}
      <IconCmp
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconClass}`}
        aria-hidden="true"
      />

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-200 leading-snug">
        {message}
      </p>

      {/* Dismiss */}
      {isDismissible && (
        <button
          onClick={() => onDismiss!(id)}
          aria-label="Dismiss notification"
          className={[
            'flex-shrink-0 p-1 -mr-1 -mt-1 rounded-lg',
            'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200',
            'hover:bg-neutral-100 dark:hover:bg-[var(--erp-card)]',
            'transition-colors duration-150',
            'outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          ].join(' ')}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      {/* Progress bar */}
      {duration > 0 && type !== 'loading' && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
          className={`absolute bottom-0 left-1 right-0 h-0.5 ${cfg.progress} opacity-40`}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
};

/* ── Container ──────────────────────────────────────────────────────── */
export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    aria-label="Notifications"
    className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end"
  >
    <AnimatePresence mode="popLayout">
      {children}
    </AnimatePresence>
  </div>
);
