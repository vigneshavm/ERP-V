import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/shared", "@repo/b2b-services"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // API Proxy
      // API Proxy - Personal Specific
      {
        source: "/api/personal/:path*",
        destination: "http://localhost:5001/api/personal/:path*",
      },
      {
        source: "/api/v1/transactions/:path*",
        destination: "http://localhost:5001/api/v1/transactions/:path*",
      },
      {
        source: "/api/v1/goals/:path*",
        destination: "http://localhost:5001/api/v1/goals/:path*",
      },
      {
        source: "/api/v1/budget/:path*",
        destination: "http://localhost:5001/api/v1/budget/:path*",
      },
      {
        source: "/api/v1/categories/:path*",
        destination: "http://localhost:5001/api/v1/categories/:path*",
      },
      {
        source: "/api/v1/accounts/:path*",
        destination: "http://localhost:5001/api/v1/accounts/:path*",
      },
      {
        source: "/api/v1/loans/:path*",
        destination: "http://localhost:5001/api/v1/loans/:path*",
      },
      {
        source: "/api/v1/personal/:path*",
        destination: "http://localhost:5001/api/v1/personal/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },

      // Personal MFE Assets & Pages
      {
        source: "/personal/_next/:path*",
        destination: "http://localhost:3002/personal/_next/:path*",
      },
      {
        source: "/personal/assets/:path*",
        destination: "http://localhost:3002/personal/assets/:path*",
      },
      {
        source: "/personal",
        destination: "http://localhost:3002/personal",
      },
      {
        source: "/personal/:path*",
        destination: "http://localhost:3002/personal/:path*",
      },

      // Online Store MFE Assets & Pages
      {
        source: "/business/store/_next/:path*",
        destination: "http://localhost:3005/business/store/_next/:path*",
      },
      {
        source: "/business/store/assets/:path*",
        destination: "http://localhost:3005/business/store/assets/:path*",
      },
      {
        source: "/business/store",
        destination: "http://localhost:3005/business/store",
      },
      {
        source: "/business/store/:path*",
        destination: "http://localhost:3005/business/store/:path*",
      },

      // Business MFE Assets & Pages
      {
        source: "/business/_next/:path*",
        destination: "http://localhost:3003/business/_next/:path*",
      },
      {
        source: "/business/assets/:path*",
        destination: "http://localhost:3003/business/assets/:path*",
      },
      {
        source: "/business",
        destination: "http://localhost:3003/business",
      },
      {
        source: "/business/:path*",
        destination: "http://localhost:3003/business/:path*",
      },

      // Enterprise MFE Assets & Pages
      {
        source: "/enterprise/_next/:path*",
        destination: "http://localhost:3004/enterprise/_next/:path*",
      },
      {
        source: "/enterprise/assets/:path*",
        destination: "http://localhost:3004/enterprise/assets/:path*",
      },
      {
        source: "/enterprise",
        destination: "http://localhost:3004/enterprise",
      },
      {
        source: "/enterprise/:path*",
        destination: "http://localhost:3004/enterprise/:path*",
      },
    ];
  },
};

export default nextConfig;
