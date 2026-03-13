import type { Config } from 'tailwindcss';
// @ts-ignore - Local repo package
import { tailwindPreset } from '@repo/design-tokens';

const config: Config = {
  // Use the shared preset as the base
  presets: [tailwindPreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Enterprise-specific theme refinements can go here
    },
  },
  plugins: [],
};

export default config;
