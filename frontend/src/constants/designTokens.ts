/**
 * DESIGN SYSTEM TOKENS
 * 
 * Central place for all design constants: spacing, typography, colors, shadows, and border radius.
 * Use these tokens instead of hardcoding values to ensure consistency across the entire app.
 * 
 * Import: import { spacing, typography, shadows, radius } from '@/constants/designTokens'
 */

// ============================================
// SPACING SCALE
// ============================================
// Use this scale consistently for all padding, margin, and gaps.
// Based on an 8px base unit.

export const spacing = {
  // Micro spacing (use sparingly)
  xs: '0.25rem', // 4px
  
  // Standard scale
  sm: '0.5rem',  // 8px   - Tight spacing (icon gaps, small padding)
  md: '1rem',    // 16px  - Default spacing (card padding, standard gaps)
  lg: '1.5rem',  // 24px  - Comfortable spacing (section gaps)
  xl: '2rem',    // 32px  - Large spacing (major sections)
  xxl: '3rem',   // 48px  - Extra large spacing (page sections)
  
  // Tailwind aliases (for className usage)
  'px-sm': 'px-2',      // 8px horizontal padding
  'px-md': 'px-4',      // 16px horizontal padding
  'px-lg': 'px-6',      // 24px horizontal padding
  'py-sm': 'py-2',      // 8px vertical padding
  'py-md': 'py-4',      // 16px vertical padding
  'py-lg': 'py-6',      // 24px vertical padding
  'p-sm': 'p-2',        // 8px all padding
  'p-md': 'p-4',        // 16px all padding
  'p-lg': 'p-6',        // 24px all padding
} as const;

// ============================================
// BORDER RADIUS
// ============================================
// Three standard values for consistent rounding.

export const radius = {
  // Small rounding - for subtle, minimal design
  sm: '0.5rem',  // 4px - Inputs, small elements, minor components
  
  // Medium rounding - for most components
  md: '0.75rem', // 8px - Buttons, cards, modals (default for most)
  
  // Large rounding - for prominent components
  lg: '1rem',    // 16px - Large cards, prominent containers (rare)
  
  // Tailwind aliases
  'rounded-sm': 'rounded-lg',
  'rounded-md': 'rounded-2xl',
  'rounded-lg': 'rounded-3xl',
} as const;

// ============================================
// TYPOGRAPHY SCALE
// ============================================
// Semantic heading levels and body text sizes.

export const typography = {
  // Headings - Use these for page/section titles
  heading: {
    h1: {
      fontSize: '2rem',        // 32px
      lineHeight: '2.5rem',    // 40px
      fontWeight: '900',       // Black
      letterSpacing: '-0.02em', // Tight
    },
    h2: {
      fontSize: '1.75rem',     // 28px
      lineHeight: '2.25rem',   // 36px
      fontWeight: '800',       // Extra bold
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',      // 24px
      lineHeight: '2rem',      // 32px
      fontWeight: '700',       // Bold
      letterSpacing: '0',
    },
    h4: {
      fontSize: '1.25rem',     // 20px
      lineHeight: '1.75rem',   // 28px
      fontWeight: '600',       // Semibold
      letterSpacing: '0',
    },
  },

  // Body text - Standard paragraph text
  body: {
    regular: {
      fontSize: '0.875rem',    // 14px (standard body)
      lineHeight: '1.5rem',    // 24px
      fontWeight: '400',       // Regular
      letterSpacing: '0',
    },
    medium: {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.5rem',    // 24px
      fontWeight: '500',       // Medium
      letterSpacing: '0',
    },
    bold: {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.5rem',    // 24px
      fontWeight: '600',       // Semibold
      letterSpacing: '0',
    },
  },

  // Small text - Labels, helper text, captions
  small: {
    regular: {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1rem',      // 16px
      fontWeight: '400',       // Regular
      letterSpacing: '0.5px',  // Slightly wider
    },
    medium: {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1rem',      // 16px
      fontWeight: '500',       // Medium
      letterSpacing: '0.5px',
    },
    bold: {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1rem',      // 16px
      fontWeight: '600',       // Semibold
      letterSpacing: '0.5px',
    },
  },

  // Extra small - Micro labels, badges
  xs: {
    regular: {
      fontSize: '0.625rem',    // 10px
      lineHeight: '0.875rem',  // 14px
      fontWeight: '400',       // Regular
      letterSpacing: '0.05em', // Wide
    },
    bold: {
      fontSize: '0.625rem',    // 10px
      lineHeight: '0.875rem',  // 14px
      fontWeight: '600',       // Semibold
      letterSpacing: '0.05em',
    },
  },

  // Tailwind aliases
  'text-xs': 'text-10px',
  'text-sm': 'text-12px',
  'text-md': 'text-14px',
  'text-lg': 'text-16px',
  'text-xl': 'text-20px',
  'text-2xl': 'text-24px',
  'text-3xl': 'text-28px',
  'text-4xl': 'text-32px',
} as const;

// ============================================
// SHADOW / ELEVATION SYSTEM
// ============================================
// Elevation levels for visual hierarchy.

export const shadows = {
  // No shadow
  none: 'shadow-none',

  // Level 1 - Subtle, at-rest elements
  sm: {
    light: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    dark: '0 1px 2px 0 rgb(0 0 0 / 0.1)',
    tailwind: 'shadow-sm',
  },

  // Level 2 - Slightly elevated, hover states
  md: {
    light: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    dark: '0 4px 6px -1px rgb(0 0 0 / 0.25)',
    tailwind: 'shadow-md',
  },

  // Level 3 - Prominent, cards, floating elements
  lg: {
    light: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    dark: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
    tailwind: 'shadow-lg',
  },

  // Level 4 - Very prominent, modals, dropdowns
  xl: {
    light: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    dark: '0 20px 25px -5px rgb(0 0 0 / 0.4)',
    tailwind: 'shadow-xl',
  },

  // Level 5 - Maximum elevation, full-screen overlays
  xxl: {
    light: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    dark: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    tailwind: 'shadow-2xl',
  },
} as const;

// ============================================
// COLOR SYSTEM (Semantic)
// ============================================
// Use these semantic color names instead of literal colors.

export const colors = {
  // Semantic intent colors
  primary: 'var(--color-primary)',           // Brand/action color (indigo)
  secondary: 'var(--color-text-secondary)',  // Secondary text/elements
  success: 'var(--color-success)',           // Positive action (green)
  warning: 'var(--color-warning)',           // Needs attention (amber)
  danger: 'var(--color-error)',              // Destructive/error (red)
  info: 'var(--color-info)',                 // Informational (blue)
  accent: 'var(--color-accent)',             // Accent highlights

  // Neutral colors
  text: 'var(--color-text)',                 // Primary text
  'text-muted': 'var(--color-text-muted)',   // Secondary text
  bg: 'var(--color-bg)',                     // Page background
  card: 'var(--color-card)',                 // Card background
  border: 'var(--color-border)',             // Border color
  input: 'var(--color-input)',               // Input background
  sidebar: 'var(--color-sidebar)',           // Sidebar background
} as const;

// ============================================
// SIZE CONSTANTS
// ============================================
// Standard sizes for buttons, inputs, etc.

export const sizes = {
  // Button sizes (height)
  button: {
    sm: '2rem',   // 32px
    md: '2.5rem', // 40px
    lg: '3rem',   // 48px
  },

  // Input sizes (height)
  input: {
    sm: '2rem',   // 32px
    md: '2.5rem', // 40px
    lg: '3rem',   // 48px
  },

  // Icon sizes
  icon: {
    xs: '1rem',   // 16px
    sm: '1.25rem', // 20px
    md: '1.5rem', // 24px
    lg: '2rem',   // 32px
    xl: '2.5rem', // 40px
  },

  // Sidebar
  sidebar: {
    width: '16rem',     // 256px
    collapsedWidth: '5rem', // 80px
  },
} as const;

// ============================================
// BREAKPOINTS
// ============================================
// Standard Tailwind breakpoints (for reference).

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// TRANSITIONS / ANIMATIONS
// ============================================
// Standard durations and easing functions.

export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
} as const;

// ============================================
// Z-INDEX SCALE
// ============================================
// Consistent z-index layering for modals, dropdowns, etc.

export const zIndex = {
  // Below main content
  below: '-10',
  
  // Default layer
  base: '1',
  
  // Dropdowns, tooltips
  dropdown: '1000',
  
  // Sticky headers, floating elements
  sticky: '1020',
  
  // Modals, overlays
  modal: '1050',
  
  // Modal backdrops
  backdrop: '1040',
  
  // Notifications, toasts (highest)
  notification: '9999',
} as const;

// ============================================
// USAGE GUIDE
// ============================================

/**
 * IMPORT AND USE
 * 
 * import { spacing, typography, shadows, radius, colors, sizes } from '@/constants/designTokens'
 * 
 * // In className
 * className={`p-${spacing.md} rounded-${radius.md} shadow-${shadows.lg.tailwind}`}
 * 
 * // For direct CSS values
 * <div style={{ padding: spacing.md, borderRadius: radius.md }}>
 *   {children}
 * </div>
 * 
 * // For component props
 * <Button size="md" /> // Uses sizes.button.md
 * <Input size="sm" />  // Uses sizes.input.sm
 * 
 * KEY PRINCIPLES:
 * - Always use 8px base unit (sm = 8px, md = 16px, lg = 24px, xl = 32px)
 * - Border radius: use only sm (4px), md (8px), lg (16px)
 * - Shadows: use sm for cards, md for hover, lg for modals
 * - Spacing: use consistent gaps (8px, 16px, 24px, 32px, 48px)
 * - Never hardcode values like '12px', '20px', '6px' - use tokens instead
 * - Typography: match heading/body sizes with h1-h4 and body/small
 */

export default {
  spacing,
  typography,
  shadows,
  radius,
  colors,
  sizes,
  breakpoints,
  transitions,
  zIndex,
};
