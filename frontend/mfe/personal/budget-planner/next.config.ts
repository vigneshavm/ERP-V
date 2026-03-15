import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/personal",
  transpilePackages: [
    "@repo/shared",
    "@repo/ui",
    "@yourcompany/ui-react",
    "@yourcompany/utils",
    "@yourcompany/finance-lib"
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
      '@yourcompany/ui-react': '@repo/ui',
    };
    return config;
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
