import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [],
  },
  experimental: {
    isrFlushToDisk: false,
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
