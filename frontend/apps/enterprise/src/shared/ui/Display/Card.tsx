/**
 * Card — Generic surface container.
 *
 * Upgrades over original:
 * - Consistent neutral tokens: bg-white dark:bg-neutral-900
 *   (original used bg-slate-800 which clashes with rest of system)
 * - Optional `hoverable` prop adds lift animation
 * - Optional `padding` prop (default true) for flexible layout use
 * - `as` prop for semantic polymorphism (article, section, etc.)
 */

'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: boolean;
  as?: 'div' | 'article' | 'section' | 'li';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  padding = true,
  as: Tag = 'div',
}) => {
  const baseClass = [
    'bg-white dark:bg-neutral-900',
    'border border-neutral-100 dark:border-neutral-800/60',
    'rounded-2xl',
    padding ? 'p-5' : '',
    className,
  ].filter(Boolean).join(' ');

  if (hoverable) {
    return (
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className={[baseClass, 'shadow-sm hover:shadow-md hover:shadow-primary/5 transition-shadow duration-300'].join(' ')}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Tag className={[baseClass, 'shadow-sm'].join(' ')}>
      {children}
    </Tag>
  );
};

export default Card;
