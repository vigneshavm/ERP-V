import { tokens } from './tokens';

/** @type {import('tailwindcss').Config['theme']} */
export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: tokens.color.brand[50],
          500: tokens.color.brand[500],
          900: tokens.color.brand[900],
        },
        surface: {
          DEFAULT: tokens.color.surface.default,
          raised: tokens.color.surface.raised,
          deep: tokens.color.surface.deep,
        },
        text: tokens.color.text,
        success: tokens.color.success,
        warning: tokens.color.warning,
        error: tokens.color.error,
      },
      spacing: {
        '4xs': tokens.spacing['4xs'],
        '3xs': tokens.spacing['3xs'],
        xs: tokens.spacing.xs,
        sm: tokens.spacing.sm,
        md: tokens.spacing.md,
      },
      fontFamily: {
        sans: [tokens.font.sans, 'ui-sans-serif', 'system-ui'],
        mono: [tokens.font.mono, 'ui-monospace'],
        display: [tokens.font.display, 'sans-serif'],
      },
      borderRadius: {
        card: tokens.radius.card,
        button: tokens.radius.button,
      },
      animation: tokens.animations,
    },
  },
  plugins: [],
};

export default tailwindPreset;
