import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/shared", "@repo/ui", "@repo/mfe-budget-planner"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
