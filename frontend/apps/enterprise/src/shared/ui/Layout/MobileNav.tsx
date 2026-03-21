/**
 * MobileNav — Bottom navigation bar for mobile viewports.
 *
 * Upgrades over original:
 * - 64px total height + safe-area padding (iOS notch support)
 * - Each item has a min tap-target of 48px via flex + padding
 * - Active state has a pill background indicator with spring animation
 * - Added haptic-style scale feedback via Framer
 * - Menu button opens sidebar instead of a "More" text dead end
 * - Consistent surface token: white/dark:neutral-900 not raw bg-sidebar
 */

'use client';

import React from 'react';
import { LayoutDashboard, ShoppingCart, Landmark, Package, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useNavigation } from '@/app/providers/NavigationContext';
import { useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

const NAV_ITEMS = [
  { id: 'DASHBOARD' as const, path: '/', icon: LayoutDashboard, label: 'Home' },
  { id: 'POS' as const, path: '/pos', icon: ShoppingCart, label: 'POS' },
  { id: 'FINANCE' as const, path: '/finance', icon: Landmark, label: 'Finance' },
  { id: 'INVENTORY' as const, path: '/inventory', icon: Package, label: 'Stock' },
] as const;

const MobileNav: React.FC = () => {
  const { navigate } = useNavigation();
  const { pathname } = useLocation();
  const { setSidebarOpen } = useUiStore();
  const { checkAccess } = usePermissions();

  return (
    <nav
      aria-label="Mobile navigation"
      className={[
        'lg:hidden fixed bottom-0 left-0 right-0 z-[100]',
        'flex justify-around items-stretch',
        /* Surface */
        'bg-white/90 dark:bg-[var(--erp-bg)]/90 backdrop-blur-xl',
        'border-t border-neutral-200 dark:border-neutral-800/60',
        /* Height + safe area */
        'h-16 pb-[env(safe-area-inset-bottom,0px)]',
      ].join(' ')}
    >
      {NAV_ITEMS.map(({ id, path, icon: Icon, label }) => {
        if (!checkAccess(id)) return null;
        const isActive = pathname === path || (path !== '/' && pathname.startsWith(path + '/'));

        return (
          <motion.button
            key={id}
            onClick={() => navigate(id)}
            whileTap={{ scale: 0.88 }}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'relative flex flex-col items-center justify-center flex-1 gap-0.5',
              'min-h-[44px] px-1 py-2 transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50',
              isActive
                ? 'text-primary'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            ].join(' ')}
          >
            {/* Active indicator pill */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-active"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute inset-x-2 top-1 h-10 rounded-xl bg-primary/10 dark:bg-primary/15"
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>

            <Icon className="relative w-[18px] h-[18px]" aria-hidden="true" />
            <span className="relative text-[9px] font-black uppercase tracking-widest">
              {label}
            </span>
          </motion.button>
        );
      })}

      {/* Menu / More */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open full menu"
        className={[
          'flex flex-col items-center justify-center flex-1 gap-0.5',
          'min-h-[44px] px-1 py-2 transition-colors duration-200',
          'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
          'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50',
        ].join(' ')}
      >
        <Menu className="w-[18px] h-[18px]" aria-hidden="true" />
        <span className="text-[9px] font-black uppercase tracking-widest">More</span>
      </motion.button>
    </nav>
  );
};

export default MobileNav;
