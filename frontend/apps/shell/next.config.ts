import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/ui",
    "@repo/shared",
    "@repo/mfe-auth",
    "@repo/b2b-services",
    "personal",
    "business",
    "enterprise-manager"
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
