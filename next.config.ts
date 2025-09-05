
import type { NextConfig } from "next";

const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
const isDockerBuild = process.env.DOCKER_BUILD === 'true' || process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: true, // Enable source maps for better debugging
  eslint: {
    // Allow builds to complete even with ESLint errors (use sparingly)
    ignoreDuringBuilds: false,
  },
  // Railway and Docker optimizations
  output: (isRailway || isDockerBuild) ? 'standalone' : undefined,
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // In production, restrict to specific domains
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // Allow iframe embedding from all domains
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' *", // Allow iframe embedding
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "images.pexels.com",
      },
      {
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
