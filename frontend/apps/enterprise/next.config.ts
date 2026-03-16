import type { NextConfig } from "next";
import path from 'path';
import { NextFederationPlugin } from '@module-federation/nextjs-mf';

const nextConfig: NextConfig = {
  basePath: "/enterprise",
  assetPrefix: "/enterprise",
  transpilePackages: [
    "@repo/shared",
    "@repo/ui",
    "@repo/design-tokens",
    "@yourcompany/finance-lib",
    "@yourcompany/utils",
    "@yourcompany/ui-react"
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@yourcompany/ui-react': path.resolve(__dirname, '../../packages/ui/src'),
    };
    return config;
  },
};

// eslint-disable-next-line @typescript-eslint/no-require-imports -- TODO(TS-FIX): Phase 2/3 fix
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
