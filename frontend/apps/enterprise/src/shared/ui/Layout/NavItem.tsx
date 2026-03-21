/**
 * NavItem — Premium sidebar navigation item.
 *
 * Upgrades over original:
 * - Framer Motion spring entrance stagger + hover lift
 * - focus-visible ring (WCAG AAA keyboard nav)
 * - Tooltip via title + aria-label when sidebar is collapsed
 * - Active indicator uses a pill instead of left-border only
 * - Touch-friendly min-height of 44px enforced
 * - Icon colour respects dark/light palette intentionally
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AppView } from '@repo/shared';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigation } from '@/app/providers/NavigationContext';
import { useLocation } from 'react-router-dom';

interface NavItemProps {
  id: AppView;
  icon?: React.ElementType;
  label: string;
  isSubItem?: boolean;
  path?: string;
  /** Animation delay for staggered entrance (ms) */
  delay?: number;
}

const NavItem: React.FC<NavItemProps> = ({
  id,
  icon: Icon,
  label,
  isSubItem = false,
  path,
  delay = 0,
}) => {
  const { navigate } = useNavigation();
  const { pathname } = useLocation();
  const { desktopCollapsed, setSidebarOpen } = useUiStore();
  const { checkAccess } = usePermissions();

  if (!checkAccess(id)) return null;

  const isActive = path
    ? pathname === path || pathname.startsWith(path + '/')
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay, ease: 'easeOut' }}
      className="w-full"
    >
      <button
        onClick={() => {
          navigate(id);
          setSidebarOpen(false);
        }}
        title={desktopCollapsed ? label : undefined}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className={[
          /* Base */
          'group relative w-full flex items-center transition-all duration-200',
          'min-h-[44px] rounded-xl outline-none',
          /* Focus-visible ring — WCAG AA/AAA */
          'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1',
          /* Spacing */
          desktopCollapsed
            ? 'justify-center px-2 py-2.5'
            : isSubItem
            ? 'pl-11 pr-3 py-2.5 space-x-2'
            : 'pl-3 pr-3 py-2.5 space-x-3',
          /* State */
          isActive
            ? 'bg-primary/10 dark:bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(var(--color-primary),0.2)] font-extrabold'
            : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[var(--erp-bg-sunken)] hover:text-neutral-800 dark:hover:text-neutral-100 font-semibold',
        ].join(' ')}
      >
        {/* Active accent dot */}
        {isActive && !desktopCollapsed && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
          />
        )}

        {/* Icon */}
        {Icon && !isSubItem && (
          <motion.span
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex-shrink-0"
          >
            <Icon
              className={[
                'w-[18px] h-[18px] transition-colors duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300',
              ].join(' ')}
              aria-hidden="true"
            />
          </motion.span>
        )}

        {/* Label */}
        {!desktopCollapsed && (
          <span
            className={[
              'truncate leading-none',
              isSubItem
                ? 'text-[11px] tracking-widest uppercase'
                : 'text-[11px] font-extrabold uppercase tracking-widest',
            ].join(' ')}
          >
            {label}
          </span>
        )}
      </button>
    </motion.div>
  );
};

export default NavItem;
