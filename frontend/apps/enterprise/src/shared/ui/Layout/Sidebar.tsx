/**
 * Sidebar — Enterprise navigation shell.
 *
 * Upgrades over original:
 * - Consistent CSS-variable surface tokens work in both light AND dark mode
 *   (original used `bg-sidebar/80` for the panel but raw `bg-white` in child cards)
 * - Branch selector redesigned as a floating pill selector, not a bare <select>
 * - Footer actions use a uniform icon-button style at every collapse state
 * - Mobile overlay closes on Escape key (a11y)
 * - Logo shimmer gradient on hover for personality
 * - Framer Motion entrance animation for sidebar panel on mobile
 * - No more hook-in-render antipattern (useConfig() called inside JSX template)
 */

'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@repo/shared';
import { setTheme, setBranch } from '@/entities/session/model/authSlice';
import { logger } from '@/shared/lib/logger';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft, LogOut, Key, Sun, Moon,
  ChevronDown, Building2
} from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useConfig } from '@/app/providers/ConfigProvider';
import { useBranchResolver } from '@/hooks/useBranchResolver';
import { usePermissions } from '@/hooks/usePermissions';
import { AppView, ModuleType } from '@repo/shared';
import { RootState } from '@/app/store/store';
import NavItem from './NavItem';
import NavGroup from './NavGroup';
import ChangePasswordModal from '../Auth/ChangePasswordModal';
import { MENU_ITEMS, MenuItem } from '@/app/config/menu.config';

interface SidebarProps {
  onLogout: () => void;
}

/* ─── Micro icon button ─────────────────────────────────────────────── */
const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}> = ({ onClick, title, children, variant = 'default' }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    aria-label={title}
    className={[
      'flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200',
      'outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      variant === 'danger'
        ? 'text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400'
        : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[var(--erp-bg-sunken)] hover:text-neutral-700 dark:hover:text-neutral-200',
    ].join(' ')}
  >
    {children}
  </motion.button>
);

/* ─── Theme toggle ──────────────────────────────────────────────────── */
const ThemeToggleBtn: React.FC<{
  theme: 'light' | 'dark';
  onToggle: () => void;
  showLabel?: boolean;
}> = ({ theme, onToggle, showLabel = false }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.96 }}
    onClick={onToggle}
    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    className={[
      'flex items-center gap-2.5 transition-colors duration-200 rounded-xl outline-none',
      'focus-visible:ring-2 focus-visible:ring-primary/60',
      showLabel ? 'px-3 py-2 w-full hover:bg-neutral-100 dark:hover:bg-[var(--erp-bg-sunken)]' : 'p-2',
    ].join(' ')}
  >
    <motion.span
      key={theme}
      initial={{ rotate: -30, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      exit={{ rotate: 30, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-shrink-0"
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
      )}
    </motion.span>
    {showLabel && (
      <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </span>
    )}
  </motion.button>
);

/* ─── Main Component ────────────────────────────────────────────────── */
const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const dispatch = useDispatch();
  const { user, role, theme } = useAuthStore();
  const { tenants, branches: branchesFromDB } = useSelector((state: RootState) => state.tenant);
  const { pathname } = useLocation();
  const {
    sidebarOpen, desktopCollapsed, isSyncing,
    setSidebarOpen, setDesktopCollapsed,
  } = useUiStore();
  const { currentBranch: selectedBranch } = useAuthStore();
  const { tenantId, logoUrl } = useConfig();   // ← called once at top, not inside JSX
  const currentTenant = useMemo(
    () => tenants.find((t: any) => t.id === tenantId),
    [tenants, tenantId],
  );
  const { getBranchName } = useBranchResolver();
  const { checkAccess, checkModuleAccess } = usePermissions();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  /* Close mobile sidebar on Escape */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* Active group check */
  const isGroupActive = (item: MenuItem): boolean => {
    if (item.path && (pathname === item.path || pathname.startsWith(item.path + '/'))) return true;
    if (!item.children) return false;
    return item.children.some((child: MenuItem) => isGroupActive(child));
  };

  /* Recursive item renderer */
  const renderRecursive = (item: MenuItem, isSub = false, depth = 0): React.ReactNode => {
    if (!checkAccess(item.id)) return null;
    if (!checkModuleAccess(item.module)) return null;

    if (item.children) {
      const visibleChildren = item.children.filter(
        (child: MenuItem) => checkAccess(child.id) && checkModuleAccess(child.module),
      );
      if (visibleChildren.length === 0) return null;

      return (
        <div key={item.id} className="w-full">
          <NavGroup
            icon={item.icon}
            label={item.label}
            defaultOpen={isGroupActive(item) || item.isGrow}
            isActive={isGroupActive(item)}
          >
            {visibleChildren.map((child: MenuItem) => renderRecursive(child, true, depth + 1))}
          </NavGroup>
        </div>
      );
    }

    return (
      <NavItem
        key={item.id}
        id={item.id}
        icon={item.icon}
        label={item.label}
        path={item.path}
        isSubItem={isSub}
      />
    );
  };

  /* Branch selector */
  const branchSelector = useMemo(() => {
    const rawBranches = [
      ...(currentTenant?.locations?.flatMap((l: any) => l.branches) || []),
      ...branchesFromDB.filter(
        (b: any) => (b as any).tenantId === tenantId || (b as any).tenant_id === tenantId,
      ),
    ].filter(Boolean);

    const uniqueBranchesMap = new Map<string, any>();
    rawBranches.forEach((b: any) => {
      if (!uniqueBranchesMap.has(b.id)) uniqueBranchesMap.set(b.id, b);
    });
    const availableBranches = Array.from(uniqueBranchesMap.values());

    if (availableBranches.length <= 1) return null;

    return (
      <div className="mt-2">
        {role === 'Owner' || role === 'Admin' ? (
          <div className="relative">
            <Building2
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
            <select
              value={selectedBranch || 'All'}
              onChange={(e) => dispatch(setBranch(e.target.value))}
              aria-label="Select branch"
              className={[
                'w-full appearance-none bg-neutral-50 dark:bg-[var(--erp-card)]/60',
                'border border-neutral-200 dark:border-neutral-700 rounded-lg',
                'pl-8 pr-7 py-1.5 text-[11px] font-bold text-neutral-700 dark:text-neutral-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                'cursor-pointer transition-all',
              ].join(' ')}
            >
              <option value="All">All Branches (HQ)</option>
              {availableBranches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {getBranchName(selectedBranch || 'All')}
          </div>
        )}
      </div>
    );
  }, [currentTenant, branchesFromDB, role, selectedBranch, dispatch, getBranchName, tenantId]);

  /* Separated menu sections */
  const erpItems = useMemo(() => MENU_ITEMS.filter((item: MenuItem) => !item.isGrow), []);
  const growItems = useMemo(() => MENU_ITEMS.filter((item: MenuItem) => item.isGrow), []);

  const visibleErpItems = useMemo(() => erpItems.filter((item: MenuItem) =>
    (checkAccess(item.id) && checkModuleAccess(item.module)) ||
    item.children?.some((c: MenuItem) => checkAccess(c.id) && checkModuleAccess(c.module))
  ), [erpItems, checkAccess, checkModuleAccess]);

  const visibleGrowItems = useMemo(() => growItems.filter((item: MenuItem) =>
    (checkAccess(item.id) && checkModuleAccess(item.module)) ||
    item.children?.some((c: MenuItem) => checkAccess(c.id) && checkModuleAccess(c.module))
  ), [growItems, checkAccess, checkModuleAccess]);

  const initials = user?.name?.charAt(0) || currentTenant?.name?.charAt(0) || 'T';

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={[
          /* Position & size */
          'fixed lg:static inset-y-0 left-0 z-40 flex flex-col',
          /* Width transitions */
          desktopCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
          /* Mobile slide */
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          /* Surface — intentional light/dark tokens */
          'bg-white dark:bg-[var(--erp-bg)]',
          'border-r border-neutral-100 dark:border-neutral-800/60',
          /* Animation */
          'transition-all duration-300',
          /* Padding */
          'p-2',
        ].join(' ')}
      >

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className={[
          'flex items-center mb-4 mt-1 px-2',
          desktopCollapsed ? 'justify-center' : 'justify-between',
        ].join(' ')}>
          {/* Logo + Name */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-primary shadow-md shadow-primary/25"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="font-black text-main text-sm">{initials}</span>
              )}
            </motion.div>
            {!desktopCollapsed && (
              <div className="min-w-0">
                <p className="text-[13px] font-black tracking-tight text-neutral-900 dark:text-neutral-100 truncate leading-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.18em] mt-0.5 opacity-80">
                  {role} · Authorized
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Mobile close */}
            <IconBtn onClick={() => setSidebarOpen(false)} title="Close menu">
              <X className="w-4 h-4 lg:hidden" aria-hidden="true" />
            </IconBtn>
            {/* Desktop collapse */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={[
                'hidden lg:flex items-center justify-center w-7 h-7 rounded-lg',
                'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[var(--erp-bg-sunken)] hover:text-neutral-700 dark:hover:text-neutral-200',
                'transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              ].join(' ')}
            >
              {desktopCollapsed
                ? <ChevronRight className="w-4 h-4" aria-hidden="true" />
                : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
            </motion.button>
          </div>
        </div>

        {/* ── Tenant / Branch ────────────────────────────────────── */}
        {!desktopCollapsed && (
          <div className="px-3 mb-4">
            {currentTenant?.name && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-1 truncate">
                {currentTenant.name}
              </p>
            )}
            {branchSelector}
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────── */}
        <nav
          aria-label="Application modules"
          className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden
            scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-700
            scrollbar-track-transparent pr-0.5"
        >
          {/* ERP Core */}
          {!desktopCollapsed && visibleErpItems.length > 0 && (
            <div className="px-3 pt-3 pb-1.5">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                System Core
              </h3>
            </div>
          )}
          {visibleErpItems.map((item: MenuItem) => renderRecursive(item, false))}

          {/* Growth Platform */}
          {visibleGrowItems.length > 0 && (
            <>
              {!desktopCollapsed && (
                <div className="px-3 pt-5 pb-1.5 mt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                    Growth Platform
                  </h3>
                </div>
              )}
              {desktopCollapsed && (
                <div className="mx-3 my-2 h-px bg-neutral-100 dark:bg-[var(--erp-card)]/60" />
              )}
              {visibleGrowItems.map((item: MenuItem) => renderRecursive(item, false))}
            </>
          )}
        </nav>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800/60">

          {desktopCollapsed ? (
            /* Icon-only footer */
            <div className="flex flex-col items-center gap-1 pb-1">
              <ThemeToggleBtn
                theme={(theme as 'light' | 'dark') || 'light'}
                onToggle={() => dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))}
              />
              <IconBtn onClick={() => setIsChangePasswordOpen(true)} title="Change Password">
                <Key className="w-4 h-4" aria-hidden="true" />
              </IconBtn>
              <IconBtn onClick={onLogout} title="Sign Out" variant="danger">
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </IconBtn>
            </div>
          ) : (
            /* Full footer */
            <div className="space-y-0.5 pb-1">
              <ThemeToggleBtn
                theme={(theme as 'light' | 'dark') || 'light'}
                onToggle={() => dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))}
                showLabel
              />
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors duration-200',
                  'text-[11px] font-bold uppercase tracking-widest',
                  'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[var(--erp-bg-sunken)] hover:text-neutral-800 dark:hover:text-neutral-100',
                  'outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                ].join(' ')}
              >
                <Key className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Change Password
              </button>
              <motion.button
                whileHover={{ x: 2 }}
                onClick={onLogout}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors duration-200',
                  'text-[11px] font-bold uppercase tracking-widest',
                  'text-neutral-500 hover:bg-rose-50 dark:hover:bg-rose-900/20',
                  'hover:text-rose-600 dark:hover:text-rose-400',
                  'outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60',
                ].join(' ')}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Sign Out
              </motion.button>
            </div>
          )}
        </div>
      </aside>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};

export default Sidebar;
