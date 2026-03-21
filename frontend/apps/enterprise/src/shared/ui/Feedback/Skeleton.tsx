/**
 * Skeleton — Loading placeholder components.
 *
 * Upgrades over original:
 * - Consistent surface tokens: neutral-200/dark:neutral-800
 *   (original used slate-200/slate-800, inconsistent with Card/MetricCard)
 * - Shimmer animation uses a CSS gradient sweep instead of raw opacity pulse
 *   for a premium "scanning" effect
 * - All skeleton variants preserved + `className` forwarding
 */

'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={[
      'relative overflow-hidden rounded',
      'bg-neutral-200 dark:bg-[var(--erp-card)]',
      /* Shimmer sweep */
      'after:absolute after:inset-0',
      'after:bg-gradient-to-r after:from-transparent after:via-white/60 dark:after:via-white/5 after:to-transparent',
      'after:animate-[shimmer_1.5s_infinite]',
      '[animation-fill-mode:both]',
      className,
    ].join(' ')}
  />
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[var(--erp-bg)] p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 shadow-sm">
    <Skeleton className="w-10 h-10 rounded-xl mb-4" />
    <Skeleton className="w-24 h-3 mb-2 rounded" />
    <Skeleton className="w-16 h-7 rounded" />
  </div>
);

export const GridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-[var(--erp-bg)] rounded-2xl border border-neutral-100 dark:border-neutral-800/60 overflow-hidden shadow-sm h-[320px]"
      >
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <div className="p-5 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="w-16 h-3 rounded" />
            <Skeleton className="w-10 h-3 rounded" />
          </div>
          <Skeleton className="w-full h-5 rounded" />
          <Skeleton className="w-2/3 h-4 rounded" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="w-20 h-8 rounded-lg" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[var(--erp-bg)] rounded-2xl border border-neutral-100 dark:border-neutral-800/60 overflow-hidden shadow-sm">
    <div className="p-4 border-b border-neutral-50 dark:border-neutral-800 flex gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="flex-1 h-6 rounded" />
      ))}
    </div>
    <div className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="flex-1 h-8 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-8 p-6 bg-white dark:bg-[var(--erp-bg)] rounded-2xl border border-neutral-100 dark:border-neutral-800/60 shadow-sm">
    <div className="flex items-center gap-4 mb-8">
      <Skeleton className="w-14 h-14 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="w-48 h-5 rounded" />
        <Skeleton className="w-32 h-3.5 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="w-20 h-3 rounded" />
          <Skeleton className="w-full h-11 rounded-xl" />
        </div>
      ))}
    </div>
    <div className="flex justify-end gap-3 pt-5 border-t border-neutral-100 dark:border-neutral-800/60">
      <Skeleton className="w-24 h-11 rounded-xl" />
      <Skeleton className="w-32 h-11 rounded-xl" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2"><TableSkeleton /></div>
      <div className="space-y-5">
        <CardSkeleton /><CardSkeleton />
      </div>
    </div>
  </div>
);
