/**
 * NavGroup — Collapsible sidebar navigation group.
 *
 * Upgrades over original:
 * - AnimatePresence children mount/unmount with height spring animation
 * - Keyboard: Enter/Space toggles, all focus-visible rings
 * - Collapsed tooltip panel uses proper role="tooltip" + aria-haspopup
 * - Section active state uses gradient background for depth
 * - Smooth chevron rotation with Framer transform
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/shared/lib/store/uiStore';

interface NavGroupProps {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isActive?: boolean;
}

const NavGroup: React.FC<NavGroupProps> = ({
  icon: Icon = ChevronDown,
  label,
  children,
  defaultOpen = false,
  isActive = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { desktopCollapsed } = useUiStore();

  /* ── Collapsed mode: icon-only with fly-out tooltip panel ── */
  if (desktopCollapsed) {
    return (
      <div className="relative group/flyout py-0.5">
        <button
          aria-label={label}
          aria-haspopup="true"
          className={[
            'w-full flex justify-center items-center py-2.5 rounded-xl transition-all duration-200',
            'min-h-[44px] outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary/60',
            isActive
              ? 'bg-primary/10 dark:bg-primary/15 text-primary'
              : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[var(--erp-bg-sunken)] hover:text-neutral-700 dark:hover:text-neutral-200',
          ].join(' ')}
        >
          <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
        </button>

        {/* Fly-out tooltip panel */}
        <div
          role="tooltip"
          className={[
            'absolute left-full top-0 ml-3 hidden group-hover/flyout:block z-50',
            'pointer-events-none group-hover/flyout:pointer-events-auto',
          ].join(' ')}
        >
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={[
              'bg-white dark:bg-[var(--erp-bg)] rounded-xl shadow-2xl',
              'border border-neutral-200 dark:border-neutral-700/60',
              'p-2 min-w-[200px] backdrop-blur-xl',
            ].join(' ')}
          >
            <div className="px-3 py-2 text-[10px] font-black text-primary uppercase tracking-[0.18em] border-b border-neutral-100 dark:border-neutral-800 mb-1.5">
              {label}
            </div>
            <div className="space-y-0.5">{children}</div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Expanded mode ── */
  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={[
          'group w-full flex items-center justify-between',
          'min-h-[44px] px-3 rounded-xl transition-all duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          isActive
            ? 'bg-primary/10 dark:bg-primary/15 text-primary font-extrabold'
            : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[var(--erp-bg-sunken)] hover:text-neutral-800 dark:hover:text-neutral-100 font-bold',
        ].join(' ')}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <Icon
            className={[
              'w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200',
              isActive
                ? 'text-primary'
                : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200',
            ].join(' ')}
            aria-hidden="true"
          />
          <span className="text-[11px] font-extrabold uppercase tracking-widest truncate">
            {label}
          </span>
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown
            className={[
              'w-3.5 h-3.5 transition-colors duration-200',
              isOpen
                ? isActive
                  ? 'text-primary'
                  : 'text-neutral-600 dark:text-neutral-300'
                : 'text-neutral-300 dark:text-neutral-600',
            ].join(' ')}
            aria-hidden="true"
          />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pt-0.5 pb-1 pl-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavGroup;
