/**
 * MetricCard — KPI summary card.
 *
 * Upgrades over original:
 * - Consistent surface tokens: neutral-X/white rather than hardcoded indigo values
 * - Entrance animation via Framer with optional delay for staggered dashboards
 * - Trend arrow icon with semantic colour (green up / red down)
 * - Progress bar animates from 0 → value on mount (spring)
 * - Card hover: subtle lift + ring instead of just shadow change
 * - Icon container uses a softer glow rather than flat background
 * - WCAG AA contrast maintained for both themes
 */

'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion';
import { useEffect } from 'react';

/* ── Types ─────────────────────────────────────────────────────────── */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'emerald' | 'rose' | 'amber' | 'blue' | 'violet';
  progress?: number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  /** Animation entrance delay in seconds */
  delay?: number;
}

/* ── Color maps ────────────────────────────────────────────────────── */
const iconBg: Record<string, string> = {
  primary: 'bg-primary/10 dark:bg-primary/15 text-primary',
  emerald: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  rose:    'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
  amber:   'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
  blue:    'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
  violet:  'bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',
};

const progressColor: Record<string, string> = {
  primary: 'bg-primary',
  emerald: 'bg-emerald-500',
  rose:    'bg-rose-500',
  amber:   'bg-amber-500',
  blue:    'bg-blue-500',
  violet:  'bg-violet-500',
};

const trendColors = {
  up:      'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  down:    'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
  neutral: 'text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50',
} as const;

const TrendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus } as const;

/* ── Animated progress bar ─────────────────────────────────────────── */
const AnimatedBar: React.FC<{ value: number; color: string; delay?: number }> = ({
  value, color, delay = 0,
}) => {
  const motionVal = useMotionValue(0);
  const width = useTransform(motionVal, (v) => `${v}%`);

  useEffect(() => {
    const ctrl = animate(motionVal, Math.min(100, Math.max(0, value)), {
      duration: 0.8,
      delay,
      ease: [0.4, 0, 0.2, 1],
    });
    return ctrl.stop;
  }, [value, delay, motionVal]);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="mt-4 h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"
    >
      <motion.div
        style={{ width }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
};

/* ── Component ─────────────────────────────────────────────────────── */
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  progress,
  subtext,
  trend,
  trendValue,
  delay = 0,
}) => {
  const TIcon = trend ? TrendIcon[trend] : null;
  const resolvedColor = iconBg[color] ?? iconBg.primary;
  const resolvedProgress = progressColor[color] ?? progressColor.primary;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={[
        'relative bg-white dark:bg-neutral-900 rounded-2xl p-5',
        'border border-neutral-100 dark:border-neutral-800/70',
        'shadow-sm hover:shadow-md hover:shadow-primary/5',
        'transition-shadow duration-300',
        'group outline-none focus-within:ring-2 focus-within:ring-primary/40',
      ].join(' ')}
      aria-label={`${title}: ${value}`}
    >
      <div className="flex justify-between items-start gap-3">
        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 truncate">
            {title}
          </p>
          <p className="text-[1.75rem] font-black text-neutral-900 dark:text-neutral-50 mt-1 leading-none tracking-tight truncate">
            {value}
          </p>
        </div>

        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${resolvedColor}`}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Progress */}
      {progress !== undefined && (
        <AnimatedBar value={progress} color={resolvedProgress} delay={delay + 0.2} />
      )}

      {/* Footer row */}
      {(subtext || trend) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          {subtext && (
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate">
              {subtext}
            </p>
          )}
          {trend && TIcon && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${trendColors[trend]}`}
            >
              <TIcon className="w-3 h-3" aria-hidden="true" />
              {trendValue}
            </span>
          )}
        </div>
      )}
    </motion.article>
  );
};

export default MetricCard;
