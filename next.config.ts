import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow multipart fields in addition to the 25 MiB file itself.
      bodySizeLimit: "30mb",
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
