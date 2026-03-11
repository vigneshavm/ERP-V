import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/business",
  assetPrefix: "/business",
  transpilePackages: ["@repo/shared", "@repo/ui"],
};

export default nextConfig;
