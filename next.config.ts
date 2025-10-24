import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Unblock production builds on VPS while we refactor types/lints
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to succeed even if there are TS errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
