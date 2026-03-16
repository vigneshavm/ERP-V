import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/personal",
  assetPrefix: "/personal",
  transpilePackages: ["@repo/shared", "@repo/ui", "@repo/mfe-budget-planner"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
