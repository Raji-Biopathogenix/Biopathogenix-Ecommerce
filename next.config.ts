import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/admin", destination: "https://api.biopathogenix.com/admin/", permanent: false },
      { source: "/admin/:path*", destination: "https://api.biopathogenix.com/admin/:path*", permanent: false },
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
