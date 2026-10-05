import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Foto kandidat disimpan lokal di public/uploads.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
