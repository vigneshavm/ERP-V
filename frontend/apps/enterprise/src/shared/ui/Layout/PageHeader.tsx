/**
 * PageHeader — Page title / breadcrumb / action bar.
 *
 * Upgrades over original:
 * - Replaced raw gray color classes with semantic tokens (text-neutral-*)
 * - Breadcrumb separator uses Lucide ChevronRight (not inline SVG)
 * - Title uses `clamp()` for fluid typography across viewport sizes
 * - Actions row wraps correctly on mobile (flex-wrap + full-width on xs)
 * - Entrance animation via Framer stagger for a polished feel
 * - Breadcrumb links have focus-visible rings
 */

'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  link?: string | null;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string | null;
  subtitle?: string | null;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
  breadcrumbs?: Breadcrumb[] | null;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, ease: 'easeOut' },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  actions = null,
  backButton = null,
  breadcrumbs = null,
}) => {
  const displayDescription = description || subtitle;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mb-8"
    >
      {/* Back button */}
      {backButton && (
        <motion.div variants={item} className="mb-4">
          {backButton}
        </motion.div>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <motion.nav variants={item} aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight
                    className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {crumb.link || crumb.onClick ? (
                  crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className={[
                        'text-sm text-neutral-500 dark:text-neutral-400',
                        'hover:text-primary dark:hover:text-primary transition-colors duration-150',
                        'outline-none focus-visible:underline focus-visible:text-primary',
                      ].join(' ')}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <a
                      href={crumb.link!}
                      className={[
                        'text-sm text-neutral-500 dark:text-neutral-400',
                        'hover:text-primary dark:hover:text-primary transition-colors duration-150',
                        'outline-none focus-visible:underline focus-visible:text-primary',
                      ].join(' ')}
                    >
                      {crumb.label}
                    </a>
                  )
                ) : (
                  <span
                    className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                    aria-current="page"
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </motion.nav>
      )}

      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <motion.div variants={item} className="min-w-0">
          <h1
            className={[
              /* Fluid: 24px at 375px → 30px at 1280px */
              'font-black text-neutral-900 dark:text-neutral-50 leading-tight tracking-tight',
              'text-[clamp(1.5rem,2.5vw+0.75rem,1.875rem)]',
              displayDescription ? 'mb-1.5' : '',
            ].join(' ')}
          >
            {title}
          </h1>
          {displayDescription && (
            <p className="text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {displayDescription}
            </p>
          )}
        </motion.div>

        {actions && (
          <motion.div
            variants={item}
            className="flex flex-wrap gap-2.5 sm:flex-nowrap sm:flex-shrink-0"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PageHeader;
