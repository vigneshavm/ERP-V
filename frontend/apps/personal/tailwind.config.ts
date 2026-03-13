import type { Config } from 'tailwindcss';
// @ts-ignore - Local repo package
import { tailwindPreset } from '@repo/design-tokens';

const config: Config = {
  presets: [tailwindPreset],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  corePlugins: {
    // Shell app (enterprise) handles the reset
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
