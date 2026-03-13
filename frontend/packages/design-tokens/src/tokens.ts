export const tokens = {
  color: {
    brand: {
      50: '#EFF6FF',
      500: '#3B82F6',
      900: '#1E3A8A',
    },
    surface: {
      default: '#FFFFFF',
      raised: '#F9FAFB',
      deep: 'rgb(5, 7, 10)',
    },
    text: {
      primary: 'rgb(230, 237, 243)',
      secondary: 'rgb(139, 148, 158)',
      muted: 'rgb(110, 118, 129)',
    },
    success: 'rgb(16, 185, 129)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(244, 63, 194)',
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
    body: 'Plus Jakarta Sans',
  },
  radius: {
    card: '12px',
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
