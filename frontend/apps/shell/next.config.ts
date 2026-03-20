import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/ui",
    "@repo/shared",
    "@repo/mfe-auth",
    "@repo/b2b-services",
  ],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  async rewrites() {
    return [
      // Auth MFE (:3000)
      { source: "/login", destination: "http://localhost:3000/login" },
      { source: "/login/:path*", destination: "http://localhost:3000/login/:path*" },
      { source: "/_next/auth/:path*", destination: "http://localhost:3000/_next/:path*" },

      // Personal (:3002)
      { source: "/personal/_next/:path*", destination: "http://localhost:3002/personal/_next/:path*" },
      { source: "/personal", destination: "http://localhost:3002/personal" },
      { source: "/personal/:path*", destination: "http://localhost:3002/personal/:path*" },

      // Online Store (:3005)
      { source: "/business/store/_next/:path*", destination: "http://localhost:3005/business/store/_next/:path*" },
      { source: "/business/store", destination: "http://localhost:3005/business/store" },
      { source: "/business/store/:path*", destination: "http://localhost:3005/business/store/:path*" },

      // Business (:3003)
      { source: "/business/_next/:path*", destination: "http://localhost:3003/business/_next/:path*" },
      { source: "/business", destination: "http://localhost:3003/business" },
      { source: "/business/:path*", destination: "http://localhost:3003/business/:path*" },

      // Enterprise (:3004)
      { source: "/enterprise/_next/:path*", destination: "http://localhost:3004/enterprise/_next/:path*" },
      { source: "/enterprise", destination: "http://localhost:3004/enterprise" },
      { source: "/enterprise/:path*", destination: "http://localhost:3004/enterprise/:path*" },

      // Budget Planner (:3006)
      { source: "/budget/_next/:path*", destination: "http://localhost:3006/_next/:path*" },
      { source: "/budget", destination: "http://localhost:3006" },
      { source: "/budget/:path*", destination: "http://localhost:3006/:path*" },
    ];
  },
};

export default nextConfig;
