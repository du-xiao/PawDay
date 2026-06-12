import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [],
  },
  experimental: {
    isrFlushToDisk: false,
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
