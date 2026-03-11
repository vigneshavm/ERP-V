import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/personal",
  assetPrefix: "/personal",
  transpilePackages: ["@repo/shared", "@repo/ui", "@repo/mfe-budget-planner"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
