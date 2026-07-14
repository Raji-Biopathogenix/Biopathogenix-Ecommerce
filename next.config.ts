import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/admin", destination: "https://api.biopathogenix.com/admin" },
      { source: "/admin/:path*", destination: "https://api.biopathogenix.com/admin/:path*" },
      { source: "/static/:path*", destination: "https://api.biopathogenix.com/static/:path*" },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'biopathogenix.com',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
