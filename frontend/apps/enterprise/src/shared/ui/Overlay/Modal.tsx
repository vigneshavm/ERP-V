/**
 * Modal — Accessible overlay dialog.
 *
 * Upgrades over original:
 * - AnimatePresence for enter/exit spring animation (backdrop fade + panel slide-up)
 * - Focus trap: first focusable element receives focus on open; Escape closes
 * - Close button uses Lucide X, not inline SVG
 * - Consistent surface: white/dark:neutral-900 (not dark:bg-[rgb(var(--color-card))])
 * - Scrollable body with custom thin scrollbar
 * - Size variants extended with 2xl
 * - ARIA: role="dialog", aria-modal, aria-labelledby, aria-describedby
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  description?: string;
}

const SIZE: Record<string, string> = {
  sm:   'max-w-md',
  md:   'max-w-2xl',
  lg:   'max-w-4xl',
  xl:   'max-w-5xl',
  '2xl':'max-w-7xl',
  full: 'max-w-full mx-4',
};

const TITLE_ID = 'modal-title';
const DESC_ID  = 'modal-desc';

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer = null,
  description,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  /* Focus trap + Escape */
  useEffect(() => {
    if (!isOpen) return;

    /* Move focus into panel */
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  /* Prevent body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        /* Backdrop */
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          aria-hidden="true"
        >
          {/* Panel */}
          <motion.div
            ref={panelRef}
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={TITLE_ID}
            aria-describedby={description ? DESC_ID : undefined}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={[
              SIZE[size] || SIZE.md,
              'w-full max-h-[90dvh] flex flex-col',
              'bg-white dark:bg-[var(--erp-bg)]',
              'border border-neutral-200 dark:border-neutral-700/60',
              'rounded-2xl shadow-2xl shadow-black/20',
            ].join(' ')}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/60 flex-shrink-0">
              <div className="min-w-0">
                <h2
                  id={TITLE_ID}
                  className="text-lg font-black text-neutral-900 dark:text-neutral-50 leading-snug tracking-tight"
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id={DESC_ID}
                    className="mt-1 text-sm text-neutral-500 dark:text-neutral-400"
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  aria-label="Close dialog"
                  className={[
                    'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg',
                    'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
                    'hover:bg-neutral-100 dark:hover:bg-[var(--erp-bg-sunken)]',
                    'transition-colors duration-150',
                    'outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  ].join(' ')}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </motion.button>
              )}
            </div>

            {/* Body */}
            <div
              className={[
                'flex-1 overflow-y-auto overflow-x-hidden px-6 py-5',
                'scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent',
              ].join(' ')}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800/60">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
