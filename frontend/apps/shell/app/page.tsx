"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, LoginForm, SelectionPage } from '@repo/mfe-auth';

/**
 * Navigation strategy per MFE type:
 *
 *  - personal  → Next.js app on :3002, basePath /personal
 *                Shell rewrites /personal/* → :3002. Use router.push (SPA).
 *
 *  - business  → Next.js app on :3003, basePath /business
 *                Shell rewrites /business/* → :3003. Use router.push (SPA).
 *
 *  - enterprise → Vite SPA on :3004, base /enterprise/
 *                 Runs as a completely separate JS runtime. The shell's
 *                 Next.js router has no /enterprise page to render, so
 *                 router.push lands on a 404 inside the shell.
 *                 Fix: window.location.href forces a full browser navigation
 *                 directly to the Vite dev server (proxied by the shell rewrite).
 *
 * FIX 2 (prefetch): Only prefetch the two Next.js MFEs. Prefetching the
 * enterprise Vite bundle via router.prefetch does nothing useful since the
 * shell can't serve it — the browser will fetch it naturally on navigation.
 */

const NEXT_ROUTES = {
  personal: '/personal/home',
  business: '/business',
} as const;

// Enterprise is a Vite SPA — navigated to with a hard redirect.
const ENTERPRISE_URL = '/enterprise/';

export default function ShellHome() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prefetch the two Next.js MFEs in the background on mount.
  React.useEffect(() => {
    if (!mounted) return;
    Object.values(NEXT_ROUTES).forEach((route) => router.prefetch(route));
  }, [mounted, router]);

  if (!mounted) return null;

  const handleSelection = (type: 'personal' | 'business' | 'enterprise') => {
    if (type === 'enterprise') {
      // Vite SPA — must use a hard browser navigation so the separate
      // Vite runtime boots correctly. The shell rewrite proxies this to :3004.
      window.location.href = ENTERPRISE_URL;
      return;
    }
    // Next.js MFEs — SPA navigation via shell rewrites.
    router.push(NEXT_ROUTES[type]);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) return <LoginForm />;

  return (
    <SelectionPage onSelect={handleSelection} />
  );
}
