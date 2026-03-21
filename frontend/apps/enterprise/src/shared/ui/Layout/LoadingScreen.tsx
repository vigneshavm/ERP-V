/**
 * LoadingScreen — Full-page initialisation splash.
 *
 * Upgrades over original:
 * - Dark mode supported (bg-neutral-50 / dark:bg-neutral-950)
 * - Three-dot pulse replaces plain spinner — more modern & branded
 * - Optional logo slot; falls back to initials
 * - Staggered fade-in for a polished first impression
 * - Framer Motion handles the pulse sequence (no raw CSS keyframe)
 */

'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  logoSrc?: string;
  initial?: string;
}

const DOT_VARIANTS: Variants = {
  initial: { y: 0, opacity: 0.3 },
  animate: (i: number) => ({
    y: [0, -8, 0],
    opacity: [0.3, 1, 0.3],
    transition: {
      duration: 0.9,
      delay: i * 0.15,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  }),
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Initializing...',
  logoSrc,
  initial = 'E',
}) => (
  <div
    role="status"
    aria-label={message}
    aria-live="polite"
    className={[
      'min-h-screen flex flex-col items-center justify-center gap-8 p-8',
      'bg-neutral-50 dark:bg-neutral-950 transition-colors',
    ].join(' ')}
  >
    {/* Logo */}
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center overflow-hidden"
    >
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoSrc} alt="Logo" className="w-full h-full object-contain p-2" />
      ) : (
        <span className="text-2xl font-black text-main">{initial}</span>
      )}
    </motion.div>

    {/* Dot loader */}
    <div className="flex items-center gap-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          custom={i}
          variants={DOT_VARIANTS}
          initial="initial"
          animate="animate"
          className="w-2 h-2 rounded-full bg-primary"
        />
      ))}
    </div>

    {/* Message */}
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="text-sm font-medium text-neutral-400 dark:text-neutral-500 tracking-wide"
    >
      {message}
    </motion.p>
  </div>
);

export default LoadingScreen;
