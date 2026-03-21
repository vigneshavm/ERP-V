'use client';
/**
 * PageShell — Universal page content wrapper.
 *
 * Replaces every one-off wrapper pattern used across the codebase:
 *   ❌ <div className="premium-bg min-h-screen text-main p-6 sm:p-8 space-y-8 font-sans">
 *   ❌ <div className="space-y-6 animate-fade-in pb-10">
 *   ❌ <div className="premium-bg min-h-screen px-4 pt-6 pb-16">
 *
 *   ✅ <PageShell>…</PageShell>
 *
 * Usage:
 *   import PageShell from '@/shared/ui/Layout/PageShell';
 *
 *   const MyPage = () => (
 *     <Layout>
 *       <PageShell>
 *         <PageHeader title="My Page" />
 *         …content…
 *       </PageShell>
 *     </Layout>
 *   );
 */

import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  /** Extra Tailwind classes if you need to override gap/padding for a specific page */
  className?: string;
  /** Render as a different element. Defaults to 'div'. */
  as?: 'div' | 'section' | 'main';
}

const PageShell: React.FC<PageShellProps> = ({
  children,
  className = '',
  as: Tag = 'div',
}) => (
  <Tag className={`page-shell ${className}`}>
    {children}
  </Tag>
);

export default PageShell;
