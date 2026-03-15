import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/business",
  transpilePackages: [
    "@repo/shared",
    "@repo/ui",
    "@yourcompany/ui-react",
    "@yourcompany/utils"
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
