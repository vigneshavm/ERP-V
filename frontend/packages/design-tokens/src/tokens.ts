export const tokens = {
  color: {
    // Legacy support
    brand: {
      50: '#EFF6FF',
      500: '#3B82F6',
      900: '#1E3A8A',
    },
    // New Semantic Tokens
    primary: 'var(--primary-color)',
    background: 'var(--bg-color)',
    card: 'var(--card-bg)',
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      muted: 'var(--color-text-muted)',
    },
    success: 'var(--success-color)',
    warning: 'var(--warning-color)',
    error: 'var(--danger-color)',
    surface: {
      default: 'var(--surface-default)',
      raised: 'var(--surface-raised)',
      deep: 'var(--surface-deep)',
    },
  },
  spacing: {
    '4xs': '2px',
    '3xs': '4px',
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  font: {
    sans: 'Inter',
    mono: 'JetBrains Mono',
    display: 'Outfit',
    heading: 'var(--font-heading)',
    body: 'var(--font-body)',
  },
  radius: {
    card: 'var(--radius-card)',
    button: '6px',
  },
  animations: {
    'fade-in': 'fade-in 0.6s ease-out',
    'slide-down': 'slide-down 0.5s ease-out',
    'aura': 'aura-float 20s ease-in-out infinite',
  }
} as const;

export type Tokens = typeof tokens;
export default tokens;
